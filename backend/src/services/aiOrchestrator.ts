import { prisma } from '../db/client';
import { InboundMessagePayload } from '../types';
import { queryKnowledgeBase } from './ragService';
import { ToolService, liveChatEmitter } from './toolService';
import { OutboundRouter } from './outboundRouter';
import OpenAI from 'openai';
import { env } from '../config/env';
import { ChatCompletionMessageParam, ChatCompletionTool } from 'openai/resources';

const openai = new OpenAI({
  apiKey: env.OPENAI_API_KEY || 'dummy-key',
});

export class AIOrchestrator {
  /**
   * Main entry point to process an inbound message payload.
   */
  static async processMessage(payload: InboundMessagePayload): Promise<void> {
    const { tenantApiKey, channel, senderId, senderName, messageId, body } = payload;
    console.log(`[AIOrchestrator] Processing message from ${senderId} [${channel}]`);

    // 1. Resolve Tenant
    const tenant = await prisma.tenant.findUnique({
      where: { apiKey: tenantApiKey },
    });

    if (!tenant) {
      console.error(`[AIOrchestrator] Access denied: Tenant with API Key ${tenantApiKey} not found.`);
      return;
    }

    // Use tenant-specific key if configured, otherwise fallback to system key
    const currentOpenaiKey =
  env.OPENAI_API_KEY === 'dummy-key'
    ? 'dummy-key'
    : (tenant.openaiKey || env.OPENAI_API_KEY);

    // 2. Resolve or Create Customer
    let customer = await prisma.customer.findFirst({
      where: {
        tenantId: tenant.id,
        OR: [
          channel === 'WHATSAPP' || channel === 'VOICE' ? { phone: senderId } : {},
          channel === 'INSTAGRAM' ? { instagramId: senderId } : {},
          channel === 'FACEBOOK' ? { facebookId: senderId } : {},
        ].filter(condition => Object.keys(condition).length > 0)
      }
    });

    if (!customer) {
      customer = await prisma.customer.create({
        data: {
          tenantId: tenant.id,
          name: senderName || 'Anonymous Customer',
          phone: (channel === 'WHATSAPP' || channel === 'VOICE') ? senderId : null,
          instagramId: channel === 'INSTAGRAM' ? senderId : null,
          facebookId: channel === 'FACEBOOK' ? senderId : null,
          metadata: {}
        }
      });
    }

    // 3. Resolve or Create Conversation Thread
    let conversation = await prisma.conversation.findUnique({
      where: {
        customerId_channel: {
          customerId: customer.id,
          channel: channel
        }
      }
    });

    if (!conversation) {
      conversation = await prisma.conversation.create({
        data: {
          tenantId: tenant.id,
          customerId: customer.id,
          channel: channel,
          status: 'AI_MANAGED'
        }
      });
    }

    // 4. Record Customer Inbound Message
    const savedCustomerMessage = await prisma.message.create({
      data: {
        conversationId: conversation.id,
        senderType: 'CUSTOMER',
        body: body,
        metadata: { externalMessageId: messageId }
      }
    });

    // Notify Dashboard of new message (real-time chat updates)
    liveChatEmitter.emit('new-message', {
      conversationId: conversation.id,
      message: savedCustomerMessage
    });

    // If conversation is marked for human pending, skip AI generation
    if (conversation.status === 'HUMAN_PENDING') {
      console.log(`[AIOrchestrator] Skipped AI response: Conversation ${conversation.id} is managed by a human.`);
      return;
    }

    // 5. STEP A: Retrieve last 10 messages of conversation history
    const history = await prisma.message.findMany({
      where: { conversationId: conversation.id },
      orderBy: { createdAt: 'desc' },
      take: 10
    });

    // Reverse history to chronologically arrange
    const messagesHistory: ChatCompletionMessageParam[] = history
      .reverse()
      .map(msg => ({
        role: msg.senderType === 'CUSTOMER' ? 'user' : 'assistant',
        content: msg.body
      }));

    // 6. STEP B: RAG Step (Query knowledge base chunks)
    const contextChunks = await queryKnowledgeBase(tenant.id, body, 3);
    const contextText = contextChunks.map(chunk => `[Source: ${chunk.title}]\n${chunk.content}`).join('\n\n');

    // 7. STEP C: LLM Setup system prompt with Persona Boundaries
    const systemPrompt = `You are a highly efficient virtual AI receptionist. You are answering customer queries on behalf of "${tenant.name}".
    
Persona & Safety Rules:
- Only answer queries using the provided company Knowledge Base context.
- Be concise, polite, and professional.
- If you do not know the answer based on the Knowledge Base, explain that you don't know and immediately call the "transferToHuman" function.
- If the user asks to speak to an agent or representative, call the "transferToHuman" function.
- If the user wants to book, schedule, or reserve an appointment, collect their name and preferred date/time, and execute "bookAppointment".
- If the user mentions business details or contact data (e.g. name, email, phone, requirements), capture them and call "exportToSheet" to save the lead.

Knowledge Base Context:
${contextText || 'No context matches found. Offer to transfer to a human if query requires internal knowledge.'}`;

    // 8. STEP D: Function Calling / Tool Definitions
    const tools: ChatCompletionTool[] = [
      {
        type: 'function',
        function: {
          name: 'bookAppointment',
          description: 'Schedules a physical or virtual appointment for a customer',
          parameters: {
            type: 'object',
            properties: {
              dateTime: {
                type: 'string',
                description: 'The preferred date and time formatted in ISO-8601 (e.g. 2026-05-30T15:00:00Z)'
              },
              customerName: {
                type: 'string',
                description: 'The full name of the customer booking the appointment'
              }
            },
            required: ['dateTime', 'customerName']
          }
        }
      },
      {
        type: 'function',
        function: {
          name: 'exportToSheet',
          description: 'Saves lead parameters (email, phone, requirements) into a CRM google sheet sink',
          parameters: {
            type: 'object',
            properties: {
              name: { type: 'string', description: 'Customer full name' },
              email: { type: 'string', description: 'Email address' },
              phone: { type: 'string', description: 'Phone number' },
              company: { type: 'string', description: 'Company name' },
              budget: { type: 'string', description: 'Budget parameters' },
              notes: { type: 'string', description: 'Specific project details or notes' }
            },
            required: ['name']
          }
        }
      },
      {
        type: 'function',
        function: {
          name: 'transferToHuman',
          description: 'Stops AI automated replies and transfers the thread to a human live agent queue',
          parameters: {
            type: 'object',
            properties: {}
          }
        }
      }
    ];

    // Assemble payload
    const apiMessages: ChatCompletionMessageParam[] = [
      { role: 'system', content: systemPrompt },
      ...messagesHistory
    ];

    // Ensure we handle local-only/dummy LLM completions for safety and dry runs
    let aiResponseText = '';
    let toolCallsTriggered = false;

    if (!currentOpenaiKey || currentOpenaiKey.startsWith('your-') || currentOpenaiKey === 'dummy-key') {
      // Mock LLM Engine in the absence of API configuration
      console.log('[AIOrchestrator] Running simulated LLM engine...');
      const lowerBody = body.toLowerCase();
      
      if (lowerBody.includes('human') || lowerBody.includes('speak to agent') || lowerBody.includes('representative')) {
        // Trigger handoff mock
        const toolResult = await ToolService.transferToHuman({ conversationId: conversation.id });
        aiResponseText = "I have successfully transferred this conversation to a live agent. Someone will be with you shortly.";
        toolCallsTriggered = true;
      } else if (lowerBody.includes('book') || lowerBody.includes('appointment') || lowerBody.includes('schedule')) {
        // Trigger appointment mock
        const toolResult = await ToolService.bookAppointment({
          dateTime: new Date(Date.now() + 86400000 * 2).toISOString(), // 2 days later
          customerName: customer.name || 'Valued Customer',
          conversationId: conversation.id
        });
        aiResponseText = `I've booked an appointment for you on ${toolResult.data.appointmentDate}. Looking forward to speaking!`;
        toolCallsTriggered = true;
      } else if (lowerBody.includes('export') || lowerBody.includes('lead') || lowerBody.includes('my email is')) {
        // Trigger CRM mock
        const toolResult = await ToolService.exportToSheet({
          conversationId: conversation.id,
          leadData: {
            name: customer.name || 'Anonymous Customer',
            email: 'lead@example.com',
            phone: customer.phone || '00000000',
            notes: body
          }
        });
        aiResponseText = "Thank you! I have saved your details in our spreadsheet CRM. An account executive will reach out.";
        toolCallsTriggered = true;
      } else {
        // Regular query answering from mock chunks
        if (contextChunks.length > 0) {
          aiResponseText = `Based on the company guidelines: "${contextChunks[0].content}" Is there anything else I can help you with?`;
        } else {
          aiResponseText = "Hi there! I am your AI assistant. How can I help you today?";
        }
      }
    } else {
      // Direct integration with OpenAI sdk
      const response = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: apiMessages,
        tools: tools,
        tool_choice: 'auto'
      });

      const responseMessage = response.choices[0].message;

      if (responseMessage.tool_calls && responseMessage.tool_calls.length > 0) {
        toolCallsTriggered = true;
        for (const toolCall of responseMessage.tool_calls) {
          const toolName = toolCall.function.name;
          const toolArgs = JSON.parse(toolCall.function.arguments);

          console.log(`[AIOrchestrator] Executing tool: ${toolName} with args:`, toolArgs);

          let toolResultStr = '';
          if (toolName === 'bookAppointment') {
            const result = await ToolService.bookAppointment({
              dateTime: toolArgs.dateTime,
              customerName: toolArgs.customerName,
              conversationId: conversation.id
            });
            toolResultStr = JSON.stringify(result);
          } else if (toolName === 'exportToSheet') {
            const result = await ToolService.exportToSheet({
              leadData: toolArgs,
              conversationId: conversation.id
            });
            toolResultStr = JSON.stringify(result);
          } else if (toolName === 'transferToHuman') {
            const result = await ToolService.transferToHuman({ conversationId: conversation.id });
            toolResultStr = JSON.stringify(result);
          }

          // Follow up with LLM after tool outputs
          const secondResponse = await openai.chat.completions.create({
            model: 'gpt-4o',
            messages: [
              { role: 'system', content: systemPrompt },
              ...messagesHistory,
              responseMessage,
              {
                role: 'tool',
                tool_call_id: toolCall.id,
                content: toolResultStr
              }
            ]
          });
          aiResponseText = secondResponse.choices[0].message.content || 'Action executed successfully.';
        }
      } else {
        aiResponseText = responseMessage.content || '';
      }
    }

    // 9. Save AI response to DB
    const savedAIMessage = await prisma.message.create({
      data: {
        conversationId: conversation.id,
        senderType: 'AI',
        body: aiResponseText,
        metadata: { toolCallsTriggered }
      }
    });

    // Notify agent dashboard of outbound AI reply
    liveChatEmitter.emit('new-message', {
      conversationId: conversation.id,
      message: savedAIMessage
    });

    // 10. STEP E: Dispatch reply via outbound adapter
    await OutboundRouter.sendResponse({
      conversationId: conversation.id,
      channel: channel,
      recipientId: senderId,
      body: aiResponseText
    });
  }
}

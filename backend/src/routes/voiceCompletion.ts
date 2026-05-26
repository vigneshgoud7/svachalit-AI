import { Router, Request, Response } from 'express';
import { prisma } from '../db/client';
import { queryKnowledgeBase } from '../services/ragService';
import { ToolService } from '../services/toolService';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { env } from '../config/env';
import { Channel } from '@prisma/client';

const router = Router();

/**
 * OpenAI-compatible completions endpoint for Vapi Custom LLM Integration.
 * POST /api/v1/voice/completion
 */
router.post('/completion', async (req: Request, res: Response) => {
  try {
    const { messages, tools, tool_choice } = req.body;
    console.log('[Vapi LLM] Received Custom LLM request body:', JSON.stringify(req.body, null, 2));

    // 1. Resolve Tenant
    const tenantApiKey = (req.headers['x-tenant-api-key'] || req.query.apiKey) as string;
    if (!tenantApiKey) {
      return res.status(401).json({ error: 'Tenant API Key required (apiKey query or x-tenant-api-key header)' });
    }

    const tenant = await prisma.tenant.findUnique({
      where: { apiKey: tenantApiKey }
    });

    if (!tenant) {
      return res.status(404).json({ error: 'Tenant not found' });
    }

    // 2. Locate the active call reference for logging
    // Vapi provides a headers container or call object in the root
    const callMetadata = req.body.call || {};
    const callSid = callMetadata.id || 'vapi_call_active';
    const customerPhone = callMetadata.customer?.number || '+15551000';

    // 3. Resolve Customer & Conversation
    let customer = await prisma.customer.findFirst({
      where: { tenantId: tenant.id, phone: customerPhone }
    });

    if (!customer) {
      customer = await prisma.customer.create({
        data: {
          tenantId: tenant.id,
          name: 'Voice Caller',
          phone: customerPhone,
          metadata: {}
        }
      });
    }

    let conversation = await prisma.conversation.findUnique({
      where: {
        customerId_channel: {
          customerId: customer.id,
          channel: Channel.VOICE
        }
      }
    });

    if (!conversation) {
      conversation = await prisma.conversation.create({
        data: {
          tenantId: tenant.id,
          customerId: customer.id,
          channel: Channel.VOICE,
          status: 'AI_MANAGED'
        }
      });
    }

    // 4. Extract Last Message as Customer Input
    const userMessages = messages.filter((m: any) => m.role === 'user');
    const lastUserText = userMessages[userMessages.length - 1]?.content || 'Hello';

    // Persist User Transcription text in database
    const savedCustomerMessage = await prisma.message.create({
      data: {
        conversationId: conversation.id,
        senderType: 'CUSTOMER',
        body: lastUserText,
        metadata: { callSid, source: 'vapi_stt' }
      }
    });

    // Notify Dashboard
    ToolService.liveChatEmitter.emit('new-message', {
      conversationId: conversation.id,
      message: savedCustomerMessage
    });

    // Broadcast live call transcription state
    ToolService.liveChatEmitter.emit('crm-update', {
      conversationId: conversation.id,
      customerId: customer.id,
      conversation: {
        ...conversation,
        metadata: {
          activeCall: true,
          liveTranscript: lastUserText,
          callSid,
          speakingState: 'AI_THINKING',
          callStart: new Date().toISOString()
        }
      }
    });

    // If human has taken over, return escalation message directly
    if (conversation.status === 'HUMAN_PENDING') {
      const escalationReply = 'Transferring you to a live agent. Please hold.';
      const savedAIMessage = await prisma.message.create({
        data: {
          conversationId: conversation.id,
          senderType: 'AI',
          body: escalationReply,
        }
      });

      ToolService.liveChatEmitter.emit('new-message', {
        conversationId: conversation.id,
        message: savedAIMessage
      });

      return res.json(buildOpenAIResponse(escalationReply));
    }

    // 5. Query RAG Context
    const contextChunks = await queryKnowledgeBase(tenant.id, lastUserText, 3);
    const contextText = contextChunks.map(c => `[Source: ${c.title}]\n${c.content}`).join('\n\n');

    // 6. Gemini Orchestration
    const currentApiKey = tenant.openaiKey || env.GEMINI_API_KEY;
    const systemPrompt = `You are a professional voice AI assistant for "${tenant.name}".
    
Rules:
- Speak concisely and conversationally. Avoid bullet points, lists, or markdown.
- Only use information from the Knowledge Base context below.
- If you don't know, state it and call the "transferToHuman" function.
- If the customer wants an agent, call "transferToHuman".
- If the customer wants to schedule, call "bookAppointment".
- If they give lead details (email, name), call "exportToSheet".

Knowledge Base Context:
${contextText || 'No direct matches found.'}`;

    // Gemini tool specs (capitalized types required)
    const geminiTools = [
      {
        functionDeclarations: [
          {
            name: 'bookAppointment',
            description: 'Schedules a physical or virtual appointment for a customer',
            parameters: {
              type: 'OBJECT',
              properties: {
                dateTime: { type: 'STRING', description: 'ISO-8601 date time' },
                customerName: { type: 'STRING', description: 'Customer full name' }
              },
              required: ['dateTime', 'customerName']
            }
          },
          {
            name: 'exportToSheet',
            description: 'Saves lead parameters to the CRM Google sheet sink',
            parameters: {
              type: 'OBJECT',
              properties: {
                name: { type: 'STRING' },
                email: { type: 'STRING' },
                phone: { type: 'STRING' },
                notes: { type: 'STRING' }
              },
              required: ['name']
            }
          },
          {
            name: 'transferToHuman',
            description: 'Stops automated response and transfers caller to a live human agent',
            parameters: {
              type: 'OBJECT',
              properties: {}
            }
          }
        ]
      }
    ];

    let responseText = '';
    let openAIToolCalls: any[] = [];

    if (!currentApiKey || currentApiKey.startsWith('your-') || currentApiKey === 'dummy-key') {
      // Mock voice completions
      console.log('[Vapi LLM] Running mock LLM completion...');
      const lower = lastUserText.toLowerCase();

      if (lower.includes('human') || lower.includes('speak to agent') || lower.includes('representative')) {
        openAIToolCalls = [{
          id: 'call_mock_transfer',
          type: 'function',
          function: { name: 'transferToHuman', arguments: '{}' }
        }];
      } else if (lower.includes('book') || lower.includes('schedule') || lower.includes('appointment')) {
        const dummyArgs = JSON.stringify({
          dateTime: new Date(Date.now() + 86400000).toISOString(),
          customerName: customer.name || 'Valued Customer'
        });
        openAIToolCalls = [{
          id: 'call_mock_book',
          type: 'function',
          function: { name: 'bookAppointment', arguments: dummyArgs }
        }];
      } else if (lower.includes('export') || lower.includes('my email is')) {
        const dummyArgs = JSON.stringify({
          name: customer.name || 'Voice Caller',
          email: 'caller@example.com',
          phone: customer.phone || '00000000'
        });
        openAIToolCalls = [{
          id: 'call_mock_export',
          type: 'function',
          function: { name: 'exportToSheet', arguments: dummyArgs }
        }];
      } else {
        responseText = contextChunks.length > 0
          ? `According to company records, ${contextChunks[0].content}`
          : "Hello, I am your voice receptionist. How can I help you today?";
      }
    } else {
      // Live Gemini SDK call
      const genAI = new GoogleGenerativeAI(currentApiKey);
      const model = genAI.getGenerativeModel({
        model: 'gemini-1.5-flash',
        systemInstruction: systemPrompt,
        tools: geminiTools
      });

      // Map OpenAI history parameter shape to Gemini shapes
      const geminiHistory = messages.slice(0, -1).map((m: any) => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content || '' }]
      })).filter((h: any) => h.parts[0].text);

      const chat = model.startChat({ history: geminiHistory });
      const geminiResponse = await chat.sendMessage(lastUserText);
      const funcCalls = geminiResponse.response.functionCalls;

      if (funcCalls && funcCalls.length > 0) {
        // Map Gemini function calls to OpenAI structure for Vapi compatibility
        openAIToolCalls = funcCalls.map((call, idx) => ({
          id: `call_${call.name}_${idx}_${Date.now()}`,
          type: 'function',
          function: {
            name: call.name,
            arguments: JSON.stringify(call.args)
          }
        }));
      } else {
        responseText = geminiResponse.response.text() || '';
      }
    }

    // 7. Format & Return response
    if (openAIToolCalls.length > 0) {
      // Return tool calls array to Vapi
      return res.json({
        id: `chatcmpl-${Date.now()}`,
        object: 'chat.completion',
        created: Math.floor(Date.now() / 1000),
        model: 'gemini-1.5-flash',
        choices: [
          {
            index: 0,
            message: {
              role: 'assistant',
              content: null,
              tool_calls: openAIToolCalls
            },
            finish_reason: 'tool_calls'
          }
        ]
      });
    } else {
      // Log assistant reply in Database
      const savedAIMessage = await prisma.message.create({
        data: {
          conversationId: conversation.id,
          senderType: 'AI',
          body: responseText,
        }
      });

      ToolService.liveChatEmitter.emit('new-message', {
        conversationId: conversation.id,
        message: savedAIMessage
      });

      // Broadcast finished thinking state
      ToolService.liveChatEmitter.emit('crm-update', {
        conversationId: conversation.id,
        customerId: customer.id,
        conversation: {
          ...conversation,
          metadata: {
            activeCall: true,
            liveTranscript: lastUserText,
            callSid,
            speakingState: 'AI_SPEAKING',
            callStart: new Date().toISOString()
          }
        }
      });

      return res.json(buildOpenAIResponse(responseText));
    }
  } catch (error) {
    console.error('[Vapi LLM] Error generating voice completions:', error);
    return res.status(500).json(buildOpenAIResponse("I'm sorry, I encountered an internal server error. Please hold."));
  }
});

/**
 * Format OpenAI completion response payload helper
 */
function buildOpenAIResponse(text: string) {
  return {
    id: `chatcmpl-${Date.now()}`,
    object: 'chat.completion',
    created: Math.floor(Date.now() / 1000),
    model: 'gemini-1.5-flash',
    choices: [
      {
        index: 0,
        message: {
          role: 'assistant',
          content: text
        },
        finish_reason: 'stop'
      }
    ]
  };
}

export default router;

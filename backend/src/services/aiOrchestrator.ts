import { prisma } from '../db/client';
import { InboundMessagePayload } from '../types';
import { queryKnowledgeBase } from './ragService';
import { ToolService } from './toolService';
import { OutboundRouter } from './outboundRouter';
import {
  GoogleGenerativeAI,
  SchemaType
} from '@google/generative-ai';
import { env } from '../config/env';

export class AIOrchestrator {
  /**
   * Main entry point to process an inbound message payload.
   */
  static async processMessage(
    payload: InboundMessagePayload
  ): Promise<void> {
    const {
      tenantApiKey,
      channel,
      senderId,
      senderName,
      messageId,
      body
    } = payload;

    console.log(
      `[AIOrchestrator] Processing message from ${senderId} [${channel}]`
    );

    // 1. Resolve Tenant
    const tenant = await prisma.tenant.findUnique({
      where: { apiKey: tenantApiKey }
    });

    if (!tenant) {
      console.error(
        `[AIOrchestrator] Access denied: Tenant with API Key ${tenantApiKey} not found.`
      );
      return;
    }

    // Use tenant-specific key if configured, otherwise fallback
    const currentApiKey = env.GEMINI_API_KEY;

    // 2. Resolve or Create Customer
    let customer = await prisma.customer.findFirst({
      where: {
        tenantId: tenant.id,
        OR: [
          channel === 'WHATSAPP' || channel === 'VOICE'
            ? { phone: senderId }
            : {},
          channel === 'INSTAGRAM'
            ? { instagramId: senderId }
            : {},
          channel === 'FACEBOOK'
            ? { facebookId: senderId }
            : {}
        ].filter(
          (condition) =>
            Object.keys(condition).length > 0
        )
      }
    });

    if (!customer) {
      customer = await prisma.customer.create({
        data: {
          tenantId: tenant.id,
          name: senderName || 'Anonymous Customer',
          phone:
            channel === 'WHATSAPP' ||
            channel === 'VOICE'
              ? senderId
              : null,
          instagramId:
            channel === 'INSTAGRAM'
              ? senderId
              : null,
          facebookId:
            channel === 'FACEBOOK'
              ? senderId
              : null,
          metadata: {}
        }
      });
    }

    // 3. Resolve or Create Conversation
    let conversation =
      await prisma.conversation.findUnique({
        where: {
          customerId_channel: {
            customerId: customer.id,
            channel: channel
          }
        }
      });

    if (!conversation) {
      conversation =
        await prisma.conversation.create({
          data: {
            tenantId: tenant.id,
            customerId: customer.id,
            channel: channel,
            status: 'AI_MANAGED'
          }
        });
    }

    // 4. Save Customer Message
    const savedCustomerMessage =
      await prisma.message.create({
        data: {
          conversationId: conversation.id,
          senderType: 'CUSTOMER',
          body: body,
          metadata: {
            externalMessageId: messageId
          }
        }
      });

    // Notify frontend
    ToolService.liveChatEmitter.emit(
      'new-message',
      {
        conversationId: conversation.id,
        message: savedCustomerMessage
      }
    );

    // Skip AI if human takeover active
    if (conversation.status === 'HUMAN_PENDING') {
      console.log(
        `[AIOrchestrator] Skipped AI response: Human-managed thread.`
      );
      return;
    }

    // 5. Load Recent Conversation History
    const history = await prisma.message.findMany({
      where: {
        conversationId: conversation.id
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 10
    });

    const messagesHistory = history
      .reverse()
      .map((msg) => ({
        role:
          msg.senderType === 'CUSTOMER'
            ? 'user'
            : 'model',
        parts: [
          {
            text: msg.body
          }
        ]
      }));

    // Remove current message from history
    if (messagesHistory.length > 0) {
      messagesHistory.pop();
    }

    // 6. RAG Knowledge Base Search
    const contextChunks =
      await queryKnowledgeBase(
        tenant.id,
        body,
        3
      );

    const contextText = contextChunks
      .map(
        (chunk) =>
          `[Source: ${chunk.title}]\n${chunk.content}`
      )
      .join('\n\n');

    // 7. System Prompt
    const systemPrompt = `
You are a highly efficient virtual AI receptionist answering customer queries for "${tenant.name}".

Rules:
- Only answer using provided knowledge base context.
- Be concise, polite, and professional.
- If unsure, transfer to a human.
- If user asks for an agent, transfer to a human.
- If user wants to schedule something, book an appointment.
- If user provides contact details or business requirements, export lead data.

Knowledge Base Context:
${
  contextText ||
  'No context matches found. Offer human transfer if needed.'
}
`;

    // 8. Gemini Tool Definitions
    const tools: any = [
      {
        functionDeclarations: [
          {
            name: 'bookAppointment',
            description:
              'Schedules an appointment',
            parameters: {
              type: SchemaType.OBJECT,
              properties: {
                dateTime: {
                  type: SchemaType.STRING,
                  description:
                    'ISO-8601 appointment date'
                },
                customerName: {
                  type: SchemaType.STRING,
                  description:
                    'Customer full name'
                }
              },
              required: [
                'dateTime',
                'customerName'
              ]
            }
          },
          {
            name: 'exportToSheet',
            description:
              'Exports CRM lead data',
            parameters: {
              type: SchemaType.OBJECT,
              properties: {
                name: {
                  type: SchemaType.STRING
                },
                email: {
                  type: SchemaType.STRING
                },
                phone: {
                  type: SchemaType.STRING
                },
                company: {
                  type: SchemaType.STRING
                },
                budget: {
                  type: SchemaType.STRING
                },
                notes: {
                  type: SchemaType.STRING
                }
              },
              required: ['name']
            }
          },
          {
            name: 'transferToHuman',
            description:
              'Transfers thread to a human agent',
            parameters: {
              type: SchemaType.OBJECT,
              properties: {}
            }
          }
        ]
      }
    ];

    let aiResponseText = '';
    let toolCallsTriggered = false;

    // MOCK MODE
    if (
      !currentApiKey ||
      currentApiKey.startsWith('your-') ||
      currentApiKey === 'dummy-key'
    ) {
      console.log(
        '[AIOrchestrator] Running simulated LLM engine...'
      );

      const lowerBody = body.toLowerCase();

      if (
        lowerBody.includes('human') ||
        lowerBody.includes('agent') ||
        lowerBody.includes('representative')
      ) {
        await ToolService.transferToHuman({
          conversationId: conversation.id
        });

        aiResponseText =
          'I have transferred this conversation to a live agent.';

        toolCallsTriggered = true;
      } else if (
        lowerBody.includes('book') ||
        lowerBody.includes(
          'appointment'
        ) ||
        lowerBody.includes('schedule')
      ) {
        const toolResult =
          await ToolService.bookAppointment({
            dateTime: new Date(
              Date.now() + 86400000 * 2
            ).toISOString(),
            customerName:
              customer.name ||
              'Valued Customer',
            conversationId:
              conversation.id
          });

        aiResponseText = `I've booked your appointment for ${new Date(
          toolResult.data.appointmentDate
        ).toLocaleString()}.`;

        toolCallsTriggered = true;
      } else if (
        lowerBody.includes('export') ||
        lowerBody.includes('lead') ||
        lowerBody.includes(
          'my email is'
        )
      ) {
        await ToolService.exportToSheet({
          conversationId:
            conversation.id,
          leadData: {
            name:
              customer.name ||
              'Anonymous Customer',
            email: 'lead@example.com',
            phone:
              customer.phone ||
              '00000000',
            notes: body
          }
        });

        aiResponseText =
          'Your lead details have been saved successfully.';

        toolCallsTriggered = true;
      } else {
        if (contextChunks.length > 0) {
          aiResponseText = `Based on our company information: ${contextChunks[0].content}`;
        } else {
          aiResponseText =
            'Hello! How can I help you today?';
        }
      }
    } else {
      // REAL GEMINI MODE
      try {
        const genAI =
          new GoogleGenerativeAI(
            currentApiKey
          );

        const model =
          genAI.getGenerativeModel({
            model: 'gemini-1.5-flash-latest',
            systemInstruction:
              systemPrompt,
            tools: tools
          });

        const chat = model.startChat({
          history: messagesHistory
        });

        const responseResult =
          await chat.sendMessage(body);
          console.log(
            '[Gemini Raw Response]',
            JSON.stringify(responseResult.response,null,2)
          );

        const functionCalls =
          responseResult.response.functionCalls();

        if (
          functionCalls &&
          functionCalls.length > 0
        ) {
          toolCallsTriggered = true;

          for (const call of functionCalls as any[]) {
            const toolName = call.name;
            const toolArgs: any =
              call.args || {};

            console.log(
              `[AIOrchestrator] Executing Gemini tool call: ${toolName}`,
              toolArgs
            );

            let toolResult: any = {};

            if (
              toolName ===
              'bookAppointment'
            ) {
              toolResult =
                await ToolService.bookAppointment(
                  {
                    dateTime:
                      toolArgs.dateTime,
                    customerName:
                      toolArgs.customerName,
                    conversationId:
                      conversation.id
                  }
                );
            } else if (
              toolName ===
              'exportToSheet'
            ) {
              toolResult =
                await ToolService.exportToSheet(
                  {
                    leadData: toolArgs,
                    conversationId:
                      conversation.id
                  }
                );
            } else if (
              toolName ===
              'transferToHuman'
            ) {
              toolResult =
                await ToolService.transferToHuman(
                  {
                    conversationId:
                      conversation.id
                  }
                );
            }

            const secondResponse =
              await chat.sendMessage([
                {
                  functionResponse: {
                    name: toolName,
                    response: {
                      result: toolResult
                    }
                  }
                }
              ]);

            aiResponseText =
              secondResponse.response.text() ||
              'Action completed.';
          }
        } else {
          aiResponseText =
            responseResult.response.text() ||
            '';
        }
      } catch (error) {
        console.error(
          '[AIOrchestrator] Gemini API error:',
          error
        );

        aiResponseText =
          'Our AI assistant is temporarily unavailable, but your message has been received.';
      }
    }

    // Safety fallback
    if (
      !aiResponseText ||
      aiResponseText.trim() === ''
    ) {
      aiResponseText =
        'Thanks for reaching out. Your message has been received.';
    }

    // 9. Save AI Message
    const savedAIMessage =
      await prisma.message.create({
        data: {
          conversationId:
            conversation.id,
          senderType: 'AI',
          body: aiResponseText,
          metadata: {
            toolCallsTriggered
          }
        }
      });

    // Notify frontend
    ToolService.liveChatEmitter.emit(
      'new-message',
      {
        conversationId: conversation.id,
        message: savedAIMessage
      }
    );

    // 10. Dispatch outbound reply
    await OutboundRouter.sendResponse({
      conversationId: conversation.id,
      channel: channel,
      recipientId: senderId,
      body: aiResponseText
    });
  }
}
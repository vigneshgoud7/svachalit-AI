import { Router, Request, Response } from 'express';
import { prisma } from '../db/client';
import { queryKnowledgeBase } from '../services/ragService';
import { ToolService } from '../services/toolService';
import {
  GoogleGenerativeAI,
  SchemaType
} from '@google/generative-ai';
import { env } from '../config/env';
import { Channel } from '@prisma/client';
<<<<<<< HEAD
import { getTenantApiKey } from '../utils/tenant';

const router = Router();

function safeJsonParse(value: unknown) {
  if (typeof value !== 'string') {
    return value || {};
  }

  try {
    return JSON.parse(value);
  } catch {
    return {};
  }
}

=======

const router = Router();

>>>>>>> 765969bd30239688115f15de9bc845dfa0e7665c
/**
 * OpenAI-compatible completions endpoint for Vapi Custom LLM Integration.
 * POST /api/v1/voice/completion
 */
router.post('/completion', async (req: Request, res: Response) => {
  try {
    const { messages } = req.body;

    console.log(
      '[Vapi LLM] Received Custom LLM request body:',
      JSON.stringify(req.body, null, 2)
    );

    // 1. Resolve Tenant
<<<<<<< HEAD
    const tenantApiKey = getTenantApiKey(req) || (req.query.apiKey as string);
=======
    const tenantApiKey = (
      req.headers['x-tenant-api-key'] || req.query.apiKey
    ) as string;
>>>>>>> 765969bd30239688115f15de9bc845dfa0e7665c

    if (!tenantApiKey) {
      return res.status(401).json({
        error:
          'Tenant API Key required (apiKey query or x-tenant-api-key header)'
      });
    }

    const tenant = await prisma.tenant.findUnique({
      where: {
        apiKey: tenantApiKey
      }
    });

    if (!tenant) {
      return res.status(404).json({
        error: 'Tenant not found'
      });
    }

    // 2. Call Metadata
    const callMetadata = req.body.call || {};

    const callSid = callMetadata.id || 'vapi_call_active';

    const customerPhone =
      callMetadata.customer?.number || '+15551000';

    // 3. Resolve Customer
    let customer = await prisma.customer.findFirst({
      where: {
        tenantId: tenant.id,
        phone: customerPhone
      }
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

    // 4. Resolve Conversation
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

    // 5. Extract User Message
    const userMessages = messages.filter(
      (m: any) => m.role === 'user'
    );

    const lastUserText =
      userMessages[userMessages.length - 1]?.content || 'Hello';

    // Save customer message
    const savedCustomerMessage = await prisma.message.create({
      data: {
        conversationId: conversation.id,
        senderType: 'CUSTOMER',
        body: lastUserText,
        metadata: {
          callSid,
          source: 'vapi_stt'
        }
      }
    });

    ToolService.liveChatEmitter.emit('new-message', {
      conversationId: conversation.id,
      message: savedCustomerMessage
    });

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

    // Human escalation
    if (conversation.status === 'HUMAN_PENDING') {
      const escalationReply =
        'Transferring you to a live agent. Please hold.';

      const savedAIMessage = await prisma.message.create({
        data: {
          conversationId: conversation.id,
          senderType: 'AI',
          body: escalationReply
        }
      });

      ToolService.liveChatEmitter.emit('new-message', {
        conversationId: conversation.id,
        message: savedAIMessage
      });

      return res.json(buildOpenAIResponse(escalationReply));
    }

    // 6. Query RAG
    const contextChunks = await queryKnowledgeBase(
      tenant.id,
      lastUserText,
      3
    );

    const contextText = contextChunks
      .map(
        (c) => `[Source: ${c.title}]\n${c.content}`
      )
      .join('\n\n');

    // 7. Gemini Setup
    const currentApiKey =
      tenant.openaiKey || env.GEMINI_API_KEY;

    const systemPrompt = `
You are a professional voice AI assistant for "${tenant.name}".

Rules:
- Speak concisely and conversationally.
- Avoid markdown or bullet points.
- Use only the knowledge base information.
- If unsure, call transferToHuman.
- If customer asks for appointment, call bookAppointment.
- If customer provides lead details, call exportToSheet.

Knowledge Base Context:
${contextText || 'No direct matches found.'}
`;

    const geminiTools: any = [
      {
        functionDeclarations: [
          {
            name: 'bookAppointment',
            description:
              'Schedules a physical or virtual appointment for a customer',
            parameters: {
              type: SchemaType.OBJECT,
              properties: {
                dateTime: {
                  type: SchemaType.STRING,
                  description: 'ISO-8601 date time'
                },
                customerName: {
                  type: SchemaType.STRING,
                  description: 'Customer full name'
                }
              },
              required: ['dateTime', 'customerName']
            }
          },
          {
            name: 'exportToSheet',
            description:
              'Saves lead parameters to the CRM Google sheet sink',
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
              'Transfers caller to a live human agent',
            parameters: {
              type: SchemaType.OBJECT,
              properties: {}
            }
          }
        ]
      }
    ];

    let responseText = '';
    let openAIToolCalls: any[] = [];

    // Mock mode
    if (
      !currentApiKey ||
      currentApiKey.startsWith('your-') ||
      currentApiKey === 'dummy-key'
    ) {
      console.log(
        '[Vapi LLM] Running mock LLM completion...'
      );

      const lower = lastUserText.toLowerCase();

      if (
        lower.includes('human') ||
        lower.includes('agent') ||
        lower.includes('representative')
      ) {
        openAIToolCalls = [
          {
            id: 'call_mock_transfer',
            type: 'function',
            function: {
              name: 'transferToHuman',
              arguments: '{}'
            }
          }
        ];
      } else if (
        lower.includes('book') ||
        lower.includes('schedule') ||
        lower.includes('appointment')
      ) {
        const dummyArgs = JSON.stringify({
          dateTime: new Date(
            Date.now() + 86400000
          ).toISOString(),
          customerName:
            customer.name || 'Valued Customer'
        });

        openAIToolCalls = [
          {
            id: 'call_mock_book',
            type: 'function',
            function: {
              name: 'bookAppointment',
              arguments: dummyArgs
            }
          }
        ];
      } else {
        responseText =
          contextChunks.length > 0
            ? `According to company records, ${contextChunks[0].content}`
            : 'Hello, I am your voice receptionist. How can I help you today?';
      }
    } else {
      // Live Gemini SDK
      const genAI = new GoogleGenerativeAI(
        currentApiKey
      );

      const model = genAI.getGenerativeModel({
        model: 'gemini-1.5-flash',
        systemInstruction: systemPrompt,
        tools: geminiTools
      });

      const geminiHistory = messages
        .slice(0, -1)
        .map((m: any) => ({
          role:
            m.role === 'assistant'
              ? 'model'
              : 'user',
          parts: [
            {
              text: m.content || ''
            }
          ]
        }))
        .filter((h: any) => h.parts[0].text);

      const chat = model.startChat({
        history: geminiHistory
      });

      const geminiResponse =
        await chat.sendMessage(lastUserText);

      const funcCalls =
        geminiResponse.response.functionCalls();

      if (funcCalls && funcCalls.length > 0) {
        openAIToolCalls = funcCalls.map(
          (call: any, idx: number) => ({
            id: `call_${call.name}_${idx}_${Date.now()}`,
            type: 'function',
            function: {
              name: call.name,
<<<<<<< HEAD
              arguments: JSON.stringify(safeJsonParse(call.args))
=======
              arguments: JSON.stringify(call.args)
>>>>>>> 765969bd30239688115f15de9bc845dfa0e7665c
            }
          })
        );
      } else {
        responseText =
          geminiResponse.response.text() || '';
      }
    }

    // 8. Return Tool Calls
    if (openAIToolCalls.length > 0) {
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
    }

    // Save AI reply
    const savedAIMessage = await prisma.message.create({
      data: {
        conversationId: conversation.id,
        senderType: 'AI',
        body: responseText
      }
    });

    ToolService.liveChatEmitter.emit('new-message', {
      conversationId: conversation.id,
      message: savedAIMessage
    });

    return res.json(buildOpenAIResponse(responseText));
  } catch (error) {
    console.error(
      '[Vapi LLM] Error generating voice completions:',
      error
    );

    return res
      .status(500)
      .json(
        buildOpenAIResponse(
          "I'm sorry, I encountered an internal server error."
        )
      );
  }
});

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

<<<<<<< HEAD
export default router;
=======
export default router;
>>>>>>> 765969bd30239688115f15de9bc845dfa0e7665c

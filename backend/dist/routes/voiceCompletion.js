"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const client_1 = require("../db/client");
const ragService_1 = require("../services/ragService");
const toolService_1 = require("../services/toolService");
const generative_ai_1 = require("@google/generative-ai");
const env_1 = require("../config/env");
const client_2 = require("@prisma/client");
const router = (0, express_1.Router)();
/**
 * OpenAI-compatible completions endpoint for Vapi Custom LLM Integration.
 * POST /api/v1/voice/completion
 */
router.post('/completion', async (req, res) => {
    try {
        const { messages } = req.body;
        console.log('[Vapi LLM] Received Custom LLM request body:', JSON.stringify(req.body, null, 2));
        // 1. Resolve Tenant
        const tenantApiKey = (req.headers['x-tenant-api-key'] || req.query.apiKey);
        if (!tenantApiKey) {
            return res.status(401).json({
                error: 'Tenant API Key required (apiKey query or x-tenant-api-key header)'
            });
        }
        const tenant = await client_1.prisma.tenant.findUnique({
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
        const customerPhone = callMetadata.customer?.number || '+15551000';
        // 3. Resolve Customer
        let customer = await client_1.prisma.customer.findFirst({
            where: {
                tenantId: tenant.id,
                phone: customerPhone
            }
        });
        if (!customer) {
            customer = await client_1.prisma.customer.create({
                data: {
                    tenantId: tenant.id,
                    name: 'Voice Caller',
                    phone: customerPhone,
                    metadata: {}
                }
            });
        }
        // 4. Resolve Conversation
        let conversation = await client_1.prisma.conversation.findUnique({
            where: {
                customerId_channel: {
                    customerId: customer.id,
                    channel: client_2.Channel.VOICE
                }
            }
        });
        if (!conversation) {
            conversation = await client_1.prisma.conversation.create({
                data: {
                    tenantId: tenant.id,
                    customerId: customer.id,
                    channel: client_2.Channel.VOICE,
                    status: 'AI_MANAGED'
                }
            });
        }
        // 5. Extract User Message
        const userMessages = messages.filter((m) => m.role === 'user');
        const lastUserText = userMessages[userMessages.length - 1]?.content || 'Hello';
        // Save customer message
        const savedCustomerMessage = await client_1.prisma.message.create({
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
        toolService_1.ToolService.liveChatEmitter.emit('new-message', {
            conversationId: conversation.id,
            message: savedCustomerMessage
        });
        toolService_1.ToolService.liveChatEmitter.emit('crm-update', {
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
            const escalationReply = 'Transferring you to a live agent. Please hold.';
            const savedAIMessage = await client_1.prisma.message.create({
                data: {
                    conversationId: conversation.id,
                    senderType: 'AI',
                    body: escalationReply
                }
            });
            toolService_1.ToolService.liveChatEmitter.emit('new-message', {
                conversationId: conversation.id,
                message: savedAIMessage
            });
            return res.json(buildOpenAIResponse(escalationReply));
        }
        // 6. Query RAG
        const contextChunks = await (0, ragService_1.queryKnowledgeBase)(tenant.id, lastUserText, 3);
        const contextText = contextChunks
            .map((c) => `[Source: ${c.title}]\n${c.content}`)
            .join('\n\n');
        // 7. Gemini Setup
        const currentApiKey = tenant.openaiKey || env_1.env.GEMINI_API_KEY;
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
        const geminiTools = [
            {
                functionDeclarations: [
                    {
                        name: 'bookAppointment',
                        description: 'Schedules a physical or virtual appointment for a customer',
                        parameters: {
                            type: generative_ai_1.SchemaType.OBJECT,
                            properties: {
                                dateTime: {
                                    type: generative_ai_1.SchemaType.STRING,
                                    description: 'ISO-8601 date time'
                                },
                                customerName: {
                                    type: generative_ai_1.SchemaType.STRING,
                                    description: 'Customer full name'
                                }
                            },
                            required: ['dateTime', 'customerName']
                        }
                    },
                    {
                        name: 'exportToSheet',
                        description: 'Saves lead parameters to the CRM Google sheet sink',
                        parameters: {
                            type: generative_ai_1.SchemaType.OBJECT,
                            properties: {
                                name: {
                                    type: generative_ai_1.SchemaType.STRING
                                },
                                email: {
                                    type: generative_ai_1.SchemaType.STRING
                                },
                                phone: {
                                    type: generative_ai_1.SchemaType.STRING
                                },
                                notes: {
                                    type: generative_ai_1.SchemaType.STRING
                                }
                            },
                            required: ['name']
                        }
                    },
                    {
                        name: 'transferToHuman',
                        description: 'Transfers caller to a live human agent',
                        parameters: {
                            type: generative_ai_1.SchemaType.OBJECT,
                            properties: {}
                        }
                    }
                ]
            }
        ];
        let responseText = '';
        let openAIToolCalls = [];
        // Mock mode
        if (!currentApiKey ||
            currentApiKey.startsWith('your-') ||
            currentApiKey === 'dummy-key') {
            console.log('[Vapi LLM] Running mock LLM completion...');
            const lower = lastUserText.toLowerCase();
            if (lower.includes('human') ||
                lower.includes('agent') ||
                lower.includes('representative')) {
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
            }
            else if (lower.includes('book') ||
                lower.includes('schedule') ||
                lower.includes('appointment')) {
                const dummyArgs = JSON.stringify({
                    dateTime: new Date(Date.now() + 86400000).toISOString(),
                    customerName: customer.name || 'Valued Customer'
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
            }
            else {
                responseText =
                    contextChunks.length > 0
                        ? `According to company records, ${contextChunks[0].content}`
                        : 'Hello, I am your voice receptionist. How can I help you today?';
            }
        }
        else {
            // Live Gemini SDK
            const genAI = new generative_ai_1.GoogleGenerativeAI(currentApiKey);
            const model = genAI.getGenerativeModel({
                model: 'gemini-1.5-flash',
                systemInstruction: systemPrompt,
                tools: geminiTools
            });
            const geminiHistory = messages
                .slice(0, -1)
                .map((m) => ({
                role: m.role === 'assistant'
                    ? 'model'
                    : 'user',
                parts: [
                    {
                        text: m.content || ''
                    }
                ]
            }))
                .filter((h) => h.parts[0].text);
            const chat = model.startChat({
                history: geminiHistory
            });
            const geminiResponse = await chat.sendMessage(lastUserText);
            const funcCalls = geminiResponse.response.functionCalls();
            if (funcCalls && funcCalls.length > 0) {
                openAIToolCalls = funcCalls.map((call, idx) => ({
                    id: `call_${call.name}_${idx}_${Date.now()}`,
                    type: 'function',
                    function: {
                        name: call.name,
                        arguments: JSON.stringify(call.args)
                    }
                }));
            }
            else {
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
        const savedAIMessage = await client_1.prisma.message.create({
            data: {
                conversationId: conversation.id,
                senderType: 'AI',
                body: responseText
            }
        });
        toolService_1.ToolService.liveChatEmitter.emit('new-message', {
            conversationId: conversation.id,
            message: savedAIMessage
        });
        return res.json(buildOpenAIResponse(responseText));
    }
    catch (error) {
        console.error('[Vapi LLM] Error generating voice completions:', error);
        return res
            .status(500)
            .json(buildOpenAIResponse("I'm sorry, I encountered an internal server error."));
    }
});
function buildOpenAIResponse(text) {
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
exports.default = router;

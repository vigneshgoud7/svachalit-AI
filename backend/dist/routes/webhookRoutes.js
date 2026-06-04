"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const messageQueue_1 = require("../queues/messageQueue");
const client_1 = require("@prisma/client");
const client_2 = require("../db/client");
const toolService_1 = require("../services/toolService");
const router = (0, express_1.Router)();
// Meta Webhook Verification Token
const META_VERIFY_TOKEN = process.env.META_VERIFY_TOKEN || 'multichannel_verify_token_123';
const verifyMetaWebhook = (req, res) => {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];
    if (mode && token) {
        if (mode === 'subscribe' && token === META_VERIFY_TOKEN) {
            console.log('[Webhook] Meta Webhook verified successfully!');
            return res.status(200).send(challenge);
        }
        console.warn('[Webhook] Meta Webhook verification failed. Token mismatch.');
        return res.sendStatus(403);
    }
    return res.sendStatus(400);
};
// ==========================================
// 1. WHATSAPP WEBHOOK HANDLERS
// ==========================================
router.get('/whatsapp', verifyMetaWebhook);
router.post('/whatsapp', async (req, res) => {
    try {
        const { body } = req;
        console.log('[Webhook] Received WhatsApp payload:', JSON.stringify(body, null, 2));
        const tenantApiKey = (req.headers['x-tenant-api-key'] || req.query.apiKey);
        if (!tenantApiKey) {
            return res.status(401).json({ error: 'Missing tenant API Key' });
        }
        if (body.entry && body.entry[0]?.changes && body.entry[0].changes[0]?.value?.messages) {
            const value = body.entry[0].changes[0].value;
            const message = value.messages[0];
            const contact = value.contacts?.[0];
            if (message.type === 'text') {
                const payload = {
                    tenantApiKey,
                    channel: client_1.Channel.WHATSAPP,
                    senderId: message.from,
                    senderName: contact?.profile?.name || 'WhatsApp User',
                    messageId: message.id,
                    body: message.text.body,
                    metadata: { raw: body }
                };
                const job = await messageQueue_1.messageQueue.add('whatsapp-message', payload);
                console.log(`[Webhook] Enqueued WhatsApp message Job: ${job.id}`);
            }
        }
        return res.status(200).send('EVENT_RECEIVED');
    }
    catch (error) {
        console.error('[Webhook] WhatsApp parser error:', error);
        return res.status(500).json({ error: 'Internal processing error' });
    }
});
// ==========================================
// 2. INSTAGRAM WEBHOOK HANDLERS
// ==========================================
router.get('/instagram', verifyMetaWebhook);
router.post('/instagram', async (req, res) => {
    try {
        const { body } = req;
        console.log('[Webhook] Received Instagram payload:', JSON.stringify(body, null, 2));
        const tenantApiKey = (req.headers['x-tenant-api-key'] || req.query.apiKey);
        if (!tenantApiKey) {
            return res.status(401).json({ error: 'Missing tenant API Key' });
        }
        if (body.entry && body.entry[0]?.messaging) {
            const messagingEvent = body.entry[0].messaging[0];
            if (messagingEvent.message && !messagingEvent.message.is_echo) {
                const payload = {
                    tenantApiKey,
                    channel: client_1.Channel.INSTAGRAM,
                    senderId: messagingEvent.sender.id,
                    senderName: 'Instagram Customer',
                    messageId: messagingEvent.message.mid,
                    body: messagingEvent.message.text || '',
                    metadata: { raw: body }
                };
                const job = await messageQueue_1.messageQueue.add('instagram-message', payload);
                console.log(`[Webhook] Enqueued Instagram message Job: ${job.id}`);
            }
        }
        return res.status(200).send('EVENT_RECEIVED');
    }
    catch (error) {
        console.error('[Webhook] Instagram parser error:', error);
        return res.status(500).json({ error: 'Internal processing error' });
    }
});
// ==========================================
// 3. FACEBOOK WEBHOOK HANDLERS
// ==========================================
router.get('/facebook', verifyMetaWebhook);
router.post('/facebook', async (req, res) => {
    try {
        const { body } = req;
        console.log('[Webhook] Received Facebook Messenger payload:', JSON.stringify(body, null, 2));
        const tenantApiKey = (req.headers['x-tenant-api-key'] || req.query.apiKey);
        if (!tenantApiKey) {
            return res.status(401).json({ error: 'Missing tenant API Key' });
        }
        if (body.entry && body.entry[0]?.messaging) {
            const messagingEvent = body.entry[0].messaging[0];
            if (messagingEvent.message && !messagingEvent.message.is_echo) {
                const payload = {
                    tenantApiKey,
                    channel: client_1.Channel.FACEBOOK,
                    senderId: messagingEvent.sender.id,
                    senderName: 'Facebook User',
                    messageId: messagingEvent.message.mid,
                    body: messagingEvent.message.text || '',
                    metadata: { raw: body }
                };
                const job = await messageQueue_1.messageQueue.add('facebook-message', payload);
                console.log(`[Webhook] Enqueued Facebook message Job: ${job.id}`);
            }
        }
        return res.status(200).send('EVENT_RECEIVED');
    }
    catch (error) {
        console.error('[Webhook] Facebook parser error:', error);
        return res.status(500).json({ error: 'Internal processing error' });
    }
});
// ==========================================
// 4. VOICE WEBHOOK HANDLERS (Vapi & Twilio event receiver)
// ==========================================
router.post('/voice', async (req, res) => {
    try {
        const { body } = req;
        console.log('[Webhook] Received Voice webhook payload:', JSON.stringify(body, null, 2));
        const tenantApiKey = (req.headers['x-tenant-api-key'] || req.query.apiKey);
        if (!tenantApiKey) {
            return res.status(401).json({ error: 'Missing tenant API Key' });
        }
        const tenant = await client_2.prisma.tenant.findUnique({ where: { apiKey: tenantApiKey } });
        if (!tenant) {
            return res.status(404).json({ error: 'Tenant not found' });
        }
        // A. Detect Twilio Call Parameters
        if (req.body.CallSid) {
            const senderId = req.body.From;
            const bodyText = req.body.SpeechResult || req.body.Body || '';
            const messageId = req.body.CallSid;
            if (senderId && bodyText) {
                const payload = {
                    tenantApiKey,
                    channel: client_1.Channel.VOICE,
                    senderId,
                    senderName: 'Voice Caller',
                    messageId,
                    body: bodyText,
                    metadata: { raw: body }
                };
                const job = await messageQueue_1.messageQueue.add('voice-message', payload);
                return res.status(200).json({ status: 'queued', jobId: job.id });
            }
            return res.status(200).json({ status: 'skipped' });
        }
        // B. Detect Vapi webhook server payload shapes
        if (body.message) {
            const vapiMessage = body.message;
            const callSid = vapiMessage.call?.id || 'vapi_call_active';
            const customerPhone = vapiMessage.customer?.number || '+15551000';
            // Load conversation reference
            let customer = await client_2.prisma.customer.findFirst({
                where: { tenantId: tenant.id, phone: customerPhone }
            });
            if (!customer) {
                customer = await client_2.prisma.customer.create({
                    data: { tenantId: tenant.id, name: 'Voice Caller', phone: customerPhone }
                });
            }
            let conversation = await client_2.prisma.conversation.findUnique({
                where: { customerId_channel: { customerId: customer.id, channel: client_1.Channel.VOICE } }
            });
            if (!conversation) {
                conversation = await client_2.prisma.conversation.create({
                    data: { tenantId: tenant.id, customerId: customer.id, channel: client_1.Channel.VOICE }
                });
            }
            // Handle Vapi Assistant Request dynamically
            if (vapiMessage.type === 'assistant-request') {
                console.log('[Webhook Voice] Handled Vapi Assistant Request. Returning dynamic model details.');
                // Vapi expects configuration instructions
                return res.status(200).json({
                    assistant: {
                        name: 'Voice Receptionist',
                        firstMessage: 'Hello! Welcome to our automated receptionist. How can I help you today?',
                        model: {
                            provider: 'custom-llm',
                            url: `http://localhost:4000/api/v1/voice/completion?apiKey=${tenantApiKey}`,
                            model: 'gemini-1.5-flash',
                            // Vapi function schema definitions
                            tools: [
                                {
                                    name: 'bookAppointment',
                                    type: 'function',
                                    description: 'Schedules an appointment in the business calendar',
                                    parameters: {
                                        type: 'object',
                                        properties: {
                                            dateTime: { type: 'string', description: 'ISO date' },
                                            customerName: { type: 'string' }
                                        },
                                        required: ['dateTime', 'customerName']
                                    }
                                },
                                {
                                    name: 'exportToSheet',
                                    type: 'function',
                                    description: 'Saves lead parameters in the spreadsheet',
                                    parameters: {
                                        type: 'object',
                                        properties: {
                                            name: { type: 'string' },
                                            email: { type: 'string' },
                                            notes: { type: 'string' }
                                        },
                                        required: ['name']
                                    }
                                },
                                {
                                    name: 'transferToHuman',
                                    type: 'function',
                                    description: 'Escalates thread to a human live agent',
                                    parameters: { type: 'object', properties: {} }
                                }
                            ]
                        },
                        voice: {
                            provider: 'playht',
                            voiceId: 'susan'
                        }
                    }
                });
            }
            // Handle Vapi real-time transcript streaming
            if (vapiMessage.type === 'transcript') {
                const transcriptText = vapiMessage.transcript || '';
                const speaker = vapiMessage.role || 'user';
                console.log(`[Webhook Voice] Live Call Transcript: [${speaker}] ${transcriptText}`);
                // Broadcast to SSE streams for real-time dashboard transcript sync
                toolService_1.ToolService.liveChatEmitter.emit('crm-update', {
                    conversationId: conversation.id,
                    customerId: customer.id,
                    conversation: {
                        ...conversation,
                        metadata: {
                            activeCall: true,
                            liveTranscript: transcriptText,
                            callSid,
                            speakingState: speaker === 'user' ? 'CUSTOMER_SPEAKING' : 'AI_SPEAKING',
                            callStart: conversation.createdAt
                        }
                    }
                });
                return res.status(200).send('TRANSCRIPT_RECEIVED');
            }
            // Handle Vapi Tool Calls execution
            if (vapiMessage.type === 'tool-calls') {
                console.log('[Webhook Voice] Executing tool calls for Vapi call session:', vapiMessage.toolCalls);
                const results = [];
                for (const toolCall of vapiMessage.toolCalls) {
                    const { name } = toolCall.function;
                    const rawArgs = toolCall.function.arguments;
                    // Safer parsing
                    const args = typeof rawArgs === 'string' ? JSON.parse(rawArgs) : rawArgs;
                    let resultText = '';
                    if (name === 'bookAppointment') {
                        const data = await toolService_1.ToolService.bookAppointment({
                            dateTime: args.dateTime,
                            customerName: args.customerName,
                            conversationId: conversation.id
                        });
                        resultText = JSON.stringify(data);
                    }
                    else if (name === 'exportToSheet') {
                        const data = await toolService_1.ToolService.exportToSheet({
                            leadData: args,
                            conversationId: conversation.id
                        });
                        resultText = JSON.stringify(data);
                    }
                    else if (name === 'transferToHuman') {
                        const data = await toolService_1.ToolService.transferToHuman({ conversationId: conversation.id });
                        resultText = JSON.stringify(data);
                    }
                    results.push({
                        toolCallId: toolCall.id,
                        result: resultText
                    });
                }
                console.log('[Webhook Voice] Webhook returning function call result:', results);
                return res.status(200).json({ results });
            }
            // Handle Vapi Status Update (Ringing, connected, ended)
            if (vapiMessage.type === 'status-update') {
                console.log(`[Webhook Voice] Call state changed: ${vapiMessage.status}`);
                const activeCall = vapiMessage.status !== 'ended';
                toolService_1.ToolService.liveChatEmitter.emit('crm-update', {
                    conversationId: conversation.id,
                    customerId: customer.id,
                    conversation: {
                        ...conversation,
                        metadata: {
                            activeCall,
                            callSid,
                            callStatus: vapiMessage.status,
                            speakingState: activeCall ? 'IDLE' : 'CALL_ENDED',
                            callDuration: vapiMessage.duration || 0
                        }
                    }
                });
                return res.status(200).send('STATUS_PROCESSED');
            }
            // Handle End of Call Summary persistence
            if (vapiMessage.type === 'end-of-call-report') {
                console.log('[Webhook Voice] Call concluded. Summary:', vapiMessage.summary);
                const savedSummaryMessage = await client_2.prisma.message.create({
                    data: {
                        conversationId: conversation.id,
                        senderType: 'AI',
                        body: `[CALL ENDED - SUMMARY]: ${vapiMessage.summary || 'Caller hung up.'}`,
                        metadata: { duration: vapiMessage.duration, cost: vapiMessage.cost }
                    }
                });
                toolService_1.ToolService.liveChatEmitter.emit('new-message', {
                    conversationId: conversation.id,
                    message: savedSummaryMessage
                });
                toolService_1.ToolService.liveChatEmitter.emit('crm-update', {
                    conversationId: conversation.id,
                    customerId: customer.id,
                    conversation: {
                        ...conversation,
                        metadata: {
                            activeCall: false,
                            speakingState: 'CALL_ENDED',
                            callDuration: vapiMessage.duration,
                            callSummary: vapiMessage.summary
                        }
                    }
                });
                return res.status(200).send('REPORT_PERSISTED');
            }
        }
        return res.status(200).json({ status: 'skipped', reason: 'Unrecognized JSON body structure' });
    }
    catch (error) {
        console.error('[Webhook] Voice webhook ingestion failure:', error);
        return res.status(500).json({ error: 'Internal voice processing failure' });
    }
});
exports.default = router;

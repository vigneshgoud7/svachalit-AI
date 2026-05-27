"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const env_1 = require("./config/env");
const client_1 = require("./db/client");
const webhookRoutes_1 = __importDefault(require("./routes/webhookRoutes"));
const voiceCompletion_1 = __importDefault(require("./routes/voiceCompletion"));
const outboundRouter_1 = require("./services/outboundRouter");
const toolService_1 = require("./services/toolService");
require("./queues/messageWorker"); // Boot worker
const client_2 = require("@prisma/client");
const app = (0, express_1.default)();
app.use((0, cors_1.default)({ origin: '*' }));
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
// Log requests in dev
app.use((req, res, next) => {
    console.log(`[${req.method}] ${req.path}`);
    next();
});
// Root Route
app.get('/', (req, res) => {
    res.json({
        success: true,
        message: 'AutoBot Backend API Running 🚀'
    });
});
// Mount Omnichannel Webhooks
app.use('/api/v1/webhooks', webhookRoutes_1.default);
// Mount Voice Custom LLM Completions (Vapi Endpoint)
app.use('/api/v1/voice', voiceCompletion_1.default);
// Mount Omnichannel Webhooks
app.use('/api/v1/webhooks', webhookRoutes_1.default);
// Mount Voice Custom LLM Completions (Vapi Endpoint)
// ==========================================
// SSE STREAM: REAL-TIME CONSOLE ROUTE
// ==========================================
app.get('/api/v1/stream', (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();
    console.log('[SSE] Client connected to live events stream');
    const onNewMessage = (data) => {
        res.write(`event: message\ndata: ${JSON.stringify(data)}\n\n`);
    };
    const onTransferToHuman = (data) => {
        res.write(`event: transfer\ndata: ${JSON.stringify(data)}\n\n`);
    };
    const onCrmUpdate = (data) => {
        res.write(`event: crm\ndata: ${JSON.stringify(data)}\n\n`);
    };
    // Subscribe to emitters
    toolService_1.liveChatEmitter.on('new-message', onNewMessage);
    toolService_1.liveChatEmitter.on('transfer-to-human', onTransferToHuman);
    toolService_1.liveChatEmitter.on('crm-update', onCrmUpdate);
    // Keep-alive heartbeat every 15 seconds
    const heartbeat = setInterval(() => {
        res.write(': heartbeat\n\n');
    }, 15000);
    req.on('close', () => {
        console.log('[SSE] Client disconnected from live stream');
        toolService_1.liveChatEmitter.off('new-message', onNewMessage);
        toolService_1.liveChatEmitter.off('transfer-to-human', onTransferToHuman);
        toolService_1.liveChatEmitter.off('crm-update', onCrmUpdate);
        clearInterval(heartbeat);
    });
});
// ==========================================
// CONVERSATIONS & CRM REST API ENDPOINTS
// ==========================================
// Get all conversations with latest messages
app.get('/api/v1/conversations', async (req, res) => {
    try {
        const conversations = await client_1.prisma.conversation.findMany({
            include: {
                customer: true,
                messages: {
                    orderBy: { createdAt: 'desc' },
                    take: 1
                }
            },
            orderBy: { updatedAt: 'desc' }
        });
        return res.json(conversations);
    }
    catch (error) {
        return res.status(500).json({ error: 'Failed to fetch conversations' });
    }
});
// Get conversation detail and historical messages
app.get('/api/v1/conversations/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const conversation = await client_1.prisma.conversation.findUnique({
            where: { id },
            include: {
                customer: true,
                messages: {
                    orderBy: { createdAt: 'asc' }
                }
            }
        });
        if (!conversation) {
            return res.status(404).json({ error: 'Conversation not found' });
        }
        return res.json(conversation);
    }
    catch (error) {
        return res.status(500).json({ error: 'Failed to fetch conversation details' });
    }
});
// Live Agent Manual Reply Endpoint
app.post('/api/v1/conversations/:id/reply', async (req, res) => {
    const { id } = req.params;
    const { body, status } = req.body; // status is optional (e.g. AGENT_MANAGED, HUMAN_PENDING)
    if (!body) {
        return res.status(400).json({ error: 'Message body is required' });
    }
    try {
        const conversation = await client_1.prisma.conversation.findUnique({
            where: { id },
            include: { customer: true }
        });
        if (!conversation) {
            return res.status(404).json({ error: 'Conversation not found' });
        }
        // Save agent message to Database
        const agentMsg = await client_1.prisma.message.create({
            data: {
                conversationId: id,
                senderType: 'AGENT',
                body
            }
        });
        // Update conversation status and timestamps
        const updatedConv = await client_1.prisma.conversation.update({
            where: { id },
            data: {
                status: status || conversation.status,
                updatedAt: new Date()
            },
            include: { customer: true }
        });
        // Dispatch out via outbound channel adapter
        let recipientId = '';
        switch (conversation.channel) {
            case client_2.Channel.WHATSAPP:
            case client_2.Channel.VOICE:
                recipientId = conversation.customer.phone || '';
                break;
            case client_2.Channel.INSTAGRAM:
                recipientId = conversation.customer.instagramId || '';
                break;
            case client_2.Channel.FACEBOOK:
                recipientId = conversation.customer.facebookId || '';
                break;
            default:
                recipientId = conversation.customerId;
        }
        await outboundRouter_1.OutboundRouter.sendResponse({
            conversationId: conversation.id,
            channel: conversation.channel,
            recipientId,
            body
        });
        // Notify all listeners
        toolService_1.liveChatEmitter.emit('new-message', {
            conversationId: id,
            message: agentMsg
        });
        toolService_1.liveChatEmitter.emit('crm-update', {
            conversationId: id,
            customerId: conversation.customerId,
            conversation: updatedConv
        });
        return res.json({ success: true, message: agentMsg });
    }
    catch (error) {
        console.error('[REST API] Live Agent response failure:', error);
        return res.status(500).json({ error: 'Failed to process manual response' });
    }
});
// Update conversation configuration details / manual status toggles
app.patch('/api/v1/conversations/:id/status', async (req, res) => {
    const { id } = req.params;
    const { status } = req.body; // e.g. "AI_MANAGED" or "HUMAN_PENDING"
    if (!status || (status !== 'AI_MANAGED' && status !== 'HUMAN_PENDING')) {
        return res.status(400).json({ error: 'Valid status parameter is required (AI_MANAGED | HUMAN_PENDING)' });
    }
    try {
        const updated = await client_1.prisma.conversation.update({
            where: { id },
            data: { status },
            include: { customer: true }
        });
        toolService_1.liveChatEmitter.emit('crm-update', {
            conversationId: id,
            customerId: updated.customerId,
            conversation: updated
        });
        return res.json(updated);
    }
    catch (error) {
        return res.status(500).json({ error: 'Failed to update conversation status' });
    }
});
// ==========================================
// SEEDING / PROVISIONING HELPER ENDPOINT
// ==========================================
app.get('/api/v1/dev/seed', async (req, res) => {
    try {
        let tenant = await client_1.prisma.tenant.findFirst({
            where: { name: 'Acme Corp' }
        });
        if (!tenant) {
            tenant = await client_1.prisma.tenant.create({
                data: {
                    name: 'Acme Corp',
                    openaiKey: env_1.env.GEMINI_API_KEY || 'dummy-key'
                }
            });
        }
        // Insert mock knowledge chunks
        const count = await client_1.prisma.knowledgeBase.count({
            where: { tenantId: tenant.id }
        });
        if (count === 0) {
            const data = [
                {
                    title: 'Product Pricing & Plans',
                    content: 'Acme Corp offers three plans: Starter ($19/mo, 1000 messages), Growth ($49/mo, 5000 messages), and Enterprise ($149/mo, unlimited messages with custom routing support).'
                },
                {
                    title: 'Hours of Operation',
                    content: 'Our support desk is open Monday through Friday from 9:00 AM to 6:00 PM EST. Inquiries made outside these hours will be handled by the AI responder.'
                },
                {
                    title: 'Return Policy',
                    content: 'We offer a 30-day money-back guarantee. If you are not satisfied with the platform, click cancel billing in settings within 30 days of purchase for a full refund.'
                }
            ];
            for (const item of data) {
                await client_1.prisma.knowledgeBase.create({
                    data: {
                        title: item.title,
                        content: item.content,
                        tenantId: tenant.id
                    }
                });
            }
        }
        // Create dummy conversations if none exist
        const convsCount = await client_1.prisma.conversation.count();
        if (convsCount === 0) {
            const customer = await client_1.prisma.customer.create({
                data: {
                    name: 'Alice Johnson',
                    email: 'alice@example.com',
                    phone: '+15550199',
                    tenantId: tenant.id,
                    metadata: {
                        budget: '$50/mo',
                        notes: 'Interested in growth plans'
                    }
                }
            });
            const conversation = await client_1.prisma.conversation.create({
                data: {
                    tenantId: tenant.id,
                    customerId: customer.id,
                    channel: client_2.Channel.WHATSAPP,
                    status: 'AI_MANAGED'
                }
            });
            await client_1.prisma.message.create({
                data: {
                    conversationId: conversation.id,
                    senderType: 'CUSTOMER',
                    body: 'Hello! I would like to know more about your growth pricing plans.'
                }
            });
        }
        return res.json({
            success: true,
            message: 'Seeded test database configuration',
            tenantApiKey: tenant.apiKey,
            tenantId: tenant.id
        });
    }
    catch (error) {
        console.error('Seeding failure:', error);
        return res.status(500).json({ error: 'Database seeding failed', details: String(error) });
    }
});
// Run server
app.listen(env_1.env.PORT, () => {
    console.log(`[Server] Multi-channel platform server listening at http://localhost:${env_1.env.PORT}`);
});

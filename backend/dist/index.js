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
require("./queues/messageWorker");
const messageQueue_1 = require("./queues/messageQueue");
const client_2 = require("@prisma/client");
const app = (0, express_1.default)();
app.use((0, cors_1.default)({ origin: '*' }));
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
// Request Logger
app.use((req, res, next) => {
    console.log(`[${req.method}] ${req.path}`);
    next();
});
// ==========================================
// ROOT ROUTE
// ==========================================
app.get('/', (req, res) => {
    res.json({
        success: true,
        message: 'AutoBot Backend API Running 🚀'
    });
});
// ==========================================
// ROUTES
// ==========================================
app.use('/api/v1/webhooks', webhookRoutes_1.default);
app.use('/api/v1/voice', voiceCompletion_1.default);
// ==========================================
// SSE STREAM ROUTE
// ==========================================
app.get('/api/v1/stream', (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();
    console.log('[SSE] Client connected');
    // Initial ping
    res.write(`data: ${JSON.stringify({ connected: true })}\n\n`);
    const onNewMessage = (data) => {
        res.write(`event: message\ndata: ${JSON.stringify(data)}\n\n`);
    };
    const onTransferToHuman = (data) => {
        res.write(`event: transfer\ndata: ${JSON.stringify(data)}\n\n`);
    };
    const onCrmUpdate = (data) => {
        res.write(`event: crm\ndata: ${JSON.stringify(data)}\n\n`);
    };
    toolService_1.liveChatEmitter.on('new-message', onNewMessage);
    toolService_1.liveChatEmitter.on('transfer-to-human', onTransferToHuman);
    toolService_1.liveChatEmitter.on('crm-update', onCrmUpdate);
    // Heartbeat
    const heartbeat = setInterval(() => {
        res.write(': heartbeat\n\n');
    }, 15000);
    req.on('close', () => {
        console.log('[SSE] Client disconnected');
        toolService_1.liveChatEmitter.off('new-message', onNewMessage);
        toolService_1.liveChatEmitter.off('transfer-to-human', onTransferToHuman);
        toolService_1.liveChatEmitter.off('crm-update', onCrmUpdate);
        clearInterval(heartbeat);
        res.end();
    });
});
// ==========================================
// GET CONVERSATIONS
// ==========================================
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
            orderBy: {
                updatedAt: 'desc'
            }
        });
        return res.json(conversations);
    }
    catch (error) {
        console.error(error);
        return res.status(500).json({
            error: 'Failed to fetch conversations'
        });
    }
});
// ==========================================
// GET SINGLE CONVERSATION
// ==========================================
app.get('/api/v1/conversations/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const conversation = await client_1.prisma.conversation.findUnique({
            where: { id },
            include: {
                customer: true,
                messages: {
                    orderBy: {
                        createdAt: 'asc'
                    }
                }
            }
        });
        if (!conversation) {
            return res.status(404).json({
                error: 'Conversation not found'
            });
        }
        return res.json(conversation);
    }
    catch (error) {
        console.error(error);
        return res.status(500).json({
            error: 'Failed to fetch conversation'
        });
    }
});
// ==========================================
// MANUAL AGENT REPLY
// ==========================================
app.post('/api/v1/conversations/:id/reply', async (req, res) => {
    try {
        const { id } = req.params;
        const { body, status } = req.body;
        if (!body) {
            return res.status(400).json({
                error: 'Message body required'
            });
        }
        const conversation = await client_1.prisma.conversation.findUnique({
            where: { id },
            include: {
                customer: true
            }
        });
        if (!conversation) {
            return res.status(404).json({
                error: 'Conversation not found'
            });
        }
        const agentMessage = await client_1.prisma.message.create({
            data: {
                conversationId: id,
                senderType: 'AGENT',
                body
            }
        });
        const updatedConversation = await client_1.prisma.conversation.update({
            where: { id },
            data: {
                status: status || conversation.status,
                updatedAt: new Date()
            },
            include: {
                customer: true
            }
        });
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
        toolService_1.liveChatEmitter.emit('new-message', {
            conversationId: id,
            message: agentMessage
        });
        toolService_1.liveChatEmitter.emit('crm-update', {
            conversationId: id,
            customerId: conversation.customerId,
            conversation: updatedConversation
        });
        return res.json({
            success: true,
            message: agentMessage
        });
    }
    catch (error) {
        console.error(error);
        return res.status(500).json({
            error: 'Failed to process manual reply'
        });
    }
});
// ==========================================
// UPDATE CONVERSATION STATUS
// ==========================================
app.patch('/api/v1/conversations/:id/status', async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        if (!status) {
            return res.status(400).json({
                error: 'Status required'
            });
        }
        const updated = await client_1.prisma.conversation.update({
            where: { id },
            data: { status },
            include: {
                customer: true
            }
        });
        toolService_1.liveChatEmitter.emit('crm-update', {
            conversationId: id,
            customerId: updated.customerId,
            conversation: updated
        });
        return res.json(updated);
    }
    catch (error) {
        console.error(error);
        return res.status(500).json({
            error: 'Failed to update status'
        });
    }
});
// ==========================================
// DEV SEED ENDPOINT
// ==========================================
app.post('/api/v1/dev/seed', async (req, res) => {
    try {
        let tenant = await client_1.prisma.tenant.findFirst({
            where: {
                name: 'Acme Corp'
            }
        });
        if (!tenant) {
            tenant = await client_1.prisma.tenant.create({
                data: {
                    name: 'Acme Corp',
                    openaiKey: env_1.env.GEMINI_API_KEY || 'dummy-key'
                }
            });
        }
        // KB Seed
        const kbCount = await client_1.prisma.knowledgeBase.count({
            where: {
                tenantId: tenant.id
            }
        });
        if (kbCount === 0) {
            const kbData = [
                {
                    title: 'Pricing Plans',
                    content: 'Acme Corp offers Starter ($19/mo), Growth ($49/mo), and Enterprise ($149/mo) plans.'
                },
                {
                    title: 'Support Hours',
                    content: 'Support is available Monday-Friday from 9AM-6PM EST.'
                },
                {
                    title: 'Refund Policy',
                    content: 'We offer a 30-day money back guarantee.'
                }
            ];
            for (const item of kbData) {
                await client_1.prisma.knowledgeBase.create({
                    data: {
                        tenantId: tenant.id,
                        title: item.title,
                        content: item.content
                    }
                });
            }
        }
        let customer = await client_1.prisma.customer.findFirst();
        if (!customer) {
            customer = await client_1.prisma.customer.create({
                data: {
                    tenantId: tenant.id,
                    name: 'Alice Johnson',
                    email: 'alice@example.com',
                    phone: '+15550199',
                    metadata: {
                        budget: '$50/mo'
                    }
                }
            });
        }
        let conversation = await client_1.prisma.conversation.findFirst({
            where: {
                customerId: customer.id
            }
        });
        if (!conversation) {
            conversation = await client_1.prisma.conversation.create({
                data: {
                    tenantId: tenant.id,
                    customerId: customer.id,
                    channel: client_2.Channel.WHATSAPP,
                    status: 'AI_MANAGED'
                }
            });
        }
        // Queue REAL AI message
        await messageQueue_1.messageQueue.add('seed-test-message', {
            tenantApiKey: tenant.apiKey,
            channel: client_2.Channel.WHATSAPP,
            senderId: customer.phone,
            senderName: customer.name,
            messageId: `seed_${Date.now()}`,
            body: 'Tell me about your pricing plans',
            metadata: {}
        });
        return res.json({
            success: true,
            message: 'Seed successful',
            tenantApiKey: tenant.apiKey,
            tenantId: tenant.id
        });
    }
    catch (error) {
        console.error('Seed failure:', error);
        return res.status(500).json({
            error: 'Database seeding failed',
            details: String(error)
        });
    }
});
// ==========================================
// TEST AI ENDPOINT
// ==========================================
app.post('/api/v1/test-ai', async (req, res) => {
    try {
        const tenant = await client_1.prisma.tenant.findFirst();
        if (!tenant) {
            return res.status(404).json({
                error: 'No tenant found'
            });
        }
        let customer = await client_1.prisma.customer.findFirst();
        if (!customer) {
            customer = await client_1.prisma.customer.create({
                data: {
                    tenantId: tenant.id,
                    name: 'Terminal Test User',
                    phone: '+15550001'
                }
            });
        }
        const payload = {
            tenantApiKey: tenant.apiKey,
            channel: client_2.Channel.WHATSAPP,
            senderId: customer.phone || '+15550001',
            senderName: customer.name,
            messageId: `manual_${Date.now()}`,
            body: req.body.message || 'Tell me about pricing',
            metadata: {}
        };
        const job = await messageQueue_1.messageQueue.add('manual-test-message', payload);
        return res.json({
            success: true,
            jobId: job.id
        });
    }
    catch (error) {
        console.error(error);
        return res.status(500).json({
            error: 'Failed to enqueue AI test'
        });
    }
});
// ==========================================
// START SERVER
// ==========================================
app.listen(env_1.env.PORT, () => {
    console.log(`[Server] Multi-channel platform server listening at http://localhost:${env_1.env.PORT}`);
});

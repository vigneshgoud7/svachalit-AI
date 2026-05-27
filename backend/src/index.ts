import express, { Request, Response } from 'express';
import cors from 'cors';
import { env } from './config/env';
import { prisma } from './db/client';
import webhookRouter from './routes/webhookRoutes';
import voiceCompletionRouter from './routes/voiceCompletion';
import { OutboundRouter } from './services/outboundRouter';
import { liveChatEmitter } from './services/toolService';
import './queues/messageWorker'; // Boot worker
import { messageQueue } from './queues/messageQueue';
import { Channel } from '@prisma/client';

const app = express();

app.use(cors({ origin: '*' }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Log requests in dev
app.use((req, res, next) => {
  console.log(`[${req.method}] ${req.path}`);
  next();
});

// Mount Omnichannel Webhooks
app.use('/api/v1/webhooks', webhookRouter);

// Mount Voice Custom LLM Completions (Vapi Endpoint)
app.use('/api/v1/voice', voiceCompletionRouter);

// ==========================================
// SSE STREAM: REAL-TIME CONSOLE ROUTE
// ==========================================
app.get('/api/v1/stream', (req: Request, res: Response) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  console.log('[SSE] Client connected to live events stream');

  const onNewMessage = (data: any) => {
    res.write(`event: message\ndata: ${JSON.stringify(data)}\n\n`);
  };

  const onTransferToHuman = (data: any) => {
    res.write(`event: transfer\ndata: ${JSON.stringify(data)}\n\n`);
  };

  const onCrmUpdate = (data: any) => {
    res.write(`event: crm\ndata: ${JSON.stringify(data)}\n\n`);
  };

  // Subscribe to emitters
  liveChatEmitter.on('new-message', onNewMessage);
  liveChatEmitter.on('transfer-to-human', onTransferToHuman);
  liveChatEmitter.on('crm-update', onCrmUpdate);

  // Keep-alive heartbeat every 15 seconds
  const heartbeat = setInterval(() => {
    res.write(': heartbeat\n\n');
  }, 15000);

  req.on('close', () => {
    console.log('[SSE] Client disconnected from live stream');
    liveChatEmitter.off('new-message', onNewMessage);
    liveChatEmitter.off('transfer-to-human', onTransferToHuman);
    liveChatEmitter.off('crm-update', onCrmUpdate);
    clearInterval(heartbeat);
  });
});

// ==========================================
// CONVERSATIONS & CRM REST API ENDPOINTS
// ==========================================

// Get all conversations with latest messages
app.get('/api/v1/conversations', async (req: Request, res: Response) => {
  try {
    const conversations = await prisma.conversation.findMany({
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
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch conversations' });
  }
});

// Get conversation detail and historical messages
app.get('/api/v1/conversations/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const conversation = await prisma.conversation.findUnique({
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
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch conversation details' });
  }
});

// Live Agent Manual Reply Endpoint
app.post('/api/v1/conversations/:id/reply', async (req: Request, res: Response) => {
  const { id } = req.params;
  const { body, status } = req.body; // status is optional (e.g. AGENT_MANAGED, HUMAN_PENDING)

  if (!body) {
    return res.status(400).json({ error: 'Message body is required' });
  }

  try {
    const conversation = await prisma.conversation.findUnique({
      where: { id },
      include: { customer: true }
    });

    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    // Save agent message to Database
    const agentMsg = await prisma.message.create({
      data: {
        conversationId: id,
        senderType: 'AGENT',
        body
      }
    });

    // Update conversation status and timestamps
    const updatedConv = await prisma.conversation.update({
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
      case Channel.WHATSAPP:
      case Channel.VOICE:
        recipientId = conversation.customer.phone || '';
        break;
      case Channel.INSTAGRAM:
        recipientId = conversation.customer.instagramId || '';
        break;
      case Channel.FACEBOOK:
        recipientId = conversation.customer.facebookId || '';
        break;
      default:
        recipientId = conversation.customerId;
    }

    await OutboundRouter.sendResponse({
      conversationId: conversation.id,
      channel: conversation.channel,
      recipientId,
      body
    });

    // Notify all listeners
    liveChatEmitter.emit('new-message', {
      conversationId: id,
      message: agentMsg
    });

    liveChatEmitter.emit('crm-update', {
      conversationId: id,
      customerId: conversation.customerId,
      conversation: updatedConv
    });

    return res.json({ success: true, message: agentMsg });
  } catch (error) {
    console.error('[REST API] Live Agent response failure:', error);
    return res.status(500).json({ error: 'Failed to process manual response' });
  }
});

// Update conversation configuration details / manual status toggles
app.patch('/api/v1/conversations/:id/status', async (req: Request, res: Response) => {
  const { id } = req.params;
  const { status } = req.body; // e.g. "AI_MANAGED" or "HUMAN_PENDING"

  if (!status || (status !== 'AI_MANAGED' && status !== 'HUMAN_PENDING')) {
    return res.status(400).json({ error: 'Valid status parameter is required (AI_MANAGED | HUMAN_PENDING)' });
  }

  try {
    const updated = await prisma.conversation.update({
      where: { id },
      data: { status },
      include: { customer: true }
    });

    liveChatEmitter.emit('crm-update', {
      conversationId: id,
      customerId: updated.customerId,
      conversation: updated
    });

    return res.json(updated);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to update conversation status' });
  }
});

// ==========================================
// SEEDING / PROVISIONING HELPER ENDPOINT
// ==========================================
app.post('/api/v1/dev/seed', async (req: Request, res: Response) => {
  try {
    let tenant = await prisma.tenant.findFirst({
      where: { name: 'Acme Corp' }
    });

    if (!tenant) {
      tenant = await prisma.tenant.create({
        data: {
          name: 'Acme Corp',
          openaiKey: env.GEMINI_API_KEY || 'dummy-key'
        }
      });
    }

    // Insert mock knowledge chunks
    const count = await prisma.knowledgeBase.count({
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
        await prisma.knowledgeBase.create({
          data: {
            title: item.title,
            content: item.content,
            tenantId: tenant.id
          }
        });
      }
    }

    // Create dummy conversations if none exist
    const convsCount = await prisma.conversation.count();
    if (convsCount === 0) {
      const customer = await prisma.customer.create({
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

      const conversation = await prisma.conversation.create({
        data: {
          tenantId: tenant.id,
          customerId: customer.id,
          channel: Channel.WHATSAPP,
          status: 'AI_MANAGED'
        }
      });

      await prisma.message.create({
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
  } catch (error) {
    console.error('Seeding failure:', error);
    return res.status(500).json({ error: 'Database seeding failed', details: String(error) });
  }
});

// Run server
app.listen(env.PORT, () => {
  console.log(`[Server] Multi-channel platform server listening at http://localhost:${env.PORT}`);
});

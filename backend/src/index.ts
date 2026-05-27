import express, { Request, Response } from 'express';
import cors from 'cors';
import { env } from './config/env';
import { prisma } from './db/client';
import webhookRouter from './routes/webhookRoutes';
import voiceCompletionRouter from './routes/voiceCompletion';
import { OutboundRouter } from './services/outboundRouter';
import { liveChatEmitter } from './services/toolService';
import './queues/messageWorker';
import { messageQueue } from './queues/messageQueue';
import { Channel } from '@prisma/client';

const app = express();

app.use(cors({ origin: '*' }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request Logger
app.use((req, res, next) => {
  console.log(`[${req.method}] ${req.path}`);
  next();
});

// ==========================================
// ROOT ROUTE
// ==========================================
app.get('/', (req: Request, res: Response) => {
  res.json({
    success: true,
    message: 'AutoBot Backend API Running 🚀'
  });
});

// ==========================================
// ROUTES
// ==========================================
app.use('/api/v1/webhooks', webhookRouter);
app.use('/api/v1/voice', voiceCompletionRouter);

// ==========================================
// SSE STREAM ROUTE
// ==========================================
app.get('/api/v1/stream', (req: Request, res: Response) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  res.flushHeaders();

  console.log('[SSE] Client connected');

  // Initial ping
  res.write(`data: ${JSON.stringify({ connected: true })}\n\n`);

  const onNewMessage = (data: any) => {
    res.write(`event: message\ndata: ${JSON.stringify(data)}\n\n`);
  };

  const onTransferToHuman = (data: any) => {
    res.write(`event: transfer\ndata: ${JSON.stringify(data)}\n\n`);
  };

  const onCrmUpdate = (data: any) => {
    res.write(`event: crm\ndata: ${JSON.stringify(data)}\n\n`);
  };

  liveChatEmitter.on('new-message', onNewMessage);
  liveChatEmitter.on('transfer-to-human', onTransferToHuman);
  liveChatEmitter.on('crm-update', onCrmUpdate);

  // Heartbeat
  const heartbeat = setInterval(() => {
    res.write(': heartbeat\n\n');
  }, 15000);

  req.on('close', () => {
    console.log('[SSE] Client disconnected');

    liveChatEmitter.off('new-message', onNewMessage);
    liveChatEmitter.off('transfer-to-human', onTransferToHuman);
    liveChatEmitter.off('crm-update', onCrmUpdate);

    clearInterval(heartbeat);

    res.end();
  });
});

// ==========================================
// GET CONVERSATIONS
// ==========================================
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
      orderBy: {
        updatedAt: 'desc'
      }
    });

    return res.json(conversations);
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      error: 'Failed to fetch conversations'
    });
  }
});

// ==========================================
// GET SINGLE CONVERSATION
// ==========================================
app.get('/api/v1/conversations/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const conversation = await prisma.conversation.findUnique({
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
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      error: 'Failed to fetch conversation'
    });
  }
});

// ==========================================
// MANUAL AGENT REPLY
// ==========================================
app.post('/api/v1/conversations/:id/reply', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { body, status } = req.body;

    if (!body) {
      return res.status(400).json({
        error: 'Message body required'
      });
    }

    const conversation = await prisma.conversation.findUnique({
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

    const agentMessage = await prisma.message.create({
      data: {
        conversationId: id,
        senderType: 'AGENT',
        body
      }
    });

    const updatedConversation = await prisma.conversation.update({
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

    liveChatEmitter.emit('new-message', {
      conversationId: id,
      message: agentMessage
    });

    liveChatEmitter.emit('crm-update', {
      conversationId: id,
      customerId: conversation.customerId,
      conversation: updatedConversation
    });

    return res.json({
      success: true,
      message: agentMessage
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      error: 'Failed to process manual reply'
    });
  }
});

// ==========================================
// UPDATE CONVERSATION STATUS
// ==========================================
app.patch('/api/v1/conversations/:id/status', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({
        error: 'Status required'
      });
    }

    const updated = await prisma.conversation.update({
      where: { id },
      data: { status },
      include: {
        customer: true
      }
    });

    liveChatEmitter.emit('crm-update', {
      conversationId: id,
      customerId: updated.customerId,
      conversation: updated
    });

    return res.json(updated);
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      error: 'Failed to update status'
    });
  }
});

// ==========================================
// DEV SEED ENDPOINT
// ==========================================
app.post('/api/v1/dev/seed', async (req: Request, res: Response) => {
  try {
    let tenant = await prisma.tenant.findFirst({
      where: {
        name: 'Acme Corp'
      }
    });

    if (!tenant) {
      tenant = await prisma.tenant.create({
        data: {
          name: 'Acme Corp',
          openaiKey: env.GEMINI_API_KEY || 'dummy-key'
        }
      });
    }

    // KB Seed
    const kbCount = await prisma.knowledgeBase.count({
      where: {
        tenantId: tenant.id
      }
    });

    if (kbCount === 0) {
      const kbData = [
        {
          title: 'Pricing Plans',
          content:
            'Acme Corp offers Starter ($19/mo), Growth ($49/mo), and Enterprise ($149/mo) plans.'
        },
        {
          title: 'Support Hours',
          content:
            'Support is available Monday-Friday from 9AM-6PM EST.'
        },
        {
          title: 'Refund Policy',
          content:
            'We offer a 30-day money back guarantee.'
        }
      ];

      for (const item of kbData) {
        await prisma.knowledgeBase.create({
          data: {
            tenantId: tenant.id,
            title: item.title,
            content: item.content
          }
        });
      }
    }

    let customer = await prisma.customer.findFirst();

    if (!customer) {
      customer = await prisma.customer.create({
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

    let conversation = await prisma.conversation.findFirst({
      where: {
        customerId: customer.id
      }
    });

    if (!conversation) {
      conversation = await prisma.conversation.create({
        data: {
          tenantId: tenant.id,
          customerId: customer.id,
          channel: Channel.WHATSAPP,
          status: 'AI_MANAGED'
        }
      });
    }

    // Queue REAL AI message
    await messageQueue.add('seed-test-message', {
      tenantApiKey: tenant.apiKey,
      channel: Channel.WHATSAPP,
      senderId: customer.phone!,
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
  } catch (error) {
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
app.post('/api/v1/test-ai', async (req: Request, res: Response) => {
  try {
    const tenant = await prisma.tenant.findFirst();

    if (!tenant) {
      return res.status(404).json({
        error: 'No tenant found'
      });
    }

    let customer = await prisma.customer.findFirst();

    if (!customer) {
      customer = await prisma.customer.create({
        data: {
          tenantId: tenant.id,
          name: 'Terminal Test User',
          phone: '+15550001'
        }
      });
    }

    const payload = {
      tenantApiKey: tenant.apiKey,
      channel: Channel.WHATSAPP,
      senderId: customer.phone || '+15550001',
      senderName: customer.name,
      messageId: `manual_${Date.now()}`,
      body: req.body.message || 'Tell me about pricing',
      metadata: {}
    };

    const job = await messageQueue.add(
      'manual-test-message',
      payload
    );

    return res.json({
      success: true,
      jobId: job.id
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      error: 'Failed to enqueue AI test'
    });
  }
});

// ==========================================
// START SERVER
// ==========================================
app.listen(env.PORT, () => {
  console.log(
    `[Server] Multi-channel platform server listening at http://localhost:${env.PORT}`
  );
});
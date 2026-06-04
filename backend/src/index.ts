import express, { Request, Response } from 'express';
import cors from 'cors';
<<<<<<< HEAD
import { Channel } from '@prisma/client';
=======
>>>>>>> 765969bd30239688115f15de9bc845dfa0e7665c
import { env } from './config/env';
import { prisma } from './db/client';
import webhookRouter from './routes/webhookRoutes';
import voiceCompletionRouter from './routes/voiceCompletion';
import { OutboundRouter } from './services/outboundRouter';
import { liveChatEmitter } from './services/toolService';
<<<<<<< HEAD
import {
  backfillKnowledgeBaseEmbeddings,
  createKnowledgeBaseEntry,
  ensureKnowledgeBaseVectorStore,
  updateKnowledgeBaseEntry
} from './services/knowledgeBaseService';
import './queues/messageWorker';
import { messageQueue, redisConnection } from './queues/messageQueue';
import { dashboardAuth } from './middleware/auth';
import { rateLimit } from './middleware/rateLimit';
import { resolveTenant } from './utils/tenant';

const app = express();

app.use(cors({ origin: env.NODE_ENV === 'production' ? env.FRONTEND_URL : '*' }));
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));

=======
import './queues/messageWorker';
import { messageQueue } from './queues/messageQueue';
import { Channel } from '@prisma/client';

const app = express();

app.use(cors({ origin: '*' }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request Logger
>>>>>>> 765969bd30239688115f15de9bc845dfa0e7665c
app.use((req, res, next) => {
  console.log(`[${req.method}] ${req.path}`);
  next();
});

<<<<<<< HEAD
app.get('/', (req: Request, res: Response) => {
  res.json({
    success: true,
    message: 'AutoBot Backend API Running'
  });
});

app.get('/api/v1/health', async (req: Request, res: Response) => {
  try {
    const [dbStatus, redisStatus] = await Promise.allSettled([
      prisma.$queryRaw`SELECT 1`,
      redisConnection.ping()
    ]);

    const services = {
      database: dbStatus.status === 'fulfilled' ? 'ok' : 'error',
      redis: redisStatus.status === 'fulfilled' ? 'ok' : 'error'
    };
    const healthy = services.database === 'ok' && services.redis === 'ok';

    return res.status(healthy ? 200 : 503).json({
      success: healthy,
      services,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return res.status(503).json({
      success: false,
      services: {
        database: 'error',
        redis: 'error'
      },
      error: String(error)
    });
  }
});

app.use('/api/v1/webhooks', rateLimit({ windowMs: 60_000, max: 120, keyPrefix: 'webhook' }), webhookRouter);
app.use('/api/v1/voice', rateLimit({ windowMs: 60_000, max: 60, keyPrefix: 'voice' }), voiceCompletionRouter);
app.use('/api/v1', rateLimit({ windowMs: 60_000, max: 240, keyPrefix: 'api' }));

app.get('/api/v1/knowledge-base', dashboardAuth, async (req: Request, res: Response) => {
  try {
    const tenant = await resolveTenant(req);

    if (!tenant) {
      return res.status(404).json({ error: 'Tenant not found' });
    }

    const entries = await prisma.knowledgeBase.findMany({
      where: { tenantId: tenant.id },
      orderBy: { updatedAt: 'desc' }
    });

    return res.json(entries);
  } catch (error) {
    console.error('[KnowledgeBase] List failure:', error);
    return res.status(500).json({ error: 'Failed to list knowledge base entries' });
  }
});

app.post('/api/v1/knowledge-base', dashboardAuth, async (req: Request, res: Response) => {
  try {
    const tenant = await resolveTenant(req);
    const { title, content } = req.body;

    if (!tenant) {
      return res.status(404).json({ error: 'Tenant not found' });
    }

    if (!title || !content) {
      return res.status(400).json({ error: 'Title and content are required' });
    }

    const entry = await createKnowledgeBaseEntry({
      tenantId: tenant.id,
      title,
      content
    });

    return res.status(201).json(entry);
  } catch (error) {
    console.error('[KnowledgeBase] Create failure:', error);
    return res.status(500).json({ error: 'Failed to create knowledge base entry' });
  }
});

app.patch('/api/v1/knowledge-base/:id', dashboardAuth, async (req: Request, res: Response) => {
  try {
    const tenant = await resolveTenant(req);
    const { id } = req.params;
    const { title, content } = req.body;

    if (!title && !content) {
      return res.status(400).json({ error: 'Title or content is required' });
    }

    const existing = tenant
      ? await prisma.knowledgeBase.findFirst({ where: { id, tenantId: tenant.id } })
      : null;

    if (!existing) {
      return res.status(404).json({ error: 'Knowledge base entry not found' });
    }

    const updated = await updateKnowledgeBaseEntry(id, { title, content });
    return res.json(updated);
  } catch (error) {
    console.error('[KnowledgeBase] Update failure:', error);
    return res.status(500).json({ error: 'Failed to update knowledge base entry' });
  }
});

app.delete('/api/v1/knowledge-base/:id', dashboardAuth, async (req: Request, res: Response) => {
  try {
    const tenant = await resolveTenant(req);

    if (!tenant) {
      return res.status(404).json({ error: 'Tenant not found' });
    }

    await prisma.knowledgeBase.deleteMany({
      where: {
        id: req.params.id,
        tenantId: tenant.id
      }
    });

    return res.json({ success: true });
  } catch (error) {
    console.error('[KnowledgeBase] Delete failure:', error);
    return res.status(500).json({ error: 'Failed to delete knowledge base entry' });
  }
});

app.post('/api/v1/knowledge-base/backfill', dashboardAuth, async (req: Request, res: Response) => {
  try {
    const tenant = await resolveTenant(req);
    const count = await backfillKnowledgeBaseEmbeddings(tenant?.id);
    return res.json({ success: true, count });
  } catch (error) {
    console.error('[KnowledgeBase] Backfill failure:', error);
    return res.status(500).json({ error: 'Failed to backfill knowledge base embeddings' });
  }
});

app.post('/api/v1/knowledge-base/:id/regenerate', dashboardAuth, async (req: Request, res: Response) => {
  try {
    const tenant = await resolveTenant(req);
    const entry = tenant
      ? await prisma.knowledgeBase.findFirst({
          where: {
            id: req.params.id,
            tenantId: tenant.id
          }
        })
      : null;

    if (!entry) {
      return res.status(404).json({ error: 'Knowledge base entry not found' });
    }

    const updated = await updateKnowledgeBaseEntry(entry.id, {});
    return res.json({ success: true, entry: updated });
  } catch (error) {
    console.error('[KnowledgeBase] Regenerate failure:', error);
    return res.status(500).json({ error: 'Failed to regenerate embedding' });
  }
});

app.get('/api/v1/stream', dashboardAuth, (req: Request, res: Response) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();
  res.write(`data: ${JSON.stringify({ connected: true })}\n\n`);

  const onNewMessage = (data: unknown) => {
    res.write(`event: message\ndata: ${JSON.stringify(data)}\n\n`);
  };
  const onTransferToHuman = (data: unknown) => {
    res.write(`event: transfer\ndata: ${JSON.stringify(data)}\n\n`);
  };
  const onCrmUpdate = (data: unknown) => {
=======
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
>>>>>>> 765969bd30239688115f15de9bc845dfa0e7665c
    res.write(`event: crm\ndata: ${JSON.stringify(data)}\n\n`);
  };

  liveChatEmitter.on('new-message', onNewMessage);
  liveChatEmitter.on('transfer-to-human', onTransferToHuman);
  liveChatEmitter.on('crm-update', onCrmUpdate);

<<<<<<< HEAD
=======
  // Heartbeat
>>>>>>> 765969bd30239688115f15de9bc845dfa0e7665c
  const heartbeat = setInterval(() => {
    res.write(': heartbeat\n\n');
  }, 15000);

  req.on('close', () => {
<<<<<<< HEAD
    liveChatEmitter.off('new-message', onNewMessage);
    liveChatEmitter.off('transfer-to-human', onTransferToHuman);
    liveChatEmitter.off('crm-update', onCrmUpdate);
    clearInterval(heartbeat);
=======
    console.log('[SSE] Client disconnected');

    liveChatEmitter.off('new-message', onNewMessage);
    liveChatEmitter.off('transfer-to-human', onTransferToHuman);
    liveChatEmitter.off('crm-update', onCrmUpdate);

    clearInterval(heartbeat);

>>>>>>> 765969bd30239688115f15de9bc845dfa0e7665c
    res.end();
  });
});

<<<<<<< HEAD
app.get('/api/v1/conversations', dashboardAuth, async (req: Request, res: Response) => {
  try {
    const tenant = await resolveTenant(req);

    if (!tenant) {
      return res.status(404).json({ error: 'Tenant not found' });
    }

    const conversations = await prisma.conversation.findMany({
      where: { tenantId: tenant.id },
=======
// ==========================================
// GET CONVERSATIONS
// ==========================================
app.get('/api/v1/conversations', async (req: Request, res: Response) => {
  try {
    const conversations = await prisma.conversation.findMany({
>>>>>>> 765969bd30239688115f15de9bc845dfa0e7665c
      include: {
        customer: true,
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1
        }
      },
<<<<<<< HEAD
      orderBy: { updatedAt: 'desc' }
=======
      orderBy: {
        updatedAt: 'desc'
      }
>>>>>>> 765969bd30239688115f15de9bc845dfa0e7665c
    });

    return res.json(conversations);
  } catch (error) {
    console.error(error);
<<<<<<< HEAD
    return res.status(500).json({ error: 'Failed to fetch conversations' });
  }
});

app.get('/api/v1/conversations/:id', dashboardAuth, async (req: Request, res: Response) => {
  try {
    const tenant = await resolveTenant(req);
    const conversation = tenant
      ? await prisma.conversation.findFirst({
          where: {
            id: req.params.id,
            tenantId: tenant.id
          },
          include: {
            customer: true,
            messages: {
              orderBy: { createdAt: 'asc' }
            }
          }
        })
      : null;

    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
=======

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
>>>>>>> 765969bd30239688115f15de9bc845dfa0e7665c
    }

    return res.json(conversation);
  } catch (error) {
    console.error(error);
<<<<<<< HEAD
    return res.status(500).json({ error: 'Failed to fetch conversation' });
  }
});

app.post('/api/v1/conversations/:id/reply', dashboardAuth, async (req: Request, res: Response) => {
  try {
    const tenant = await resolveTenant(req);
    const { body, status } = req.body;

    if (!body) {
      return res.status(400).json({ error: 'Message body required' });
    }

    const conversation = tenant
      ? await prisma.conversation.findFirst({
          where: {
            id: req.params.id,
            tenantId: tenant.id
          },
          include: { customer: true }
        })
      : null;

    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
=======

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
>>>>>>> 765969bd30239688115f15de9bc845dfa0e7665c
    }

    const agentMessage = await prisma.message.create({
      data: {
<<<<<<< HEAD
        conversationId: conversation.id,
=======
        conversationId: id,
>>>>>>> 765969bd30239688115f15de9bc845dfa0e7665c
        senderType: 'AGENT',
        body
      }
    });

    const updatedConversation = await prisma.conversation.update({
<<<<<<< HEAD
      where: { id: conversation.id },
=======
      where: { id },
>>>>>>> 765969bd30239688115f15de9bc845dfa0e7665c
      data: {
        status: status || conversation.status,
        updatedAt: new Date()
      },
<<<<<<< HEAD
      include: { customer: true }
    });

    const recipientId =
      conversation.channel === Channel.INSTAGRAM
        ? conversation.customer.instagramId || ''
        : conversation.channel === Channel.FACEBOOK
          ? conversation.customer.facebookId || ''
          : conversation.customer.phone || '';
=======
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
>>>>>>> 765969bd30239688115f15de9bc845dfa0e7665c

    await OutboundRouter.sendResponse({
      conversationId: conversation.id,
      channel: conversation.channel,
      recipientId,
      body
    });

    liveChatEmitter.emit('new-message', {
<<<<<<< HEAD
      conversationId: conversation.id,
      message: agentMessage
    });
    liveChatEmitter.emit('crm-update', {
      conversationId: conversation.id,
=======
      conversationId: id,
      message: agentMessage
    });

    liveChatEmitter.emit('crm-update', {
      conversationId: id,
>>>>>>> 765969bd30239688115f15de9bc845dfa0e7665c
      customerId: conversation.customerId,
      conversation: updatedConversation
    });

<<<<<<< HEAD
    return res.json({ success: true, message: agentMessage });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Failed to process manual reply' });
  }
});

app.patch('/api/v1/conversations/:id/status', dashboardAuth, async (req: Request, res: Response) => {
  try {
    const tenant = await resolveTenant(req);
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ error: 'Status required' });
    }

    const existing = tenant
      ? await prisma.conversation.findFirst({
          where: {
            id: req.params.id,
            tenantId: tenant.id
          }
        })
      : null;

    if (!existing) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    const updated = await prisma.conversation.update({
      where: { id: existing.id },
      data: { status },
      include: { customer: true }
    });

    liveChatEmitter.emit('crm-update', {
      conversationId: existing.id,
=======
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
>>>>>>> 765969bd30239688115f15de9bc845dfa0e7665c
      customerId: updated.customerId,
      conversation: updated
    });

    return res.json(updated);
  } catch (error) {
    console.error(error);
<<<<<<< HEAD
    return res.status(500).json({ error: 'Failed to update status' });
  }
});

app.get('/api/v1/tool-events', dashboardAuth, async (req: Request, res: Response) => {
  try {
    const tenant = await resolveTenant(req);

    if (!tenant) {
      return res.status(404).json({ error: 'Tenant not found' });
    }

    const events = await prisma.$queryRaw<any[]>`
      SELECT te.*
      FROM "ToolEvent" te
      INNER JOIN "Conversation" c ON c.id = te."conversationId"
      WHERE c."tenantId" = ${tenant.id}
      ORDER BY te."createdAt" DESC
      LIMIT 50
    `;

    return res.json(events);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Failed to fetch tool events' });
  }
});

app.get('/api/v1/analytics', dashboardAuth, async (req: Request, res: Response) => {
  try {
    const tenant = await resolveTenant(req);

    if (!tenant) {
      return res.status(404).json({ error: 'Tenant not found' });
    }

    const [conversationCount, leadCount, handoffCount, messages, channelGroups] = await Promise.all([
      prisma.conversation.count({ where: { tenantId: tenant.id } }),
      prisma.customer.count({
        where: {
          tenantId: tenant.id,
          metadata: {
            path: ['exportedToSheet'],
            equals: true
          }
        }
      }),
      prisma.conversation.count({ where: { tenantId: tenant.id, status: 'HUMAN_PENDING' } }),
      prisma.message.count({ where: { conversation: { tenantId: tenant.id } } }),
      prisma.conversation.groupBy({
        by: ['channel'],
        where: { tenantId: tenant.id },
        _count: { channel: true }
      })
    ]);

    return res.json({
      conversationCount,
      leadCount,
      handoffCount,
      messages,
      responseTimeSavedMinutes: messages * 3,
      channelDistribution: channelGroups.map((item) => ({
        channel: item.channel,
        count: item._count.channel
      }))
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});

app.post('/api/v1/dev/seed', async (req: Request, res: Response) => {
  try {
    if (env.NODE_ENV === 'production' || env.DISABLE_DEV_SEED) {
      return res.status(403).json({ error: 'Demo seed is disabled' });
    }

    let tenant = await prisma.tenant.findFirst({ where: { name: 'Acme Corp' } });
=======

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
>>>>>>> 765969bd30239688115f15de9bc845dfa0e7665c

    if (!tenant) {
      tenant = await prisma.tenant.create({
        data: {
          name: 'Acme Corp',
          openaiKey: env.GEMINI_API_KEY || 'dummy-key'
        }
      });
    }

<<<<<<< HEAD
    const kbCount = await prisma.knowledgeBase.count({ where: { tenantId: tenant.id } });
=======
    // KB Seed
    const kbCount = await prisma.knowledgeBase.count({
      where: {
        tenantId: tenant.id
      }
    });
>>>>>>> 765969bd30239688115f15de9bc845dfa0e7665c

    if (kbCount === 0) {
      const kbData = [
        {
          title: 'Pricing Plans',
<<<<<<< HEAD
          content: 'Acme Corp offers Starter ($19/mo), Growth ($49/mo), and Enterprise ($149/mo) plans.'
        },
        {
          title: 'Support Hours',
          content: 'Support is available Monday-Friday from 9AM-6PM EST.'
        },
        {
          title: 'Refund Policy',
          content: 'We offer a 30-day money back guarantee.'
        },
        {
          title: 'Voice Demo',
          content: 'Voice callers can book appointments, leave lead details, or request a human handoff.'
=======
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
>>>>>>> 765969bd30239688115f15de9bc845dfa0e7665c
        }
      ];

      for (const item of kbData) {
<<<<<<< HEAD
        await createKnowledgeBaseEntry({
          tenantId: tenant.id,
          title: item.title,
          content: item.content
        });
      }
    } else {
      await backfillKnowledgeBaseEmbeddings(tenant.id);
    }

    const customers = [
      { name: 'Alice Johnson', email: 'alice@example.com', phone: '+15550199' },
      { name: 'Maya Patel', instagramId: 'ig_demo_101' },
      { name: 'Jordan Lee', facebookId: 'fb_demo_202' },
      { name: 'Sam Rivera', phone: '+15550288' }
    ];

    for (const item of customers) {
      const customer = await prisma.customer.upsert({
        where: item.phone
          ? { tenantId_phone: { tenantId: tenant.id, phone: item.phone } }
          : item.instagramId
            ? { tenantId_instagramId: { tenantId: tenant.id, instagramId: item.instagramId } }
            : { tenantId_facebookId: { tenantId: tenant.id, facebookId: item.facebookId! } },
        update: item,
        create: {
          ...item,
          tenantId: tenant.id,
          metadata: {}
        }
      });

      const channel = item.instagramId ? Channel.INSTAGRAM : item.facebookId ? Channel.FACEBOOK : Channel.WHATSAPP;
      const conversation = await prisma.conversation.upsert({
        where: {
          customerId_channel: {
            customerId: customer.id,
            channel
          }
        },
        update: {},
        create: {
          tenantId: tenant.id,
          customerId: customer.id,
          channel,
          status: 'AI_MANAGED'
        }
      });

      const existingMessages = await prisma.message.count({ where: { conversationId: conversation.id } });

      if (existingMessages === 0) {
        await prisma.message.create({
          data: {
            conversationId: conversation.id,
            senderType: 'CUSTOMER',
            body: channel === Channel.WHATSAPP ? 'Tell me about pricing plans.' : 'Can I get help with a demo?'
          }
        });
      }
    }

    await messageQueue.add('seed-test-message', {
      tenantApiKey: tenant.apiKey,
      channel: Channel.WHATSAPP,
      senderId: '+15550199',
      senderName: 'Alice Johnson',
=======
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
>>>>>>> 765969bd30239688115f15de9bc845dfa0e7665c
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
<<<<<<< HEAD
=======

>>>>>>> 765969bd30239688115f15de9bc845dfa0e7665c
    return res.status(500).json({
      error: 'Database seeding failed',
      details: String(error)
    });
  }
});

<<<<<<< HEAD
app.post('/api/v1/test-ai', dashboardAuth, async (req: Request, res: Response) => {
  try {
    const tenant = await resolveTenant(req);

    if (!tenant) {
      return res.status(404).json({ error: 'No tenant found' });
    }

    let customer = await prisma.customer.findFirst({
      where: {
        tenantId: tenant.id,
        phone: '+15550001'
      }
    });
=======
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
>>>>>>> 765969bd30239688115f15de9bc845dfa0e7665c

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

<<<<<<< HEAD
    const job = await messageQueue.add('manual-test-message', payload);
    return res.json({ success: true, jobId: job.id });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Failed to enqueue AI test' });
  }
});

void ensureKnowledgeBaseVectorStore();

app.listen(env.PORT, () => {
  console.log(`[Server] Multi-channel platform server listening at http://localhost:${env.PORT}`);
});
=======
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
>>>>>>> 765969bd30239688115f15de9bc845dfa0e7665c

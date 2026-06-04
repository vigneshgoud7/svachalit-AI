import { Router, Request, Response } from 'express';
import { messageQueue } from '../queues/messageQueue';
import { Channel } from '@prisma/client';
import { InboundMessagePayload } from '../types';
import { prisma } from '../db/client';
import { ToolService } from '../services/toolService';
<<<<<<< HEAD
import { env } from '../config/env';
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

// Meta Webhook Verification Token
const META_VERIFY_TOKEN = env.META_VERIFY_TOKEN;
=======

const router = Router();

// Meta Webhook Verification Token
const META_VERIFY_TOKEN = process.env.META_VERIFY_TOKEN || 'multichannel_verify_token_123';
>>>>>>> 765969bd30239688115f15de9bc845dfa0e7665c

const verifyMetaWebhook = (req: Request, res: Response) => {
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
router.post('/whatsapp', async (req: Request, res: Response) => {
  try {
    const { body } = req;
    console.log('[Webhook] Received WhatsApp payload:', JSON.stringify(body, null, 2));

<<<<<<< HEAD
    const tenantApiKey = getTenantApiKey(req);
=======
    const tenantApiKey = (req.headers['x-tenant-api-key'] || req.query.apiKey) as string;
>>>>>>> 765969bd30239688115f15de9bc845dfa0e7665c
    if (!tenantApiKey) {
      return res.status(401).json({ error: 'Missing tenant API Key' });
    }

    if (body.entry && body.entry[0]?.changes && body.entry[0].changes[0]?.value?.messages) {
      const value = body.entry[0].changes[0].value;
      const message = value.messages[0];
      const contact = value.contacts?.[0];
      
      if (message.type === 'text') {
        const payload: InboundMessagePayload = {
          tenantApiKey,
          channel: Channel.WHATSAPP,
          senderId: message.from,
          senderName: contact?.profile?.name || 'WhatsApp User',
          messageId: message.id,
          body: message.text.body,
          metadata: { raw: body }
        };

        const job = await messageQueue.add('whatsapp-message', payload);
        console.log(`[Webhook] Enqueued WhatsApp message Job: ${job.id}`);
      }
    }

    return res.status(200).send('EVENT_RECEIVED');
  } catch (error) {
    console.error('[Webhook] WhatsApp parser error:', error);
    return res.status(500).json({ error: 'Internal processing error' });
  }
});

// ==========================================
// 2. INSTAGRAM WEBHOOK HANDLERS
// ==========================================
router.get('/instagram', verifyMetaWebhook);
router.post('/instagram', async (req: Request, res: Response) => {
  try {
    const { body } = req;
    console.log('[Webhook] Received Instagram payload:', JSON.stringify(body, null, 2));

<<<<<<< HEAD
    const tenantApiKey = getTenantApiKey(req);
=======
    const tenantApiKey = (req.headers['x-tenant-api-key'] || req.query.apiKey) as string;
>>>>>>> 765969bd30239688115f15de9bc845dfa0e7665c
    if (!tenantApiKey) {
      return res.status(401).json({ error: 'Missing tenant API Key' });
    }

    if (body.entry && body.entry[0]?.messaging) {
      const messagingEvent = body.entry[0].messaging[0];
      if (messagingEvent.message && !messagingEvent.message.is_echo) {
        const payload: InboundMessagePayload = {
          tenantApiKey,
          channel: Channel.INSTAGRAM,
          senderId: messagingEvent.sender.id,
          senderName: 'Instagram Customer',
          messageId: messagingEvent.message.mid,
          body: messagingEvent.message.text || '',
          metadata: { raw: body }
        };

        const job = await messageQueue.add('instagram-message', payload);
        console.log(`[Webhook] Enqueued Instagram message Job: ${job.id}`);
      }
    }

    return res.status(200).send('EVENT_RECEIVED');
  } catch (error) {
    console.error('[Webhook] Instagram parser error:', error);
    return res.status(500).json({ error: 'Internal processing error' });
  }
});

// ==========================================
// 3. FACEBOOK WEBHOOK HANDLERS
// ==========================================
router.get('/facebook', verifyMetaWebhook);
router.post('/facebook', async (req: Request, res: Response) => {
  try {
    const { body } = req;
    console.log('[Webhook] Received Facebook Messenger payload:', JSON.stringify(body, null, 2));

<<<<<<< HEAD
    const tenantApiKey = getTenantApiKey(req);
=======
    const tenantApiKey = (req.headers['x-tenant-api-key'] || req.query.apiKey) as string;
>>>>>>> 765969bd30239688115f15de9bc845dfa0e7665c
    if (!tenantApiKey) {
      return res.status(401).json({ error: 'Missing tenant API Key' });
    }

    if (body.entry && body.entry[0]?.messaging) {
      const messagingEvent = body.entry[0].messaging[0];
      if (messagingEvent.message && !messagingEvent.message.is_echo) {
        const payload: InboundMessagePayload = {
          tenantApiKey,
          channel: Channel.FACEBOOK,
          senderId: messagingEvent.sender.id,
          senderName: 'Facebook User',
          messageId: messagingEvent.message.mid,
          body: messagingEvent.message.text || '',
          metadata: { raw: body }
        };

        const job = await messageQueue.add('facebook-message', payload);
        console.log(`[Webhook] Enqueued Facebook message Job: ${job.id}`);
      }
    }

    return res.status(200).send('EVENT_RECEIVED');
  } catch (error) {
    console.error('[Webhook] Facebook parser error:', error);
    return res.status(500).json({ error: 'Internal processing error' });
  }
});

// ==========================================
// 4. VOICE WEBHOOK HANDLERS (Vapi & Twilio event receiver)
// ==========================================
router.post('/voice', async (req: Request, res: Response) => {
  try {
    const { body } = req;
    console.log('[Webhook] Received Voice webhook payload:', JSON.stringify(body, null, 2));

<<<<<<< HEAD
    const tenantApiKey = getTenantApiKey(req);
=======
    const tenantApiKey = (req.headers['x-tenant-api-key'] || req.query.apiKey) as string;
>>>>>>> 765969bd30239688115f15de9bc845dfa0e7665c
    if (!tenantApiKey) {
      return res.status(401).json({ error: 'Missing tenant API Key' });
    }

    const tenant = await prisma.tenant.findUnique({ where: { apiKey: tenantApiKey } });
    if (!tenant) {
      return res.status(404).json({ error: 'Tenant not found' });
    }

    // A. Detect Twilio Call Parameters
    if (req.body.CallSid) {
      const senderId = req.body.From;
      const bodyText = req.body.SpeechResult || req.body.Body || '';
      const messageId = req.body.CallSid;

      if (senderId && bodyText) {
        const payload: InboundMessagePayload = {
          tenantApiKey,
          channel: Channel.VOICE,
          senderId,
          senderName: 'Voice Caller',
          messageId,
          body: bodyText,
          metadata: { raw: body }
        };

        const job = await messageQueue.add('voice-message', payload);
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
      let customer = await prisma.customer.findFirst({
        where: { tenantId: tenant.id, phone: customerPhone }
      });
      if (!customer) {
        customer = await prisma.customer.create({
          data: { tenantId: tenant.id, name: 'Voice Caller', phone: customerPhone }
        });
      }

      let conversation = await prisma.conversation.findUnique({
        where: { customerId_channel: { customerId: customer.id, channel: Channel.VOICE } }
      });
      if (!conversation) {
        conversation = await prisma.conversation.create({
          data: { tenantId: tenant.id, customerId: customer.id, channel: Channel.VOICE }
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
<<<<<<< HEAD
              url: `${env.PUBLIC_API_URL}/api/v1/voice/completion?apiKey=${tenantApiKey}`,
=======
              url: `http://localhost:4000/api/v1/voice/completion?apiKey=${tenantApiKey}`,
>>>>>>> 765969bd30239688115f15de9bc845dfa0e7665c
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
        ToolService.liveChatEmitter.emit('crm-update', {
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
        const results: any[] = [];

        for (const toolCall of vapiMessage.toolCalls) {
          const { name } = toolCall.function;
          const rawArgs = toolCall.function.arguments;
          
          // Safer parsing
<<<<<<< HEAD
          const args = safeJsonParse(rawArgs) as any;
=======
          const args = typeof rawArgs === 'string' ? JSON.parse(rawArgs) : rawArgs;
>>>>>>> 765969bd30239688115f15de9bc845dfa0e7665c
          let resultText = '';

          if (name === 'bookAppointment') {
            const data = await ToolService.bookAppointment({
              dateTime: args.dateTime,
              customerName: args.customerName,
              conversationId: conversation.id
            });
            resultText = JSON.stringify(data);
          } else if (name === 'exportToSheet') {
            const data = await ToolService.exportToSheet({
              leadData: args,
              conversationId: conversation.id
            });
            resultText = JSON.stringify(data);
          } else if (name === 'transferToHuman') {
            const data = await ToolService.transferToHuman({ conversationId: conversation.id });
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
        
        ToolService.liveChatEmitter.emit('crm-update', {
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

        const savedSummaryMessage = await prisma.message.create({
          data: {
            conversationId: conversation.id,
            senderType: 'AI',
            body: `[CALL ENDED - SUMMARY]: ${vapiMessage.summary || 'Caller hung up.'}`,
            metadata: { duration: vapiMessage.duration, cost: vapiMessage.cost }
          }
        });

        ToolService.liveChatEmitter.emit('new-message', {
          conversationId: conversation.id,
          message: savedSummaryMessage
        });

        ToolService.liveChatEmitter.emit('crm-update', {
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
  } catch (error) {
    console.error('[Webhook] Voice webhook ingestion failure:', error);
    return res.status(500).json({ error: 'Internal voice processing failure' });
  }
});

export default router;

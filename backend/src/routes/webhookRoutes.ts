import { Router, Request, Response } from 'express';
import { messageQueue } from '../queues/messageQueue';
import { Channel } from '@prisma/client';
import { InboundMessagePayload } from '../types';

const router = Router();

// Meta Webhook Verification Token (set this in Meta Developer Portal)
const META_VERIFY_TOKEN = process.env.META_VERIFY_TOKEN || 'multichannel_verify_token_123';

/**
 * Shared Meta challenge verification handler.
 * Used by Meta to confirm ownership of the webhook URL.
 */
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

    // Extract headers or query params for Tenant Authorization
    const tenantApiKey = (req.headers['x-tenant-api-key'] || req.query.apiKey) as string;
    if (!tenantApiKey) {
      return res.status(401).json({ error: 'Missing tenant API Key in header/query parameters (x-tenant-api-key)' });
    }

    // Parse Meta Cloud API message payload structures
    // Ref: https://developers.facebook.com/docs/whatsapp/cloud-api/webhooks/payload-examples
    if (body.entry && body.entry[0]?.changes && body.entry[0].changes[0]?.value?.messages) {
      const value = body.entry[0].changes[0].value;
      const message = value.messages[0];
      const contact = value.contacts?.[0];
      
      if (message.type === 'text') {
        const payload: InboundMessagePayload = {
          tenantApiKey,
          channel: Channel.WHATSAPP,
          senderId: message.from, // Sender phone number
          senderName: contact?.profile?.name || 'WhatsApp User',
          messageId: message.id,
          body: message.text.body,
          metadata: { raw: body }
        };

        // Push to BullMQ
        const job = await messageQueue.add('whatsapp-message', payload);
        console.log(`[Webhook] Enqueued WhatsApp message Job: ${job.id}`);
      }
    }

    // Always return 200 to acknowledge Meta webhook delivery
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

    const tenantApiKey = (req.headers['x-tenant-api-key'] || req.query.apiKey) as string;
    if (!tenantApiKey) {
      return res.status(401).json({ error: 'Missing tenant API Key' });
    }

    // Instagram Messenger Graph Webhooks
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

    const tenantApiKey = (req.headers['x-tenant-api-key'] || req.query.apiKey) as string;
    if (!tenantApiKey) {
      return res.status(401).json({ error: 'Missing tenant API Key' });
    }

    // Messenger Webhooks
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
// 4. VOICE WEBHOOK HANDLERS (Twilio & Vapi/Retell AI support)
// ==========================================
router.post('/voice', async (req: Request, res: Response) => {
  try {
    const { body } = req;
    console.log('[Webhook] Received Voice stream payload:', JSON.stringify(body, null, 2));

    const tenantApiKey = (req.headers['x-tenant-api-key'] || req.query.apiKey) as string;
    if (!tenantApiKey) {
      return res.status(401).json({ error: 'Missing tenant API Key' });
    }

    let senderId = '';
    let bodyText = '';
    let messageId = '';

    // A. Detect Twilio Call Form Parameters (x-www-form-urlencoded)
    if (req.body.CallSid) {
      senderId = req.body.From; // Customer phone number
      bodyText = req.body.SpeechResult || req.body.Body || ''; // Speech-to-text transcription from Twilio <Gather>
      messageId = req.body.CallSid;
    } 
    // B. Detect Vapi Assistant Request / Webhook payload format
    else if (body.message) {
      const msg = body.message;
      if (msg.type === 'transcript' && msg.transcriptType === 'final') {
        senderId = msg.customer?.number || 'Voice Call';
        bodyText = msg.transcript;
        messageId = msg.call?.id || String(Date.now());
      }
    }

    // Process only if we have transcribed speech
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
      console.log(`[Webhook] Enqueued Voice message Job: ${job.id}`);

      // Return a quick voice-specific JSON trigger back to provider if needed
      return res.status(200).json({ status: 'queued', jobId: job.id });
    }

    return res.status(200).json({ status: 'skipped', reason: 'No voice transcription captured yet' });
  } catch (error) {
    console.error('[Webhook] Voice parser error:', error);
    return res.status(500).json({ error: 'Internal processing error' });
  }
});

export default router;

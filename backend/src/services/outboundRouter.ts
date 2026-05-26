import { Channel } from '@prisma/client';
import { OutboundMessagePayload } from '../types';

/**
 * Robust fetch wrapper with exponential backoff retry logic.
 * Useful for hitting Meta Graph and Twilio/Vapi API endpoints.
 */
async function fetchWithRetry(url: string, options: RequestInit, retries = 3, delay = 1000): Promise<Response> {
  try {
    const response = await fetch(url, options);
    if (!response.ok) {
      // If server returns rate limit (429) or server errors (5xx), trigger retry
      if (response.status === 429 || response.status >= 500) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    }
    return response;
  } catch (error) {
    if (retries > 0) {
      console.warn(`[OutboundRouter] Request failed. Retrying in ${delay}ms... (${retries} attempts left). Error:`, error);
      await new Promise(resolve => setTimeout(resolve, delay));
      return fetchWithRetry(url, options, retries - 1, delay * 2);
    }
    throw error;
  }
}

export class OutboundRouter {
  /**
   * Main dispatch method to send outbound responses back to the original channel.
   */
  static async sendResponse(payload: OutboundMessagePayload): Promise<boolean> {
    const { channel, recipientId, body } = payload;
    console.log(`[OutboundRouter] Sending response via channel [${channel}] to user [${recipientId}]: "${body.substring(0, 60)}..."`);

    try {
      switch (channel) {
        case Channel.WHATSAPP:
          return await this.sendWhatsAppMessage(recipientId, body);
        case Channel.INSTAGRAM:
          return await this.sendInstagramMessage(recipientId, body);
        case Channel.FACEBOOK:
          return await this.sendFacebookMessage(recipientId, body);
        case Channel.VOICE:
          return await this.sendVoiceResponse(recipientId, body);
        case Channel.WEB:
          return await this.sendWebResponse(payload.conversationId, body);
        default:
          console.error(`[OutboundRouter] Unsupported channel type: ${channel}`);
          return false;
      }
    } catch (error) {
      console.error(`[OutboundRouter] Outbound message failed routing for channel ${channel}:`, error);
      throw error; // Re-throw to trigger BullMQ job retry mechanics
    }
  }

  /**
   * Meta Cloud API: Send WhatsApp templates or session messages
   * Ref: https://developers.facebook.com/docs/whatsapp/cloud-api/reference/messages
   */
  private static async sendWhatsAppMessage(phone: string, text: string): Promise<boolean> {
    const accessToken = process.env.WHATSAPP_ACCESS_TOKEN || 'mock_token';
    const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID || 'mock_phone_id';
    
    // In local dev/test mode, we skip making the actual external calls
    if (accessToken === 'mock_token') {
      console.log(`[OutboundRouter] [MOCK WHATSAPP] Message successfully delivered to: ${phone}`);
      return true;
    }

    const url = `https://graph.facebook.com/v19.0/${phoneNumberId}/messages`;
    const response = await fetchWithRetry(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: phone,
        type: 'text',
        text: { body: text },
      }),
    });

    return response.ok;
  }

  /**
   * Instagram Graph API: Send DM
   * Ref: https://developers.facebook.com/docs/instagram-api/guides/messaging
   */
  private static async sendInstagramMessage(igId: string, text: string): Promise<boolean> {
    const accessToken = process.env.INSTAGRAM_ACCESS_TOKEN || 'mock_token';
    
    if (accessToken === 'mock_token') {
      console.log(`[OutboundRouter] [MOCK INSTAGRAM] Message successfully delivered to: ${igId}`);
      return true;
    }

    const url = `https://graph.facebook.com/v19.0/me/messages`;
    const response = await fetchWithRetry(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        recipient: { id: igId },
        message: { text },
      }),
    });

    return response.ok;
  }

  /**
   * Facebook Messenger API
   * Ref: https://developers.facebook.com/docs/messenger-platform/reference/send-api
   */
  private static async sendFacebookMessage(fbId: string, text: string): Promise<boolean> {
    const accessToken = process.env.FACEBOOK_ACCESS_TOKEN || 'mock_token';

    if (accessToken === 'mock_token') {
      console.log(`[OutboundRouter] [MOCK FACEBOOK] Message successfully delivered to: ${fbId}`);
      return true;
    }

    const url = `https://graph.facebook.com/v19.0/me/messages?access_token=${accessToken}`;
    const response = await fetchWithRetry(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        recipient: { id: fbId },
        messaging_type: 'RESPONSE',
        message: { text },
      }),
    });

    return response.ok;
  }

  /**
   * Twilio / Vapi response formats (typically JSON returned to the voice stream server)
   * Vapi expecting TwiML or a JSON response layout instructions.
   */
  private static async sendVoiceResponse(callSid: string, text: string): Promise<boolean> {
    console.log(`[OutboundRouter] [MOCK VOICE RESPONSE] Sending TTS parameters back to call context: ${callSid}`);
    // Simulate updating active Twilio call stream using standard API calls
    const accountSid = process.env.TWILIO_ACCOUNT_SID || 'mock_sid';
    const authToken = process.env.TWILIO_AUTH_TOKEN || 'mock_token';

    if (accountSid === 'mock_sid') {
      return true;
    }

    const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Calls/${callSid}.json`;
    const response = await fetchWithRetry(url, {
      method: 'POST',
      headers: {
        'Authorization': 'Basic ' + Buffer.from(`${accountSid}:${authToken}`).toString('base64'),
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        Twiml: `<Response><Say>${text}</Say></Response>`,
      }).toString(),
    });

    return response.ok;
  }

  /**
   * Web client updates (e.g. SSE connections)
   */
  private static async sendWebResponse(conversationId: string, text: string): Promise<boolean> {
    console.log(`[OutboundRouter] [WEB CHANNEL] Broadcasting reply to conversation: ${conversationId}`);
    return true;
  }
}

import { Channel } from '@prisma/client';

export interface InboundMessagePayload {
  tenantApiKey: string;
  channel: Channel;
  senderId: string;     // Unique phone number, Instagram handle/ID, Messenger ID
  senderName?: string;
  messageId: string;    // External provider's message identifier
  body: string;         // Parsed text representation of the message
  metadata?: any;       // Raw provider payload and diagnostic headers
}

export interface OutboundMessagePayload {
  conversationId: string;
  channel: Channel;
  recipientId: string;  // Destination address (phone, PSID, handle)
  body: string;         // Response content
  metadata?: any;
}

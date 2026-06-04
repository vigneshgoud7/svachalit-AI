export interface Message {
  id: string;
  senderType: 'CUSTOMER' | 'AI' | 'AGENT';
  body: string;
  createdAt: string;
}

export interface Customer {
  id: string;
  name?: string;
  email?: string;
  phone?: string;
  instagramId?: string;
  facebookId?: string;
  metadata?: Record<string, unknown>;
}

export interface Conversation {
  id: string;
  channel: 'WHATSAPP' | 'INSTAGRAM' | 'FACEBOOK' | 'VOICE' | 'WEB';
  status: 'AI_MANAGED' | 'HUMAN_PENDING';
  updatedAt: string;
  customer: Customer;
  messages: Message[];
}

export interface Analytics {
  conversationCount: number;
  leadCount: number;
  handoffCount: number;
  messages: number;
  responseTimeSavedMinutes: number;
  channelDistribution: Array<{
    channel: string;
    count: number;
  }>;
}

export interface KnowledgeBaseEntry {
  id: string;
  title: string;
  content: string;
  updatedAt: string;
}

export interface ToolEvent {
  id: string;
  conversationId: string;
  toolName: string;
  status: string;
  createdAt: string;
}

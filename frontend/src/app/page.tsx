'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  MessageSquare, 
  Send, 
  User, 
  Bot, 
  Phone, 
  Instagram, 
  Facebook, 
  Globe, 
  Settings, 
  Calendar, 
  Database, 
  CheckCircle, 
  AlertTriangle, 
  Search,
  Sparkles,
  Layers,
  ArrowRightLeft,
  BookOpen
} from 'lucide-react';

// Define TS types matching backend models
interface Customer {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  instagramId: string | null;
  facebookId: string | null;
  metadata: any;
  createdAt: string;
}

interface Message {
  id: string;
  conversationId: string;
  senderType: 'CUSTOMER' | 'AI' | 'AGENT';
  body: string;
  createdAt: string;
  metadata?: any;
}

interface Conversation {
  id: string;
  channel: 'WHATSAPP' | 'INSTAGRAM' | 'FACEBOOK' | 'VOICE' | 'WEB';
  status: 'AI_MANAGED' | 'HUMAN_PENDING';
  customerId: string;
  customer: Customer;
  messages: Message[];
  updatedAt: string;
}

export default function Dashboard() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConvId, setSelectedConvId] = useState<string | null>(null);
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);
  const [replyText, setReplyText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [channelFilter, setChannelFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  
  // Developer Seeding details
  const [tenantKey, setTenantKey] = useState<string | null>(null);
  const [seedingStatus, setSeedingStatus] = useState<string>('');

  const chatEndRef = useRef<HTMLDivElement>(null);
  const sseRef = useRef<EventSource | null>(null);

  const BACKEND_URL = 'http://localhost:4000';

  // 1. Fetch Conversations on Mount
  const fetchConversations = async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/v1/conversations`);
      if (res.ok) {
        const data = await res.json();
        setConversations(data);
      }
    } catch (err) {
      console.error('Failed to load conversations:', err);
    }
  };

  useEffect(() => {
    fetchConversations();
  }, []);

  // 2. Fetch Detailed Active Conversation Message Logs
  useEffect(() => {
    if (!selectedConvId) {
      setActiveConversation(null);
      return;
    }

    const fetchActiveDetails = async () => {
      try {
        const res = await fetch(`${BACKEND_URL}/api/v1/conversations/${selectedConvId}`);
        if (res.ok) {
          const data = await res.json();
          setActiveConversation(data);
        }
      } catch (err) {
        console.error('Failed to load active thread details:', err);
      }
    };

    fetchActiveDetails();
  }, [selectedConvId]);

  // 3. Connect Server-Sent Events (SSE) for Real-Time Synchronization
  useEffect(() => {
    console.log('[SSE] Opening connection...');
    const eventSource = new EventSource(`${BACKEND_URL}/api/v1/stream`);
    sseRef.current = eventSource;

    // Listen to incoming messages
    eventSource.addEventListener('message', (event: any) => {
      const data = JSON.parse(event.data);
      console.log('[SSE] Message received:', data);
      
      // Update historical message view if conversation active
      setActiveConversation(prev => {
        if (prev && prev.id === data.conversationId) {
          // Prevent duplicates
          if (prev.messages.some(m => m.id === data.message.id)) return prev;
          return {
            ...prev,
            messages: [...prev.messages, data.message]
          };
        }
        return prev;
      });

      // Update conversations sidebar list preview
      setConversations(prevList => {
        return prevList.map(c => {
          if (c.id === data.conversationId) {
            return {
              ...c,
              messages: [data.message], // Replace preview message
              updatedAt: new Date().toISOString()
            };
          }
          return c;
        });
      });
    });

    // Listen to human transitions
    eventSource.addEventListener('transfer', (event: any) => {
      const data = JSON.parse(event.data);
      console.log('[SSE] Transfer status update:', data);

      setConversations(prev => prev.map(c => {
        if (c.id === data.conversationId) {
          return { ...c, status: data.status };
        }
        return c;
      }));

      setActiveConversation(prev => {
        if (prev && prev.id === data.conversationId) {
          return { ...prev, status: data.status };
        }
        return prev;
      });
    });

    // Listen to CRM details updates
    eventSource.addEventListener('crm', (event: any) => {
      const data = JSON.parse(event.data);
      console.log('[SSE] CRM parameter updated:', data);

      setConversations(prev => prev.map(c => {
        if (c.id === data.conversationId) {
          return { 
            ...c, 
            customer: data.customer,
            status: data.conversation?.status || c.status
          };
        }
        return c;
      }));

      setActiveConversation(prev => {
        if (prev && prev.id === data.conversationId) {
          return { 
            ...prev, 
            customer: data.customer,
            status: data.conversation?.status || prev.status
          };
        }
        return prev;
      });
    });

    eventSource.onerror = (err) => {
      console.error('[SSE] Connection error. Standard retrying active.', err);
    };

    return () => {
      eventSource.close();
    };
  }, []);

  // 4. Scroll to bottom of message panel
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeConversation?.messages]);

  // 5. Send Manual Message Handler
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() || !selectedConvId) return;

    const payload = {
      body: replyText,
      status: 'HUMAN_PENDING' // Standard human agent intervention marks status
    };

    setReplyText('');

    try {
      const res = await fetch(`${BACKEND_URL}/api/v1/conversations/${selectedConvId}/reply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        console.error('Failed to post reply.');
      }
    } catch (err) {
      console.error('Error posting message:', err);
    }
  };

  // 6. Change conversation status manually (Toggle AI / Human Control)
  const toggleAutomationStatus = async (newStatus: 'AI_MANAGED' | 'HUMAN_PENDING') => {
    if (!selectedConvId) return;

    try {
      const res = await fetch(`${BACKEND_URL}/api/v1/conversations/${selectedConvId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!res.ok) {
        console.error('Failed to update status');
      }
    } catch (err) {
      console.error('Error updating status:', err);
    }
  };

  // 7. Developer seed utility trigger
  const runDatabaseSeed = async () => {
    setSeedingStatus('Seeding database...');
    try {
      const res = await fetch(`${BACKEND_URL}/api/v1/dev/seed`, {
        method: 'POST'
      });
      if (res.ok) {
        const data = await res.json();
        setTenantKey(data.tenantApiKey);
        setSeedingStatus('Success! Click fetch to refresh lists.');
        fetchConversations();
      } else {
        setSeedingStatus('Failed database seeds.');
      }
    } catch (err) {
      setSeedingStatus('Server unavailable.');
    }
  };

  // Channel helper styling & icon
  const getChannelIcon = (channel: string) => {
    switch (channel) {
      case 'WHATSAPP':
        return <Phone className="h-4 w-4 text-green-500" />;
      case 'INSTAGRAM':
        return <Instagram className="h-4 w-4 text-pink-500" />;
      case 'FACEBOOK':
        return <Facebook className="h-4 w-4 text-blue-500" />;
      case 'VOICE':
        return <Phone className="h-4 w-4 text-orange-500" />;
      default:
        return <Globe className="h-4 w-4 text-indigo-500" />;
    }
  };

  // Filter conversations based on sidebar toggle states
  const filteredConversations = conversations.filter(c => {
    const matchesSearch = c.customer.name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          c.customer.phone?.includes(searchQuery) ||
                          c.messages[0]?.body?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesChannel = channelFilter === 'ALL' || c.channel === channelFilter;
    const matchesStatus = statusFilter === 'ALL' || c.status === statusFilter;

    return matchesSearch && matchesChannel && matchesStatus;
  });

  return (
    <div className="flex flex-col h-screen text-gray-100 bg-[#09090b]">
      {/* HEADER SECTION */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 bg-zinc-950/70 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-600 rounded-lg text-white glow-primary">
            <Layers className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight bg-gradient-to-r from-white via-zinc-200 to-zinc-500 bg-clip-text text-transparent">
              OmniChannel Hub
            </h1>
            <p className="text-xs text-zinc-500">Hub-and-Spoke Automation Controller</p>
          </div>
        </div>

        {/* Dev Seeding Helper tools */}
        <div className="flex items-center gap-3">
          {tenantKey && (
            <div className="hidden md:flex items-center gap-2 px-3 py-1 bg-zinc-900 border border-zinc-800 rounded-md text-xs">
              <span className="text-zinc-500">API Key:</span>
              <code className="text-indigo-400 font-mono select-all">{tenantKey}</code>
            </div>
          )}
          <button
            onClick={runDatabaseSeed}
            className="flex items-center gap-2 px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 text-xs font-medium text-zinc-300 rounded-md transition-all active:scale-95"
          >
            <Database className="h-3.5 w-3.5 text-indigo-400" />
            Seed Dev DB
          </button>
          <button
            onClick={fetchConversations}
            className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold rounded-md transition-all active:scale-95 glow-primary"
          >
            Refresh
          </button>
        </div>
      </header>

      {/* MAIN CONTAINER */}
      <div className="flex flex-1 overflow-hidden">
        
        {/* LEFT COLUMN: CONVERSATION LIST */}
        <aside className="w-80 border-r border-zinc-800 flex flex-col bg-zinc-950/40">
          {/* Seeding diagnostic logs */}
          {seedingStatus && (
            <div className="px-4 py-2 bg-zinc-900/80 border-b border-zinc-800 text-[11px] text-zinc-400 font-medium text-center">
              {seedingStatus}
            </div>
          )}

          {/* Search box */}
          <div className="p-4 border-b border-zinc-800">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-500" />
              <input
                type="text"
                placeholder="Search conversations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-xs bg-zinc-900 border border-zinc-800 rounded-md focus:outline-none focus:border-indigo-500 transition-colors"
              />
            </div>
          </div>

          {/* Channel Filters */}
          <div className="px-4 py-2 border-b border-zinc-800 flex flex-wrap gap-1 bg-zinc-950/20">
            {['ALL', 'WHATSAPP', 'INSTAGRAM', 'FACEBOOK', 'VOICE'].map(ch => (
              <button
                key={ch}
                onClick={() => setChannelFilter(ch)}
                className={`px-2 py-1 text-[10px] font-semibold rounded-md transition-all ${
                  channelFilter === ch 
                    ? 'bg-zinc-800 text-white border border-zinc-700' 
                    : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                {ch === 'ALL' ? 'All' : ch.substring(0, 4)}
              </button>
            ))}
          </div>

          {/* Handoff Status Filters */}
          <div className="px-4 py-2 border-b border-zinc-800 flex gap-2 justify-between">
            <button
              onClick={() => setStatusFilter('ALL')}
              className={`flex-1 py-1 text-[10px] font-semibold text-center rounded-md ${
                statusFilter === 'ALL' ? 'bg-zinc-800 text-zinc-100' : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              All Status
            </button>
            <button
              onClick={() => setStatusFilter('HUMAN_PENDING')}
              className={`flex-1 py-1 text-[10px] font-semibold text-center rounded-md flex items-center justify-center gap-1 ${
                statusFilter === 'HUMAN_PENDING' ? 'bg-amber-950/40 text-amber-400 border border-amber-800/40' : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              <AlertTriangle className="h-3 w-3" />
              Agent Needed
            </button>
            <button
              onClick={() => setStatusFilter('AI_MANAGED')}
              className={`flex-1 py-1 text-[10px] font-semibold text-center rounded-md flex items-center justify-center gap-1 ${
                statusFilter === 'AI_MANAGED' ? 'bg-indigo-950/40 text-indigo-400 border border-indigo-800/40' : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              <Bot className="h-3 w-3" />
              AI Active
            </button>
          </div>

          {/* List Area */}
          <div className="flex-1 overflow-y-auto divide-y divide-zinc-900">
            {filteredConversations.length === 0 ? (
              <div className="p-8 text-center text-xs text-zinc-600 flex flex-col items-center gap-2">
                <MessageSquare className="h-8 w-8 text-zinc-800" />
                No active conversations
              </div>
            ) : (
              filteredConversations.map(conv => {
                const isActive = selectedConvId === conv.id;
                const lastMsg = conv.messages[0];
                const isPending = conv.status === 'HUMAN_PENDING';

                return (
                  <div
                    key={conv.id}
                    onClick={() => setSelectedConvId(conv.id)}
                    className={`p-4 cursor-pointer relative transition-all border-l-2 ${
                      isActive 
                        ? 'bg-zinc-900/60 border-indigo-500' 
                        : isPending 
                          ? 'bg-amber-950/5 hover:bg-zinc-900/30 border-amber-500' 
                          : 'hover:bg-zinc-900/20 border-transparent'
                    }`}
                  >
                    {/* Header */}
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-1.5">
                        {getChannelIcon(conv.channel)}
                        <span className="font-semibold text-xs truncate max-w-[120px]">
                          {conv.customer.name || 'Anonymous'}
                        </span>
                      </div>
                      <span className="text-[9px] text-zinc-600 font-medium">
                        {new Date(conv.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    {/* Body preview */}
                    <p className="text-xs text-zinc-500 truncate max-w-[200px] mb-2">
                      {lastMsg ? lastMsg.body : 'No messages'}
                    </p>

                    {/* Foot badges */}
                    <div className="flex items-center justify-between">
                      <span className="text-[8px] tracking-wider text-zinc-600 uppercase font-mono">
                        {conv.channel}
                      </span>
                      {isPending ? (
                        <span className="flex items-center gap-1 text-[9px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 font-medium animate-pulse-slow border border-amber-800/20 glow-voice">
                          <span className="h-1.5 w-1.5 rounded-full bg-amber-400"></span>
                          AGENT NEEDED
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-[9px] px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-400 font-medium border border-indigo-900/20">
                          <span className="h-1.5 w-1.5 rounded-full bg-indigo-400"></span>
                          AI MANAGED
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </aside>

        {/* CENTER COLUMN: LIVE CHAT WINDOW */}
        <section className="flex-1 flex flex-col bg-zinc-950/20">
          {activeConversation ? (
            <>
              {/* CHAT HEADER */}
              <div className="px-6 py-4 border-b border-zinc-800 bg-zinc-950/40 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-zinc-900 rounded-full border border-zinc-800">
                    {getChannelIcon(activeConversation.channel)}
                  </div>
                  <div>
                    <h2 className="text-sm font-semibold text-zinc-200">
                      {activeConversation.customer.name || 'Anonymous User'}
                    </h2>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[10px] font-mono text-zinc-500 uppercase">
                        {activeConversation.channel} Thread
                      </span>
                      <span className="text-zinc-600">•</span>
                      <span className="text-[10px] text-zinc-500">
                        Phone: {activeConversation.customer.phone || 'N/A'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Handoff Trigger Toggles */}
                <div className="flex items-center gap-2">
                  {activeConversation.status === 'AI_MANAGED' ? (
                    <button
                      onClick={() => toggleAutomationStatus('HUMAN_PENDING')}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/20 rounded-md transition-all active:scale-95"
                    >
                      <ArrowRightLeft className="h-3.5 w-3.5" />
                      Pause AI Responder
                    </button>
                  ) : (
                    <button
                      onClick={() => toggleAutomationStatus('AI_MANAGED')}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 border border-indigo-500/20 rounded-md transition-all active:scale-95"
                    >
                      <Bot className="h-3.5 w-3.5" />
                      Resume AI Responder
                    </button>
                  )}
                </div>
              </div>

              {/* MESSAGES VIEW CONTAINER */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {activeConversation.messages.map((msg, index) => {
                  const isAgent = msg.senderType === 'AGENT';
                  const isAI = msg.senderType === 'AI';
                  const isCustomer = msg.senderType === 'CUSTOMER';

                  return (
                    <div
                      key={msg.id || index}
                      className={`flex ${isCustomer ? 'justify-start' : 'justify-end'} animate-fade-in`}
                    >
                      <div
                        className={`max-w-[70%] rounded-lg p-3 text-xs leading-relaxed border ${
                          isCustomer
                            ? 'bg-zinc-900 border-zinc-800 text-zinc-100'
                            : isAI
                              ? 'bg-indigo-950/40 border-indigo-500/30 text-indigo-200 glow-primary'
                              : 'bg-zinc-800 border-zinc-700 text-zinc-100'
                        }`}
                      >
                        {/* Sender header */}
                        <div className="flex items-center gap-1.5 mb-1.5 text-[9px] font-semibold text-zinc-400">
                          {isCustomer && <User className="h-3 w-3 text-zinc-400" />}
                          {isAI && <Bot className="h-3 w-3 text-indigo-400" />}
                          {isAgent && <User className="h-3 w-3 text-indigo-400" />}
                          <span>
                            {isCustomer ? 'Customer' : isAI ? 'AI Assistant' : 'Live Agent (You)'}
                          </span>
                          <span className="text-zinc-600 font-normal">
                            {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>

                        {/* Content text */}
                        <p>{msg.body}</p>

                        {/* Indicators if tool executed */}
                        {msg.metadata?.toolCallsTriggered && (
                          <div className="mt-2 pt-1.5 border-t border-indigo-500/20 flex items-center gap-1 text-[9px] text-indigo-300 font-medium font-mono">
                            <Sparkles className="h-2.5 w-2.5" />
                            Triggered Automation Integration
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
                <div ref={chatEndRef} />
              </div>

              {/* REPLY FORM */}
              <form onSubmit={handleSendMessage} className="p-4 border-t border-zinc-800 bg-zinc-950/40">
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder={
                      activeConversation.status === 'AI_MANAGED'
                        ? 'Type a message... (Note: This will override AI responder)'
                        : 'Reply to customer...'
                    }
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    className="flex-1 px-4 py-2.5 text-xs bg-zinc-900 border border-zinc-800 rounded-md focus:outline-none focus:border-indigo-500"
                  />
                  <button
                    type="submit"
                    className="p-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-md transition-all hover:glow-primary active:scale-95"
                  >
                    <Send className="h-4 w-4" />
                  </button>
                </div>
                <div className="mt-2 text-[10px] text-zinc-500 flex justify-between px-1">
                  <span>Press enter or click send to respond</span>
                  {activeConversation.status === 'AI_MANAGED' && (
                    <span className="text-amber-500 font-medium">⚠️ Sending will pause the AI automations.</span>
                  )}
                </div>
              </form>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-zinc-500 text-xs p-6 gap-2">
              <MessageSquare className="h-10 w-10 text-zinc-700" />
              <span>Select a conversation from the list to view history</span>
            </div>
          )}
        </section>

        {/* RIGHT COLUMN: CRM CARD & OVERRIDES */}
        <aside className="w-80 border-l border-zinc-800 flex flex-col bg-zinc-950/40 p-6 overflow-y-auto">
          {activeConversation ? (
            <div className="space-y-6">
              {/* CUSTOMER CARD */}
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-500 mb-4">
                  Customer Record
                </h3>
                <div className="p-4 rounded-lg bg-zinc-900 border border-zinc-800 space-y-4">
                  <div>
                    <span className="text-[10px] text-zinc-500 block mb-1">Full Name</span>
                    <span className="text-xs font-medium text-zinc-200">
                      {activeConversation.customer.name || 'Anonymous'}
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] text-zinc-500 block mb-1">Email Address</span>
                    <span className="text-xs font-medium text-zinc-200">
                      {activeConversation.customer.email || 'None Captured'}
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] text-zinc-500 block mb-1">Contact Phone</span>
                    <span className="text-xs font-medium text-zinc-200">
                      {activeConversation.customer.phone || 'N/A'}
                    </span>
                  </div>

                  {activeConversation.customer.instagramId && (
                    <div>
                      <span className="text-[10px] text-zinc-500 block mb-1">Instagram ID</span>
                      <span className="text-xs font-medium font-mono text-zinc-200">
                        {activeConversation.customer.instagramId}
                      </span>
                    </div>
                  )}

                  {activeConversation.customer.facebookId && (
                    <div>
                      <span className="text-[10px] text-zinc-500 block mb-1">Facebook ID</span>
                      <span className="text-xs font-medium font-mono text-zinc-200">
                        {activeConversation.customer.facebookId}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* AUTOMATED PARAMETERS CAPTURED (METADATA) */}
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-500 mb-4">
                  Captured Leads Data
                </h3>
                <div className="p-4 rounded-lg bg-zinc-900 border border-zinc-800 space-y-3">
                  {/* Appointment dates */}
                  <div className="flex items-start gap-2.5 text-xs text-zinc-300">
                    <Calendar className="h-4 w-4 text-indigo-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="text-[10px] text-zinc-500 block">Appointment</span>
                      {activeConversation.customer.metadata?.appointmentDate ? (
                        <span className="font-semibold text-indigo-400">
                          {new Date(activeConversation.customer.metadata.appointmentDate).toLocaleString()}
                        </span>
                      ) : (
                        <span className="text-zinc-500">Not booked</span>
                      )}
                    </div>
                  </div>

                  {/* CRM export statuses */}
                  <div className="flex items-start gap-2.5 text-xs text-zinc-300">
                    <Database className="h-4 w-4 text-indigo-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="text-[10px] text-zinc-500 block">CRM Sink Status</span>
                      {activeConversation.customer.metadata?.exportedToSheet ? (
                        <span className="flex items-center gap-1 font-semibold text-emerald-400">
                          <CheckCircle className="h-3 w-3" />
                          Synced to CRM
                        </span>
                      ) : (
                        <span className="text-zinc-500">Unsaved Lead</span>
                      )}
                    </div>
                  </div>

                  {/* Other AI captured details */}
                  {activeConversation.customer.metadata?.leadDetails && (
                    <div className="mt-3 pt-3 border-t border-zinc-800 space-y-2">
                      <span className="text-[10px] text-zinc-500 block font-semibold">Details Captured by LLM:</span>
                      {Object.entries(activeConversation.customer.metadata.leadDetails).map(([key, val]) => (
                        <div key={key} className="text-xs">
                          <span className="text-zinc-500 capitalize">{key}: </span>
                          <span className="text-zinc-300 font-medium">{String(val)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* OVERRIDES & DIAGNOSTICS */}
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-500 mb-4">
                  Manual Actions
                </h3>
                <div className="space-y-2">
                  <button
                    onClick={async () => {
                      // Trigger artificial manual update test to simulate tool
                      alert('Manual action trigger simulated. Customer exported to CRM sheet.');
                      const mockPayload = {
                        leadData: {
                          name: activeConversation.customer.name || 'Anonymous',
                          email: activeConversation.customer.email || 'lead@crm-sync.com',
                          phone: activeConversation.customer.phone || '0000000',
                          notes: 'Manually synced via CRM console override'
                        },
                        conversationId: activeConversation.id
                      };
                      await fetch(`${BACKEND_URL}/api/v1/conversations/${activeConversation.id}/reply`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          body: '[CONSOLE AUTOMATION]: Executing Manual Lead CRM Sync.',
                          status: activeConversation.status
                        })
                      });
                    }}
                    className="w-full py-2 text-xs text-center border border-zinc-800 bg-zinc-950 hover:bg-zinc-900 rounded-md font-semibold text-zinc-300 transition-colors active:scale-95"
                  >
                    Sync Lead Manually
                  </button>

                  <button
                    onClick={() => {
                      alert('Appointment date booking prompt mock. Setting date to current time.');
                    }}
                    className="w-full py-2 text-xs text-center border border-zinc-800 bg-zinc-950 hover:bg-zinc-900 rounded-md font-semibold text-zinc-300 transition-colors active:scale-95"
                  >
                    Reschedule Calendar
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center text-xs text-zinc-600 py-12 flex flex-col items-center gap-2">
              <Settings className="h-8 w-8 text-zinc-800" />
              <span>Select conversation to configure options</span>
            </div>
          )}
        </aside>

      </div>
    </div>
  );
}

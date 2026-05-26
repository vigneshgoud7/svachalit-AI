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
  PhoneCall,
  PhoneOff,
  Volume2,
  Mic,
  Activity,
  ShieldAlert,
  BarChart3,
  Users,
  Clock,
  TrendingUp,
  ExternalLink,
  ChevronRight
} from 'lucide-react';

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
  metadata?: any;
}

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState<'inbox' | 'analytics'>('inbox');
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConvId, setSelectedConvId] = useState<string | null>(null);
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);
  const [replyText, setReplyText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [channelFilter, setChannelFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  
  // Real-time call duration state
  const [callDurationSec, setCallDurationSec] = useState<number>(0);

  // Developer Seeding details
  const [tenantKey, setTenantKey] = useState<string | null>(null);
  const [seedingStatus, setSeedingStatus] = useState<string>('');

  const chatEndRef = useRef<HTMLDivElement>(null);
  const sseRef = useRef<EventSource | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

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

  // 3. Keep track of active call durations
  useEffect(() => {
    const activeCall = activeConversation?.metadata?.activeCall || activeConversation?.customer?.metadata?.activeCall;
    const startStr = activeConversation?.metadata?.callStart || activeConversation?.customer?.metadata?.callStart;
    
    if (activeCall && startStr) {
      const startMs = new Date(startStr).getTime();
      
      if (timerRef.current) clearInterval(timerRef.current);
      
      timerRef.current = setInterval(() => {
        const elapsed = Math.floor((Date.now() - startMs) / 1000);
        setCallDurationSec(elapsed > 0 ? elapsed : 0);
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      setCallDurationSec(0);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [activeConversation]);

  // 4. Connect Server-Sent Events (SSE) for Real-Time Synchronization
  useEffect(() => {
    console.log('[SSE] Opening connection...');
    const eventSource = new EventSource(`${BACKEND_URL}/api/v1/stream`);
    sseRef.current = eventSource;

    eventSource.addEventListener('message', (event: any) => {
      const data = JSON.parse(event.data);
      console.log('[SSE] Message received:', data);
      
      setActiveConversation(prev => {
        if (prev && prev.id === data.conversationId) {
          if (prev.messages.some(m => m.id === data.message.id)) return prev;
          return {
            ...prev,
            messages: [...prev.messages, data.message]
          };
        }
        return prev;
      });

      setConversations(prevList => {
        return prevList.map(c => {
          if (c.id === data.conversationId) {
            return {
              ...c,
              messages: [data.message],
              updatedAt: new Date().toISOString()
            };
          }
          return c;
        });
      });
    });

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

    eventSource.addEventListener('crm', (event: any) => {
      const data = JSON.parse(event.data);
      console.log('[SSE] CRM parameters updated:', data);

      setConversations(prev => prev.map(c => {
        if (c.id === data.conversationId) {
          return { 
            ...c, 
            customer: data.customer || c.customer,
            status: data.conversation?.status || c.status,
            metadata: {
              ...(c.metadata || {}),
              ...(data.conversation?.metadata || {})
            }
          };
        }
        return c;
      }));

      setActiveConversation(prev => {
        if (prev && prev.id === data.conversationId) {
          return { 
            ...prev, 
            customer: data.customer || prev.customer,
            status: data.conversation?.status || prev.status,
            metadata: {
              ...(prev.metadata || {}),
              ...(data.conversation?.metadata || {})
            }
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

  // 5. Scroll to bottom of message panel
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeConversation?.messages]);

  // 6. Send Manual Message Handler
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() || !selectedConvId) return;

    const payload = {
      body: replyText,
      status: 'HUMAN_PENDING'
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

  // 7. Change conversation status manually
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

  // 8. Developer seed utility trigger
  const runDatabaseSeed = async () => {
    setSeedingStatus('Seeding database...');
    try {
      const res = await fetch(`${BACKEND_URL}/api/v1/dev/seed`, {
        method: 'POST'
      });
      if (res.ok) {
        const data = await res.json();
        setTenantKey(data.tenantApiKey);
        setSeedingStatus('Success! Seeded test credentials.');
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
        return <Phone className="h-4 w-4 text-emerald-400" />;
      case 'INSTAGRAM':
        return <Instagram className="h-4 w-4 text-pink-500" />;
      case 'FACEBOOK':
        return <Facebook className="h-4 w-4 text-blue-500" />;
      case 'VOICE':
        return <PhoneCall className="h-4 w-4 text-orange-500 animate-bounce" />;
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

  const formatCallTime = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  // ==========================================
  // METRICS COMPUTATIONS (For Analytics Tab)
  // ==========================================
  const totalConversations = conversations.length;
  
  const aiManagedCount = conversations.filter(c => c.status === 'AI_MANAGED').length;
  const humanPendingCount = conversations.filter(c => c.status === 'HUMAN_PENDING').length;
  const aiResolutionRate = totalConversations > 0 
    ? Math.round((aiManagedCount / totalConversations) * 100) 
    : 100;

  const totalLeadsCaptured = conversations.filter(
    c => c.customer.metadata?.exportedToSheet || c.metadata?.exportedToSheet
  ).length;

  const totalAppointments = conversations.filter(
    c => c.customer.metadata?.appointmentDate || c.metadata?.appointmentDate
  ).length;

  const activeCallsCount = conversations.filter(
    c => c.metadata?.activeCall || c.customer?.metadata?.activeCall
  ).length;

  // Channel Distribution
  const channelsBreakdown = conversations.reduce((acc, c) => {
    acc[c.channel] = (acc[c.channel] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Extracted Appointments list
  const upcomingAppointments = conversations
    .filter(c => c.customer.metadata?.appointmentDate || c.metadata?.appointmentDate)
    .map(c => ({
      id: c.id,
      name: c.customer.name || 'Anonymous',
      channel: c.channel,
      phone: c.customer.phone || 'N/A',
      date: c.customer.metadata?.appointmentDate || c.metadata?.appointmentDate
    }))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  // Extracted Captured Leads list
  const capturedLeadsList = conversations
    .filter(c => c.customer.metadata?.leadDetails || c.metadata?.leadDetails)
    .map(c => ({
      id: c.id,
      name: c.customer.name || 'Anonymous Lead',
      email: c.customer.email || 'N/A',
      phone: c.customer.phone || 'N/A',
      channel: c.channel,
      details: {
        ...(c.customer.metadata?.leadDetails || {}),
        ...(c.metadata?.leadDetails || {})
      }
    }));

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
            <p className="text-xs text-zinc-500">Business Assistant & Workflow Console</p>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center bg-zinc-900 border border-zinc-800 p-1 rounded-lg">
          <button
            onClick={() => setActiveTab('inbox')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
              activeTab === 'inbox' 
                ? 'bg-zinc-800 text-white' 
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <MessageSquare className="h-3.5 w-3.5" />
            Live Inbox
          </button>
          <button
            onClick={() => setActiveTab('analytics')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
              activeTab === 'analytics' 
                ? 'bg-zinc-800 text-white' 
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <BarChart3 className="h-3.5 w-3.5" />
            Metrics Dashboard
          </button>
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

      {/* TAB 1: LIVE INBOX */}
      {activeTab === 'inbox' && (
        <div className="flex flex-1 overflow-hidden">
          
          {/* LEFT COLUMN: CONVERSATION LIST */}
          <aside className="w-80 border-r border-zinc-800 flex flex-col bg-zinc-950/40">
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
              {[
                { id: 'ALL', label: 'All' },
                { id: 'WHATSAPP', label: 'WhatsApp' },
                { id: 'INSTAGRAM', label: 'Instagram' },
                { id: 'FACEBOOK', label: 'Facebook' },
                { id: 'VOICE', label: 'Voice Calls' }
              ].map(ch => (
                <button
                  key={ch.id}
                  onClick={() => setChannelFilter(ch.id)}
                  className={`px-2.5 py-1 text-[10px] font-semibold rounded-md transition-all ${
                    channelFilter === ch.id 
                      ? 'bg-zinc-800 text-white border border-zinc-700' 
                      : 'text-zinc-500 hover:text-zinc-300'
                  }`}
                >
                  {ch.label}
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
                  No conversations found
                </div>
              ) : (
                filteredConversations.map(conv => {
                  const isActive = selectedConvId === conv.id;
                  const lastMsg = conv.messages[0];
                  const isPending = conv.status === 'HUMAN_PENDING';
                  const hasActiveCall = conv.metadata?.activeCall || conv.customer?.metadata?.activeCall;

                  return (
                    <div
                      key={conv.id}
                      onClick={() => setSelectedConvId(conv.id)}
                      className={`p-4 cursor-pointer relative transition-all border-l-2 ${
                        isActive 
                          ? 'bg-zinc-900/60 border-indigo-500' 
                          : hasActiveCall
                            ? 'bg-orange-950/20 hover:bg-zinc-900/30 border-orange-500 glow-voice'
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
                        {hasActiveCall ? '📞 Active call session in-progress...' : (lastMsg ? lastMsg.body : 'No messages')}
                      </p>

                      {/* Foot badges */}
                      <div className="flex items-center justify-between">
                        <span className="text-[8px] tracking-wider text-zinc-600 uppercase font-mono">
                          {conv.channel}
                        </span>
                        {hasActiveCall ? (
                          <span className="flex items-center gap-1 text-[9px] px-1.5 py-0.5 rounded bg-orange-500/20 text-orange-400 font-medium animate-pulse border border-orange-800/40">
                            <Activity className="h-2.5 w-2.5" />
                            LIVE CALL
                          </span>
                        ) : isPending ? (
                          <span className="flex items-center gap-1 text-[9px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 font-medium animate-pulse-slow border border-amber-800/20">
                            <span className="h-1.5 w-1.5 rounded-full bg-amber-400"></span>
                            AGENT
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-[9px] px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-400 font-medium border border-indigo-900/20">
                            <span className="h-1.5 w-1.5 rounded-full bg-indigo-400"></span>
                            AI
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
                        {activeConversation.customer.name || 'Voice Caller'}
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

                  {/* Telemetry updates for voice call */}
                  {(activeConversation.metadata?.activeCall || activeConversation.customer?.metadata?.activeCall) && (
                    <div className="flex items-center gap-3 bg-orange-950/20 border border-orange-500/30 rounded-lg px-3 py-1.5 animate-pulse-slow">
                      <Volume2 className="h-4 w-4 text-orange-400 animate-bounce" />
                      <div className="text-[10px] font-mono text-orange-400 font-semibold">
                        CALLING | {formatCallTime(callDurationSec)}
                      </div>
                      <div className="text-[10px] uppercase font-bold text-orange-400 flex items-center gap-1.5">
                        <Mic className="h-3 w-3" />
                        {activeConversation.metadata?.speakingState?.replace('_', ' ') || 'IDLE'}
                      </div>
                    </div>
                  )}

                  {/* Handoff Trigger Toggles */}
                  <div className="flex items-center gap-2">
                    {activeConversation.status === 'AI_MANAGED' ? (
                      <button
                        onClick={() => toggleAutomationStatus('HUMAN_PENDING')}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/20 rounded-md transition-all active:scale-95"
                      >
                        <ArrowRightLeft className="h-3.5 w-3.5" />
                        Takeover Thread
                      </button>
                    ) : (
                      <button
                        onClick={() => toggleAutomationStatus('AI_MANAGED')}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 border border-indigo-500/20 rounded-md transition-all active:scale-95"
                      >
                        <Bot className="h-3.5 w-3.5" />
                        Resume AI
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
                              Triggered CRM Automation
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                  <div ref={chatEndRef} />
                </div>

                {/* LIVE TRANSCRIPTION STREAM PANEL (Voice Calls) */}
                {(activeConversation.metadata?.activeCall || activeConversation.customer?.metadata?.activeCall) && 
                 activeConversation.metadata?.liveTranscript && (
                  <div className="mx-6 mb-2 p-3 bg-zinc-900 border border-orange-500/20 rounded-lg text-xs flex gap-2 items-start glow-voice animate-pulse-slow">
                    <Activity className="h-4 w-4 text-orange-400 shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <span className="text-[10px] text-orange-400 font-bold block uppercase tracking-wider">Live Speech Transcript Stream:</span>
                      <p className="text-zinc-300 font-medium italic">"{activeConversation.metadata.liveTranscript}"</p>
                    </div>
                  </div>
                )}

                {/* REPLY FORM */}
                <form onSubmit={handleSendMessage} className="p-4 border-t border-zinc-800 bg-zinc-950/40">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder={
                        activeConversation.status === 'AI_MANAGED'
                          ? 'Respond to takeover control and reply... (AI responder pauses)'
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
                      <span className="text-amber-500 font-medium flex items-center gap-1">
                        <ShieldAlert className="h-3.5 w-3.5" />
                        Warning: Responding halts the AI automation queue.
                      </span>
                    )}
                  </div>
                </form>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-zinc-500 text-xs p-6 gap-2">
                <MessageSquare className="h-10 w-10 text-zinc-700" />
                <span>Select a conversation from the sidebar list</span>
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
                        {activeConversation.customer.metadata?.appointmentDate || activeConversation.metadata?.appointmentDate ? (
                          <span className="font-semibold text-indigo-400">
                            {new Date(activeConversation.customer.metadata?.appointmentDate || activeConversation.metadata?.appointmentDate).toLocaleString()}
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
                    {(activeConversation.customer.metadata?.leadDetails || activeConversation.metadata?.leadDetails) && (
                      <div className="mt-3 pt-3 border-t border-zinc-800 space-y-2">
                        <span className="text-[10px] text-zinc-500 block font-semibold">Details Captured by Gemini:</span>
                        {Object.entries({
                          ...(activeConversation.customer.metadata?.leadDetails || {}),
                          ...(activeConversation.metadata?.leadDetails || {})
                        }).map(([key, val]) => (
                          <div key={key} className="text-xs">
                            <span className="text-zinc-500 capitalize">{key}: </span>
                            <span className="text-zinc-300 font-medium">{String(val)}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Call session summary */}
                    {activeConversation.metadata?.callSummary && (
                      <div className="mt-3 pt-3 border-t border-zinc-800 space-y-1">
                        <span className="text-[10px] text-orange-400 font-bold block uppercase">Call End Summary:</span>
                        <p className="text-zinc-400 text-xs italic">"{activeConversation.metadata.callSummary}"</p>
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
                        alert('Manual action trigger. Synced caller details to spreadsheet sink.');
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
                        alert('Reschedule calendar prompt synced.');
                      }}
                      className="w-full py-2 text-xs text-center border border-zinc-800 bg-zinc-950 hover:bg-zinc-900 rounded-md font-semibold text-zinc-300 transition-colors active:scale-95"
                    >
                      Reschedule Calendar
                    </button>

                    {(activeConversation.metadata?.activeCall || activeConversation.customer?.metadata?.activeCall) && (
                      <button
                        onClick={async () => {
                          alert('Hanging call session override.');
                          await fetch(`${BACKEND_URL}/api/v1/webhooks/voice?apiKey=${tenantKey || 'mock'}`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                              message: {
                                type: 'status-update',
                                status: 'ended',
                                duration: callDurationSec,
                                call: { id: activeConversation.metadata?.callSid }
                              }
                            })
                          });
                        }}
                        className="w-full py-2 text-xs text-center border border-red-500/20 bg-red-950/30 hover:bg-red-950/60 rounded-md font-semibold text-red-400 transition-colors active:scale-95 flex items-center justify-center gap-1.5"
                      >
                        <PhoneOff className="h-3.5 w-3.5" />
                        Force Hang Up Call
                      </button>
                    )}
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
      )}

      {/* TAB 2: ANALYTICS & METRICS DASHBOARD */}
      {activeTab === 'analytics' && (
        <div className="flex-1 overflow-y-auto p-8 space-y-8 bg-zinc-950/20">
          
          {/* TOP KPI ROW */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            
            {/* Card 1: Total Conversations */}
            <div className="p-6 rounded-xl bg-zinc-900/60 border border-zinc-800 shadow-lg relative overflow-hidden group">
              <div className="absolute right-4 top-4 text-zinc-800 group-hover:text-indigo-950 transition-colors">
                <MessageSquare className="h-10 w-10" />
              </div>
              <span className="text-xs font-bold text-zinc-500 uppercase block tracking-wider">Total Active Chats</span>
              <span className="text-3xl font-extrabold text-white mt-2 block tracking-tight">{totalConversations}</span>
              <p className="text-[10px] text-zinc-500 mt-2 flex gap-2">
                <span>WA: {channelsBreakdown['WHATSAPP'] || 0}</span>
                <span>•</span>
                <span>IG: {channelsBreakdown['INSTAGRAM'] || 0}</span>
                <span>•</span>
                <span>Voice: {channelsBreakdown['VOICE'] || 0}</span>
              </p>
            </div>

            {/* Card 2: AI Resolution Rate */}
            <div className="p-6 rounded-xl bg-zinc-900/60 border border-zinc-800 shadow-lg relative overflow-hidden group">
              <div className="absolute right-4 top-4 text-zinc-800 group-hover:text-indigo-950 transition-colors">
                <Bot className="h-10 w-10" />
              </div>
              <span className="text-xs font-bold text-zinc-500 uppercase block tracking-wider">AI Automation Rate</span>
              <span className="text-3xl font-extrabold text-indigo-400 mt-2 block tracking-tight">{aiResolutionRate}%</span>
              <p className="text-[10px] text-zinc-500 mt-2 flex gap-1.5 items-center">
                <Bot className="h-3 w-3 text-indigo-400" />
                <span>{aiManagedCount} actively managed by Gemini AI</span>
              </p>
            </div>

            {/* Card 3: Active Call Stats */}
            <div className="p-6 rounded-xl bg-zinc-900/60 border border-zinc-800 shadow-lg relative overflow-hidden group">
              <div className="absolute right-4 top-4 text-zinc-800 group-hover:text-indigo-950 transition-colors">
                <Activity className="h-10 w-10" />
              </div>
              <span className="text-xs font-bold text-zinc-500 uppercase block tracking-wider">Live Active Calls</span>
              <span className={`text-3xl font-extrabold mt-2 block tracking-tight ${activeCallsCount > 0 ? 'text-orange-400' : 'text-white'}`}>
                {activeCallsCount}
              </span>
              <p className="text-[10px] text-zinc-500 mt-2 flex gap-1.5 items-center">
                {activeCallsCount > 0 ? (
                  <>
                    <span className="h-2 w-2 bg-orange-500 rounded-full animate-ping"></span>
                    <span className="text-orange-400 font-medium">Real-time voice stream active</span>
                  </>
                ) : (
                  <span>No callers currently online</span>
                )}
              </p>
            </div>

            {/* Card 4: CRM Synchronizations */}
            <div className="p-6 rounded-xl bg-zinc-900/60 border border-zinc-800 shadow-lg relative overflow-hidden group">
              <div className="absolute right-4 top-4 text-zinc-800 group-hover:text-indigo-950 transition-colors">
                <Database className="h-10 w-10" />
              </div>
              <span className="text-xs font-bold text-zinc-500 uppercase block tracking-wider">Synced CRM Leads</span>
              <span className="text-3xl font-extrabold text-emerald-400 mt-2 block tracking-tight">{totalLeadsCaptured}</span>
              <p className="text-[10px] text-zinc-500 mt-2 flex gap-1.5 items-center">
                <CheckCircle className="h-3 w-3 text-emerald-400" />
                <span>Auto-exported to CRM sheet sink</span>
              </p>
            </div>

          </div>

          {/* BOTTOM SPLIT AREA: APPOINTMENTS & LEADS TABLE */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            
            {/* Left Panel: Upcoming Appointments list */}
            <div className="p-6 rounded-xl bg-zinc-900/40 border border-zinc-800 shadow-md">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-indigo-400" />
                  <h3 className="font-bold text-sm text-zinc-200">Scheduled Appointments</h3>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded bg-zinc-800 text-zinc-400 font-mono">
                  {totalAppointments} Total
                </span>
              </div>

              {upcomingAppointments.length === 0 ? (
                <div className="py-12 text-center text-xs text-zinc-600 flex flex-col items-center gap-2">
                  <Calendar className="h-8 w-8 text-zinc-800" />
                  <span>No upcoming calendar bookings scheduled.</span>
                </div>
              ) : (
                <div className="space-y-3 overflow-y-auto max-h-[350px]">
                  {upcomingAppointments.map((appt, idx) => (
                    <div 
                      key={appt.id + idx}
                      className="p-3 bg-zinc-900/60 border border-zinc-800/80 rounded-lg flex items-center justify-between hover:border-zinc-700 transition-all group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-md">
                          {getChannelIcon(appt.channel)}
                        </div>
                        <div>
                          <h4 className="text-xs font-semibold text-zinc-200 group-hover:text-indigo-400 transition-colors">
                            {appt.name}
                          </h4>
                          <span className="text-[10px] text-zinc-500 block mt-0.5">Origin: {appt.channel} | Phone: {appt.phone}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] font-semibold text-indigo-400 bg-indigo-950/30 border border-indigo-900/40 px-2 py-1 rounded">
                          {new Date(appt.date).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Right Panel: Captured CRM Leads details */}
            <div className="p-6 rounded-xl bg-zinc-900/40 border border-zinc-800 shadow-md">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <Database className="h-4 w-4 text-emerald-400" />
                  <h3 className="font-bold text-sm text-zinc-200">Captured Leads Directory</h3>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded bg-zinc-800 text-zinc-400 font-mono">
                  {totalLeadsCaptured} Syncs
                </span>
              </div>

              {capturedLeadsList.length === 0 ? (
                <div className="py-12 text-center text-xs text-zinc-600 flex flex-col items-center gap-2">
                  <Database className="h-8 w-8 text-zinc-800" />
                  <span>No leads synced yet. AI will capture leads dynamically.</span>
                </div>
              ) : (
                <div className="space-y-3 overflow-y-auto max-h-[350px]">
                  {capturedLeadsList.map((lead, idx) => (
                    <div 
                      key={lead.id + idx}
                      className="p-3.5 bg-zinc-900/60 border border-zinc-800/80 rounded-lg flex flex-col gap-2 hover:border-zinc-700 transition-all"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="text-xs font-semibold text-zinc-200">{lead.name}</h4>
                          <div className="flex gap-2 items-center mt-1 text-[10px] text-zinc-500">
                            <span>Email: {lead.email}</span>
                            <span>•</span>
                            <span>Phone: {lead.phone}</span>
                          </div>
                        </div>
                        <span className="text-[8px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-900/20 uppercase tracking-wider">
                          CRM Sync
                        </span>
                      </div>
                      
                      {lead.details && Object.keys(lead.details).length > 0 && (
                        <div className="p-2 bg-zinc-950/60 rounded border border-zinc-900 text-[10px] grid grid-cols-2 gap-x-4 gap-y-1">
                          {Object.entries(lead.details).map(([k, v]) => (
                            <div key={k} className="truncate">
                              <span className="text-zinc-500 capitalize">{k}: </span>
                              <span className="text-zinc-300 font-mono">{String(v)}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>

          {/* BOTTOM CHANNEL ANALYTICS ROW */}
          <div className="p-6 rounded-xl bg-zinc-900/40 border border-zinc-800 shadow-md">
            <h3 className="font-bold text-sm text-zinc-200 mb-6 flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-indigo-400" />
              Channel Messaging Volume & Active Routing Status
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              {[
                { name: 'WhatsApp', key: 'WHATSAPP', color: 'bg-emerald-500' },
                { name: 'Instagram', key: 'INSTAGRAM', color: 'bg-pink-500' },
                { name: 'Facebook', key: 'FACEBOOK', color: 'bg-blue-500' },
                { name: 'Voice Calls', key: 'VOICE', color: 'bg-orange-500' },
                { name: 'Web Assistant', key: 'WEB', color: 'bg-indigo-500' }
              ].map(chan => {
                const count = channelsBreakdown[chan.key] || 0;
                const percentage = totalConversations > 0 ? Math.round((count / totalConversations) * 100) : 0;
                
                return (
                  <div key={chan.key} className="p-4 rounded-lg bg-zinc-900/60 border border-zinc-800/80">
                    <div className="flex justify-between items-center text-xs mb-2">
                      <span className="font-medium text-zinc-400">{chan.name}</span>
                      <span className="font-bold text-zinc-200">{count} chats</span>
                    </div>
                    <div className="w-full bg-zinc-800 h-2 rounded-full overflow-hidden">
                      <div className={`h-full ${chan.color}`} style={{ width: `${percentage}%` }}></div>
                    </div>
                    <span className="text-[9px] text-zinc-500 mt-1 block font-mono">{percentage}% of volume</span>
                  </div>
                );
              })}
            </div>
          </div>

        </div>
      )}
      
    </div>
  );
}

'use client';

<<<<<<< HEAD
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Bot, Loader2 } from 'lucide-react';
import { API_URL, apiFetch } from '@/lib/api';
import { Analytics, Conversation, KnowledgeBaseEntry, ToolEvent } from '@/lib/types';
import { ConversationList, ManualReply } from '@/components/ConversationList';
import { DemoControls } from '@/components/DemoControls';
import { KnowledgeBasePanel } from '@/components/KnowledgeBasePanel';
import { StatGrid } from '@/components/StatGrid';
import { ToolEvents } from '@/components/ToolEvents';

export default function DashboardPage() {
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selected, setSelected] = useState<Conversation | null>(null);
  const [kbEntries, setKbEntries] = useState<KnowledgeBaseEntry[]>([]);
  const [toolEvents, setToolEvents] = useState<ToolEvent[]>([]);
  const [reply, setReply] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const selectedMessages = useMemo(() => selected?.messages ?? [], [selected]);

  const load = useCallback(async () => {
    try {
      const [analyticsData, conversationData, kbData, toolData] = await Promise.all([
        apiFetch<Analytics>('/api/v1/analytics'),
        apiFetch<Conversation[]>('/api/v1/conversations'),
        apiFetch<KnowledgeBaseEntry[]>('/api/v1/knowledge-base'),
        apiFetch<ToolEvent[]>('/api/v1/tool-events')
      ]);

      setAnalytics(analyticsData);
      setConversations(conversationData);
      setKbEntries(kbData);
      setToolEvents(toolData);
      setError('');

      setSelected((current) => {
        if (current) {
          const refreshed = conversationData.find((item) => item.id === current.id);
          return refreshed || conversationData[0] || null;
        }

        return conversationData[0] || null;
      });
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Failed to load dashboard data');
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    const events = new EventSource(`${API_URL}/api/v1/stream`);

    events.addEventListener('message', () => void load());
    events.addEventListener('transfer', () => void load());
    events.addEventListener('crm', () => void load());
    events.onerror = () => events.close();

    return () => events.close();
  }, [load]);

  async function sendReply() {
    if (!selected || !reply.trim()) {
      return;
    }

    setBusy(true);
    try {
      await apiFetch(`/api/v1/conversations/${selected.id}/reply`, {
        method: 'POST',
        body: JSON.stringify({ body: reply, status: 'HUMAN_PENDING' })
      });
      setReply('');
      await load();
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="min-h-screen">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-5 sm:px-6">
          <div className="flex items-center gap-3">
            <span className="grid h-11 w-11 place-items-center rounded-md bg-slate-950 text-white">
              <Bot size={22} aria-hidden />
            </span>
            <div>
              <h1 className="text-xl font-semibold text-slate-950">AutoBot Command Center</h1>
              <p className="text-sm text-slate-500">AI automation, human handoff, and customer context in one place.</p>
            </div>
          </div>
          <div className="rounded-md border border-slate-200 px-3 py-2 text-xs text-slate-600">
            API: {API_URL}
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-7xl gap-4 px-4 py-5 sm:px-6">
        {error ? (
          <div className="rounded-md border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">{error}</div>
        ) : null}

        <DemoControls busy={busy} setBusy={setBusy} onDone={load} />
        <StatGrid analytics={analytics} />

        <div className="grid gap-4 xl:grid-cols-[420px_1fr]">
          <ConversationList
            conversations={conversations}
            analytics={analytics}
            selectedId={selected?.id}
            onRefresh={load}
            onSelect={setSelected}
          />

          <section className="rounded-md border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 px-4 py-3">
              <h2 className="text-sm font-semibold text-slate-950">
                {selected?.customer.name || 'Conversation Detail'}
              </h2>
              <p className="text-xs text-slate-500">{selected?.status || 'No conversation selected'}</p>
            </div>

            <div className="h-[420px] overflow-auto p-4">
              {selectedMessages.length === 0 ? (
                <div className="grid h-full place-items-center text-sm text-slate-500">Select a conversation.</div>
              ) : (
                <div className="grid gap-3">
                  {selectedMessages.map((message) => (
                    <div
                      key={message.id}
                      className={`max-w-[78%] rounded-md px-3 py-2 text-sm ${
                        message.senderType === 'CUSTOMER'
                          ? 'justify-self-start bg-slate-100 text-slate-900'
                          : message.senderType === 'AGENT'
                            ? 'justify-self-end bg-blue-700 text-white'
                            : 'justify-self-end bg-emerald-700 text-white'
                      }`}
                    >
                      <p className="text-[11px] font-semibold opacity-80">{message.senderType}</p>
                      <p>{message.body}</p>
                    </div>
                  ))}
=======
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
  BookOpen,
  ArrowRight,
  ShieldCheck,
  TrendingUp,
  Cpu,
  BarChart2,
  GitBranch,
  X,
  Play,
  Mail,
  Zap,
  HelpCircle,
  Menu,
  ChevronRight,
  Sliders,
  DollarSign,
  Briefcase
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

export default function AppContainer() {
  const [view, setView] = useState<'landing' | 'dashboard'>('landing');
  const [onboardingPlan, setOnboardingPlan] = useState<'byok' | 'managed' | null>(null);

  // Forwarding view control toggler
  return (
    <>
      {view === 'landing' ? (
        <LandingPage 
          onLaunchDashboard={() => setView('dashboard')} 
          onChoosePlan={(plan) => setOnboardingPlan(plan)}
        />
      ) : (
        <DashboardConsole 
          onExitToLanding={() => setView('landing')} 
        />
      )}

      {/* Onboarding Wizard Modal */}
      {onboardingPlan && (
        <OnboardingModal 
          plan={onboardingPlan} 
          onClose={() => setOnboardingPlan(null)} 
          onComplete={() => {
            setOnboardingPlan(null);
            setView('dashboard');
          }}
        />
      )}
    </>
  );
}

// ==========================================
// 1. FUTURISTIC MARKETING LANDING PAGE
// ==========================================
interface LandingPageProps {
  onLaunchDashboard: () => void;
  onChoosePlan: (plan: 'byok' | 'managed') => void;
}

function LandingPage({ onLaunchDashboard, onChoosePlan }: LandingPageProps) {
  const [demoTab, setDemoTab] = useState<'whatsapp' | 'instagram' | 'lead' | 'routing'>('whatsapp');
  const [demoMessages, setDemoMessages] = useState<any[]>([]);
  const [demoInput, setDemoInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Set initial messages when demo tab changes
  useEffect(() => {
    switch (demoTab) {
      case 'whatsapp':
        setDemoMessages([
          { sender: 'user', text: 'Hey, I want to book a haircut for tomorrow at 3 PM.' },
          { sender: 'ai', text: 'Hello! I can help you with that at GlowStyle Salon. Let me check availability...', isTool: true },
          { sender: 'ai', text: '✨ [System Action]: Checked slot tomorrow 3:00 PM. Available.' },
          { sender: 'ai', text: 'Great news! That slot is open. Please provide your full name to secure the booking.' }
        ]);
        break;
      case 'instagram':
        setDemoMessages([
          { sender: 'user', text: 'Is this dress available in blue?' },
          { sender: 'ai', text: 'Let me query our active inventory database...', isTool: true },
          { sender: 'ai', text: 'Yes, we have 4 units left in Indigo Blue! Price is $45.' }
        ]);
        break;
      case 'lead':
        setDemoMessages([
          { sender: 'user', text: 'I am interested in your growth plans for business expansion.' },
          { sender: 'ai', text: 'Perfect! I will capture your business details and sync them to our spreadsheet CRM...', isTool: true },
          { sender: 'ai', text: 'Could you share your business name and monthly customer volume?' }
        ]);
        break;
      case 'routing':
        setDemoMessages([
          { sender: 'user', text: 'I want a refund. The app keeps crashing!' },
          { sender: 'ai', text: 'I understand. Refunding requires supervisor validation. Transferring to human agent...', isTool: true },
          { sender: 'system', text: '🔴 Agent Handoff Triggered. Switched to Human control.' }
        ]);
        break;
    }
  }, [demoTab]);

  const handleDemoChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!demoInput.trim()) return;

    const userText = demoInput;
    setDemoMessages(prev => [...prev, { sender: 'user', text: userText }]);
    setDemoInput('');
    setIsTyping(true);

    setTimeout(() => {
      setIsTyping(false);
      // Generate intelligent RAG responses based on context
      if (demoTab === 'whatsapp') {
        setDemoMessages(prev => [
          ...prev,
          { sender: 'ai', text: 'Searching knowledge base for appointment policies...', isTool: true },
          { sender: 'ai', text: 'Got it. I have booked the slot for ' + userText + '. You will receive a WhatsApp confirmation shortly!' }
        ]);
      } else {
        setDemoMessages(prev => [
          ...prev,
          { sender: 'ai', text: 'Thanks! Our team has been notified. Let us know if you need anything else.' }
        ]);
      }
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-[#fbfaf7] text-zinc-800 overflow-x-hidden grid-bg relative selection:bg-indigo-100">
      <div className="absolute inset-0 grid-bg-glow pointer-events-none" />

      {/* Sticky Header */}
      <header className="sticky top-0 z-50 w-full border-b border-stone-200/60 bg-white/75 backdrop-blur-md px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-[#4a6b82] rounded-lg text-white shadow-sm">
            <Sparkles className="h-4 w-4" />
          </div>
          <div>
            <h1 className="text-sm font-bold tracking-tight text-zinc-900">Svachalit</h1>
            <p className="text-[9px] text-[#4a6b82] tracking-wider font-semibold font-mono uppercase">Unified Conversations</p>
          </div>
        </div>

        {/* Desktop Navigation links */}
        <nav className="hidden md:flex items-center gap-8 text-xs font-semibold text-zinc-650">
          <a href="#features" className="hover:text-zinc-950 transition-colors">Features</a>
          <a href="#demo" className="hover:text-zinc-950 transition-colors">Interactive Demo</a>
          <a href="#workflow" className="hover:text-zinc-950 transition-colors">Workflow</a>
          <a href="#pricing" className="hover:text-zinc-950 transition-colors">Pricing</a>
        </nav>

        <div className="flex items-center gap-3">
          <button
            onClick={onLaunchDashboard}
            className="px-4 py-2 bg-[#4a6b82] hover:bg-[#385265] text-xs font-bold text-white rounded-lg transition-all active:scale-95 flex items-center gap-1.5 shadow-sm"
          >
            Launch Console Demo <ArrowRight className="h-3.5 w-3.5" />
          </button>
          
          {/* Mobile menu button */}
          <button 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)} 
            className="md:hidden p-2 text-zinc-600 hover:text-zinc-950 border border-stone-200 rounded-lg"
          >
            <Menu className="h-4 w-4" />
          </button>
        </div>
      </header>

      {/* Mobile Nav Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-stone-250 bg-white p-6 flex flex-col gap-4 text-sm font-semibold text-zinc-700">
          <a href="#features" onClick={() => setMobileMenuOpen(false)} className="text-zinc-600 hover:text-zinc-905">Features</a>
          <a href="#demo" onClick={() => setMobileMenuOpen(false)} className="text-zinc-600 hover:text-zinc-905">Interactive Demo</a>
          <a href="#workflow" onClick={() => setMobileMenuOpen(false)} className="text-zinc-600 hover:text-zinc-905">Workflow</a>
          <a href="#pricing" onClick={() => setMobileMenuOpen(false)} className="text-zinc-600 hover:text-zinc-905">Pricing</a>
        </div>
      )}

      {/* HERO SECTION */}
      <section className="relative px-6 pt-20 pb-24 text-center max-w-4xl mx-auto flex flex-col items-center">
        <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-[#4a6b82]/10 border border-[#4a6b82]/20 text-[10px] font-bold text-[#4a6b82] mb-6 tracking-wide uppercase font-mono">
          <Zap className="h-3 w-3" /> Introducing Svachalit 1.0
        </div>
        
        <h2 className="text-4xl md:text-5.5xl font-extrabold tracking-tight text-zinc-900 mb-6 leading-tight max-w-3xl">
          Connect with your customers on WhatsApp, Instagram & Facebook. <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#4a6b82] to-[#68809a]">Automatically.</span>
        </h2>
        
        <p className="text-sm md:text-base text-zinc-600 max-w-2xl mb-8 leading-relaxed font-normal">
          Svachalit helps businesses automate customer chat flows securely. Answer inquiries instantly, book calendar slots, and capture qualified leads on autopilot using contextual company knowledge.
        </p>

        <div className="flex flex-wrap justify-center gap-3 mb-16">
          <button 
            onClick={() => onChoosePlan('managed')}
            className="px-6 py-3 bg-[#4a6b82] hover:bg-[#385265] text-xs font-bold text-white rounded-lg transition-all active:scale-95 flex items-center gap-1.5 shadow-sm"
          >
            Start Free Trial
          </button>
          <button 
            onClick={onLaunchDashboard}
            className="px-6 py-3 bg-white hover:bg-zinc-50 border border-stone-200/80 text-zinc-800 text-xs font-bold rounded-lg transition-all active:scale-95 flex items-center gap-1.5 shadow-sm"
          >
            Launch Console Demo <ArrowRight className="h-3.5 w-3.5" />
          </button>
          <a 
            href="#demo"
            className="px-6 py-3 bg-zinc-100 hover:bg-zinc-200 text-xs font-semibold text-zinc-600 rounded-lg transition-all active:scale-95 flex items-center gap-1.5"
          >
            Watch Demo <Play className="h-3 w-3 text-zinc-500 fill-zinc-500" />
          </a>
        </div>

        {/* Hero Visual Mockup - Redesigned as clean warm light-mode browser */}
        <div className="w-full rounded-2xl border border-stone-200 bg-white p-2.5 overflow-hidden shadow-md relative">
          <div className="h-6 w-full flex items-center gap-1.5 px-3 border-b border-stone-100 bg-[#fdfdfc] text-zinc-400 text-xs">
            <span className="h-2 w-2 rounded-full bg-red-400/40"></span>
            <span className="h-2 w-2 rounded-full bg-yellow-400/40"></span>
            <span className="h-2 w-2 rounded-full bg-green-400/40"></span>
            <span className="ml-4 font-mono text-[9px] text-zinc-400">svachalit.app/console</span>
          </div>
          <div className="bg-[#faf9f5] p-4 h-64 md:h-96 flex overflow-hidden rounded-b-xl">
            {/* Sidebar list mock */}
            <div className="w-1/4 border-r border-stone-200/60 hidden md:flex flex-col gap-2.5 p-2">
              <div className="h-5 bg-[#eae8e0] rounded w-full animate-pulse" />
              <div className="h-5 bg-[#eae8e0] rounded w-3/4 animate-pulse" />
              <div className="h-9 bg-white border border-[#4a6b82]/10 rounded mt-4" />
              <div className="h-9 bg-[#eae8e0]/40 rounded" />
              <div className="h-9 bg-[#eae8e0]/40 rounded" />
            </div>
            {/* Center Area */}
            <div className="flex-1 flex flex-col p-2">
              <div className="flex justify-between items-center pb-2 border-b border-stone-200/60">
                <span className="h-4 bg-[#eae8e0] rounded w-1/3 animate-pulse" />
                <span className="h-5 px-2 bg-emerald-50 text-emerald-700 text-[9px] font-bold rounded-full border border-emerald-200/40 flex items-center gap-1">
                  <span className="h-1 w-1 rounded-full bg-emerald-600"></span> Live Sync
                </span>
              </div>
              <div className="flex-1 flex flex-col gap-3 py-4 justify-end">
                <div className="bg-[#eae8e0] text-zinc-800 rounded-lg p-2.5 max-w-[60%] text-left text-[10px] shadow-sm">
                  How can I check pricing?
                </div>
                <div className="bg-[#4a6b82]/10 border border-[#4a6b82]/20 rounded-lg p-2.5 max-w-[65%] self-end text-left text-[10px] text-[#2c3e50] font-medium font-mono flex items-center gap-1.5 shadow-sm">
                  🔍 Reading local business guidelines database...
                </div>
                <div className="bg-[#e2e8e4] border border-[#c6d5cb] text-[#2c3d33] rounded-lg p-2.5 max-w-[65%] self-end text-left text-[10px] font-medium shadow-sm">
                  Our starter subscription is $19/month, which includes 1,000 automated messages. Let me know if you would like me to set up an account!
                </div>
              </div>
              <div className="h-9 bg-white border border-stone-200 rounded-lg w-full flex items-center justify-between px-3 text-xs text-zinc-400">
                <span>Message customer...</span>
                <Send className="h-3.5 w-3.5 text-[#4a6b82]" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. INTERACTIVE DEMO SECTION */}
      <section id="demo" className="py-24 border-y border-stone-200/60 bg-white/30 px-6">
        <div className="max-w-5xl mx-auto grid md:grid-cols-12 gap-12 items-center">
          
          {/* Info Side */}
          <div className="md:col-span-5 space-y-6">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#4a6b82] font-mono">Interactive Simulator</h3>
            <h2 className="text-3xl font-extrabold tracking-tight text-zinc-900 leading-tight">
              See the chat flow in action
            </h2>
            <p className="text-xs text-zinc-650 leading-relaxed">
              Select a channel to preview how Svachalit handles incoming messages, reads your business rules, and updates lead profiles dynamically.
            </p>

            {/* Simulated channel switch buttons */}
            <div className="flex flex-col gap-2">
              <button 
                onClick={() => setDemoTab('whatsapp')}
                className={`flex items-center justify-between p-3 rounded-lg border text-left transition-all ${demoTab === 'whatsapp' ? 'bg-[#f5f4ef] border-stone-300 text-zinc-900' : 'bg-white border-stone-200 hover:border-stone-300 text-zinc-600'}`}
              >
                <div className="flex items-center gap-2 text-xs font-semibold">
                  <Phone className="h-4 w-4 text-emerald-600" />
                  WhatsApp Support Chat
                </div>
                <ChevronRight className="h-3 w-3 text-zinc-400" />
              </button>

              <button 
                onClick={() => setDemoTab('instagram')}
                className={`flex items-center justify-between p-3 rounded-lg border text-left transition-all ${demoTab === 'instagram' ? 'bg-[#f5f4ef] border-stone-300 text-zinc-900' : 'bg-white border-stone-200 hover:border-stone-300 text-zinc-600'}`}
              >
                <div className="flex items-center gap-2 text-xs font-semibold">
                  <Instagram className="h-4 w-4 text-pink-600" />
                  Instagram DM Assistant
                </div>
                <ChevronRight className="h-3 w-3 text-zinc-400" />
              </button>

              <button 
                onClick={() => setDemoTab('lead')}
                className={`flex items-center justify-between p-3 rounded-lg border text-left transition-all ${demoTab === 'lead' ? 'bg-[#f5f4ef] border-stone-300 text-zinc-900' : 'bg-white border-stone-200 hover:border-stone-300 text-zinc-600'}`}
              >
                <div className="flex items-center gap-2 text-xs font-semibold">
                  <Layers className="h-4 w-4 text-blue-600" />
                  Lead Capture & CRM Sync
                </div>
                <ChevronRight className="h-3 w-3 text-zinc-400" />
              </button>

              <button 
                onClick={() => setDemoTab('routing')}
                className={`flex items-center justify-between p-3 rounded-lg border text-left transition-all ${demoTab === 'routing' ? 'bg-[#f5f4ef] border-stone-300 text-zinc-900' : 'bg-white border-stone-200 hover:border-stone-300 text-zinc-600'}`}
              >
                <div className="flex items-center gap-2 text-xs font-semibold">
                  <ArrowRightLeft className="h-4 w-4 text-amber-600" />
                  AI to Live Agent Takeover
                </div>
                <ChevronRight className="h-3 w-3 text-zinc-400" />
              </button>
            </div>
          </div>

          {/* Interactive Chat Mockup Panel */}
          <div className="md:col-span-7 bg-white border border-stone-200/80 rounded-2xl p-4 shadow-sm flex flex-col h-[400px]">
            {/* Header info */}
            <div className="flex justify-between items-center pb-3 border-b border-stone-100">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-emerald-500 animate-ping"></div>
                <span className="text-xs font-bold text-zinc-800 capitalize">{demoTab} Simulator Channel</span>
              </div>
              <span className="text-[9px] text-[#4a6b82] font-semibold font-mono">Sync active</span>
            </div>

            {/* Chat Body */}
            <div className="flex-1 overflow-y-auto py-4 space-y-3">
              {demoMessages.map((msg, idx) => (
                <div 
                  key={idx} 
                  className={`flex ${msg.sender === 'user' ? 'justify-start' : msg.sender === 'system' ? 'justify-center' : 'justify-end'}`}
                >
                  <div className={`p-2.5 rounded-lg text-xs max-w-[80%] shadow-sm ${
                    msg.sender === 'user'
                      ? 'bg-[#eae8e0] text-zinc-850'
                      : msg.sender === 'system'
                        ? 'bg-amber-50 text-amber-800 border border-amber-200 text-[10px] font-medium'
                        : msg.isTool
                          ? 'bg-[#4a6b82]/10 border border-[#4a6b82]/20 text-[#2c3e50] font-mono text-[9px] flex items-center gap-1.5'
                          : 'bg-[#4a6b82] text-white'
                  }`}>
                    {msg.isTool && <Sparkles className="h-3 w-3 text-[#4a6b82]" />}
                    {msg.text}
                  </div>
                </div>
              ))}
              {isTyping && (
                <div className="flex justify-end">
                  <div className="bg-[#eae8e0]/40 p-2.5 rounded-lg text-xs text-zinc-500">
                    Assistant is typing...
                  </div>
>>>>>>> 765969bd30239688115f15de9bc845dfa0e7665c
                </div>
              )}
            </div>

<<<<<<< HEAD
            <div className="border-t border-slate-200 p-4">
              <ManualReply value={reply} onChange={setReply} onSend={sendReply} disabled={busy || !selected} />
              {busy ? (
                <p className="mt-2 inline-flex items-center gap-2 text-xs text-slate-500">
                  <Loader2 size={13} className="animate-spin" aria-hidden />
                  Working
                </p>
              ) : null}
            </div>
          </section>
        </div>

        <div className="grid gap-4 xl:grid-cols-2">
          <KnowledgeBasePanel entries={kbEntries} onChanged={load} />
          <ToolEvents events={toolEvents} />
        </div>

        <section className="rounded-md border border-slate-200 bg-white p-4 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-950">Channel Distribution</h2>
          <div className="mt-3 grid gap-2">
            {(analytics?.channelDistribution || []).map((item) => (
              <div key={item.channel} className="grid grid-cols-[120px_1fr_40px] items-center gap-3 text-sm">
                <span className="font-medium text-slate-700">{item.channel}</span>
                <span className="h-2 overflow-hidden rounded-full bg-slate-100">
                  <span
                    className="block h-full rounded-full bg-blue-700"
                    style={{
                      width: `${Math.min(100, item.count * 24)}%`
                    }}
                  />
                </span>
                <span className="text-right text-slate-500">{item.count}</span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
=======
            {/* Chat Input */}
            <form onSubmit={handleDemoChat} className="flex gap-2 pt-3 border-t border-stone-100">
              <input 
                type="text" 
                placeholder="Type messages to simulate caller interactions..."
                value={demoInput}
                onChange={(e) => setDemoInput(e.target.value)}
                className="flex-1 px-3 py-2 bg-[#fdfdfc] border border-stone-200 rounded-lg text-xs text-zinc-800 focus:outline-none focus:border-[#4a6b82]"
              />
              <button 
                type="submit" 
                className="p-2.5 bg-[#4a6b82] hover:bg-[#385265] rounded-lg text-white"
              >
                <Send className="h-3.5 w-3.5" />
              </button>
            </form>
          </div>

        </div>
      </section>

      {/* 3. FEATURES SECTION */}
      <section id="features" className="py-24 max-w-5xl mx-auto px-6">
        <div className="text-center space-y-4 mb-16">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#4a6b82] font-mono">Simple & Secure</h3>
          <h2 className="text-3xl font-extrabold tracking-tight text-zinc-900 leading-tight">
            Conversational workflows you can trust
          </h2>
          <p className="text-xs text-zinc-650 max-w-lg mx-auto">
            Traditional AI chatbots make up facts. Svachalit references only the knowledge files you upload, ensuring accurate support responses and secure CRM actions.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Card 1 */}
          <div className="glass-card p-6 rounded-xl space-y-4">
            <div className="p-3 bg-[#4a6b82]/10 border border-[#4a6b82]/20 rounded-lg text-[#4a6b82] w-fit">
              <Cpu className="h-5 w-5" />
            </div>
            <h3 className="font-bold text-sm text-zinc-900">Secure Business Memory</h3>
            <p className="text-xs text-zinc-600 leading-relaxed font-normal">
              Synchronize local documents and guidelines databases so the AI responds using only your verified business details.
            </p>
          </div>

          {/* Card 2 */}
          <div className="glass-card p-6 rounded-xl space-y-4">
            <div className="p-3 bg-[#4a6b82]/10 border border-[#4a6b82]/20 rounded-lg text-[#4a6b82] w-fit">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <h3 className="font-bold text-sm text-zinc-900">Trust Protection</h3>
            <p className="text-xs text-zinc-600 leading-relaxed font-normal">
              Enforce strict system instructions and guidelines, ensuring the assistant safely declines queries outside your business scope.
            </p>
          </div>

          {/* Card 3 */}
          <div className="glass-card p-6 rounded-xl space-y-4">
            <div className="p-3 bg-[#4a6b82]/10 border border-[#4a6b82]/20 rounded-lg text-[#4a6b82] w-fit">
              <Globe className="h-5 w-5" />
            </div>
            <h3 className="font-bold text-sm text-zinc-900">Multi-Channel Inbox</h3>
            <p className="text-xs text-zinc-600 leading-relaxed font-normal">
              A single setup routes chats from WhatsApp, Instagram DMs, Facebook, and voice calls to your active console.
            </p>
          </div>

          {/* Card 4 */}
          <div className="glass-card p-6 rounded-xl space-y-4">
            <div className="p-3 bg-[#4a6b82]/10 border border-[#4a6b82]/20 rounded-lg text-[#4a6b82] w-fit">
              <MessageSquare className="h-5 w-5" />
            </div>
            <h3 className="font-bold text-sm text-zinc-900">Agent Handoff</h3>
            <p className="text-xs text-zinc-600 leading-relaxed font-normal">
              Monitor active chat streams. Jumping in manually to type a message pauses the automated AI assistant instantly.
            </p>
          </div>

          {/* Card 5 */}
          <div className="glass-card p-6 rounded-xl space-y-4">
            <div className="p-3 bg-[#4a6b82]/10 border border-[#4a6b82]/20 rounded-lg text-[#4a6b82] w-fit">
              <GitBranch className="h-5 w-5" />
            </div>
            <h3 className="font-bold text-sm text-zinc-900">Custom Workflows</h3>
            <p className="text-xs text-zinc-600 leading-relaxed font-normal">
              Route events automatically to execute calendar bookings, export spreadsheets, or update customer CRM tags.
            </p>
          </div>

          {/* Card 6 */}
          <div className="glass-card p-6 rounded-xl space-y-4">
            <div className="p-3 bg-[#4a6b82]/10 border border-[#4a6b82]/20 rounded-lg text-[#4a6b82] w-fit">
              <BarChart2 className="h-5 w-5" />
            </div>
            <h3 className="font-bold text-sm text-zinc-900">Clear Performance Reports</h3>
            <p className="text-xs text-zinc-600 leading-relaxed font-normal">
              Monitor incoming chat volumes, automatic containment ratios, CRM updates, and customer satisfaction ratings.
            </p>
          </div>
        </div>
      </section>

      {/* 4. WORKFLOW VISUALIZATION */}
      <section id="workflow" className="py-24 border-t border-stone-200/60 bg-stone-50/20 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center space-y-4 mb-16">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#4a6b82] font-mono">Simple Pipelines</h3>
            <h2 className="text-3xl font-extrabold tracking-tight text-zinc-900 leading-tight">
              How messages are handled
            </h2>
            <p className="text-xs text-zinc-650 max-w-md mx-auto">
              A straightforward process that secures your data, resolves responses instantly, and maintains human control.
            </p>
          </div>

          {/* Workflow Step Grid */}
          <div className="grid md:grid-cols-5 gap-6 relative">
            {/* Step 1 */}
            <div className="p-5 bg-white border border-stone-200/80 rounded-xl relative flex flex-col items-center text-center shadow-sm">
              <div className="w-9 h-9 rounded-full bg-[#4a6b82]/10 border border-[#4a6b82]/20 flex items-center justify-center font-bold text-xs text-[#4a6b82] mb-4 font-mono">
                1
              </div>
              <h4 className="font-bold text-xs text-zinc-900 mb-2">Message Inbound</h4>
              <p className="text-[10px] text-zinc-550">Svachalit captures text from WhatsApp DMs, Instagram comments, or voice calls.</p>
            </div>

            {/* Step 2 */}
            <div className="p-5 bg-white border border-stone-200/80 rounded-xl relative flex flex-col items-center text-center shadow-sm">
              <div className="w-9 h-9 rounded-full bg-[#4a6b82]/10 border border-[#4a6b82]/20 flex items-center justify-center font-bold text-xs text-[#4a6b82] mb-4 font-mono">
                2
              </div>
              <h4 className="font-bold text-xs text-zinc-900 mb-2">Safe Queueing</h4>
              <p className="text-[10px] text-zinc-550">Incoming messages are enqueued securely so no customer inquiries are ever lost.</p>
            </div>

            {/* Step 3 */}
            <div className="p-5 bg-white border border-stone-200/80 rounded-xl relative flex flex-col items-center text-center shadow-sm">
              <div className="w-9 h-9 rounded-full bg-[#4a6b82]/10 border border-[#4a6b82]/20 flex items-center justify-center font-bold text-xs text-[#4a6b82] mb-4 font-mono">
                3
              </div>
              <h4 className="font-bold text-xs text-zinc-900 mb-2">Context Retrieval</h4>
              <p className="text-[10px] text-zinc-550">Svachalit searches your uploaded guidelines for exact matching facts.</p>
            </div>

            {/* Step 4 */}
            <div className="p-5 bg-white border border-stone-200/80 rounded-xl relative flex flex-col items-center text-center shadow-sm">
              <div className="w-9 h-9 rounded-full bg-[#4a6b82]/10 border border-[#4a6b82]/20 flex items-center justify-center font-bold text-xs text-[#4a6b82] mb-4 font-mono">
                4
              </div>
              <h4 className="font-bold text-xs text-zinc-900 mb-2">Action Logic</h4>
              <p className="text-[10px] text-zinc-550">The assistant checks inventory, captures customer detail fields, or books slot schedules.</p>
            </div>

            {/* Step 5 */}
            <div className="p-5 bg-white border border-[#4a6b82]/20 rounded-xl relative flex flex-col items-center text-center shadow-md">
              <div className="w-9 h-9 rounded-full bg-[#4a6b82] text-white flex items-center justify-center font-bold text-xs mb-4 font-mono">
                5
              </div>
              <h4 className="font-bold text-xs text-zinc-900 mb-2">Instant Reply</h4>
              <p className="text-[10px] text-zinc-550 font-medium text-[#4a6b82]">Answers are dispatched instantly, or the thread transfers to your team inbox.</p>
            </div>
          </div>
        </div>
      </section>

      {/* 5. PRICING SECTION */}
      <section id="pricing" className="py-24 max-w-4xl mx-auto px-6">
        <div className="text-center space-y-4 mb-16">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#4a6b82] font-mono">Subscription Plans</h3>
          <h2 className="text-3xl font-extrabold tracking-tight text-zinc-900 leading-tight">
            Choose your roadmap
          </h2>
          <p className="text-xs text-zinc-650 max-w-sm mx-auto">
            Get started by integrating your own keys, or let us host the complete secure database infrastructure.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Plan 1 */}
          <div className="bg-white border border-stone-200/80 p-8 rounded-xl relative flex flex-col justify-between shadow-sm">
            <div>
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h4 className="font-bold text-sm text-[#4a6b82] uppercase tracking-wider font-mono">Developer Starter</h4>
                  <h3 className="font-bold text-lg text-zinc-900 mt-1">Bring Your API Key</h3>
                </div>
                <span className="text-xs font-bold px-2.5 py-1 bg-stone-100 rounded border border-stone-200 text-zinc-700 font-mono">$19/mo</span>
              </div>
              <p className="text-xs text-zinc-555 mb-6 font-normal">
                Perfect for developers and technical founders looking to link their personal LLM provider accounts.
              </p>
              <ul className="space-y-3 text-xs text-zinc-600 mb-8">
                <li className="flex items-center gap-2"><CheckCircle className="h-3.5 w-3.5 text-[#4a6b82]" /> Connect OpenAI/Gemini accounts</li>
                <li className="flex items-center gap-2"><CheckCircle className="h-3.5 w-3.5 text-[#4a6b82]" /> WhatsApp & Instagram integrations</li>
                <li className="flex items-center gap-2"><CheckCircle className="h-3.5 w-3.5 text-[#4a6b82]" /> Real-time console sync inbox</li>
                <li className="flex items-center gap-2"><CheckCircle className="h-3.5 w-3.5 text-[#4a6b82]" /> Standard email support</li>
              </ul>
            </div>
            <button
              onClick={() => onChoosePlan('byok')}
              className="w-full py-2.5 bg-white hover:bg-stone-50 text-xs font-bold text-zinc-800 rounded-lg transition-colors border border-stone-200"
            >
              Choose Developer Plan
            </button>
          </div>

          {/* Plan 2 */}
          <div className="bg-white border border-[#4a6b82]/40 p-8 rounded-xl relative flex flex-col justify-between overflow-hidden shadow-md">
            <div className="absolute top-0 right-0 bg-[#4a6b82] text-[9px] font-bold px-3 py-1 uppercase rounded-bl-lg tracking-wider text-white">
              Recommended
            </div>
            <div>
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h4 className="font-bold text-sm text-[#4a6b82] uppercase tracking-wider font-mono">Business Managed</h4>
                  <h3 className="font-bold text-lg text-zinc-900 mt-1">Svachalit Managed</h3>
                </div>
                <span className="text-xs font-bold px-2.5 py-1 bg-[#4a6b82]/10 text-[#4a6b82] rounded border border-[#4a6b82]/20 font-mono">$49/mo</span>
              </div>
              <p className="text-xs text-zinc-555 mb-6 font-normal">
                A complete setup including hosted vector databases, prioritized models, and enterprise support.
              </p>
              <ul className="space-y-3 text-xs text-zinc-600 mb-8">
                <li className="flex items-center gap-2"><CheckCircle className="h-3.5 w-3.5 text-[#4a6b82]" /> Zero-configuration hosted databases</li>
                <li className="flex items-center gap-2"><CheckCircle className="h-3.5 w-3.5 text-[#4a6b82]" /> Advanced trust protection logic</li>
                <li className="flex items-center gap-2"><CheckCircle className="h-3.5 w-3.5 text-[#4a6b82]" /> Active inbound phone calling streams</li>
                <li className="flex items-center gap-2"><CheckCircle className="h-3.5 w-3.5 text-[#4a6b82]" /> CSAT reports & ROI dashboards</li>
                <li className="flex items-center gap-2"><CheckCircle className="h-3.5 w-3.5 text-[#4a6b82]" /> 24/7 dedicated support desk</li>
              </ul>
            </div>
            <button
              onClick={() => onChoosePlan('managed')}
              className="w-full py-2.5 bg-[#4a6b82] hover:bg-[#385265] text-xs font-bold text-white rounded-lg transition-all shadow-sm"
            >
              Choose Managed Plan
            </button>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-stone-200/60 bg-[#f5f4ef]/60 py-12 px-6 mt-16 text-center text-xs text-zinc-500">
        <p className="mb-2">© 2026 Svachalit Inc. All rights reserved.</p>
        <p className="font-mono text-[9px] text-zinc-400">Automate Conversations. Scale Businesses.</p>
      </footer>
    </div>
  );
}

// ==========================================
// 2. MULTI-STEP ONBOARDING WIZARD MODAL
// ==========================================
interface OnboardingModalProps {
  plan: 'byok' | 'managed';
  onClose: () => void;
  onComplete: () => void;
}

function OnboardingModal({ plan, onClose, onComplete }: OnboardingModalProps) {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    fullName: '',
    businessName: '',
    email: '',
    phone: '',
    password: '',
    industry: 'Technology',
    businessSize: '1-10',
    volume: 'Under 1k',
    useCase: 'Support Automation',
    whatsappNumber: '',
    instagramHandle: '',
    facebookPage: '',
    websiteUrl: '',
    byoKey: plan === 'byok' ? 'Yes' : 'No',
    model: 'gpt-4o-mini',
    dailyChats: '50-200',
    teamSize: '1-5',
    country: 'United States',
    language: 'English'
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleNext = () => {
    if (step < 4) setStep(step + 1);
    else onComplete();
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/40 backdrop-blur-sm p-4 animate-fade-in">
      <div className="w-full max-w-xl bg-white border border-stone-200 rounded-2xl overflow-hidden shadow-xl relative">
        
        {/* Header step tracking indicator */}
        <div className="p-6 border-b border-stone-100 flex justify-between items-center bg-stone-50/50">
          <div>
            <h3 className="font-bold text-sm text-zinc-800">Setup your account</h3>
            <p className="text-[10px] text-[#4a6b82] font-semibold tracking-wider mt-0.5 uppercase font-mono">STEP {step} OF 4</p>
          </div>
          <button onClick={onClose} className="p-2 text-zinc-400 hover:text-zinc-700 transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Progress bar */}
        <div className="w-full h-1 bg-stone-100">
          <div 
            className="h-full bg-[#4a6b82] transition-all duration-300"
            style={{ width: `${(step / 4) * 100}%` }}
          />
        </div>

        {/* Form Body */}
        <div className="p-6 h-96 overflow-y-auto space-y-4">
          
          {/* STEP 1: BASIC DETAILS */}
          {step === 1 && (
            <div className="space-y-4">
              <h4 className="font-bold text-xs text-zinc-500">Account Owner Details</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] text-zinc-650 block mb-1 font-semibold">Full Name</label>
                  <input 
                    type="text" 
                    name="fullName" 
                    value={formData.fullName} 
                    onChange={handleChange} 
                    placeholder="Alice Johnson"
                    className="w-full px-3 py-2 bg-[#fdfdfc] border border-stone-200 rounded-lg text-xs text-zinc-800 focus:outline-none focus:border-[#4a6b82] shadow-sm" 
                  />
                </div>
                <div>
                  <label className="text-[10px] text-zinc-650 block mb-1 font-semibold">Business Name</label>
                  <input 
                    type="text" 
                    name="businessName" 
                    value={formData.businessName} 
                    onChange={handleChange} 
                    placeholder="Acme Corp"
                    className="w-full px-3 py-2 bg-[#fdfdfc] border border-stone-200 rounded-lg text-xs text-zinc-800 focus:outline-none focus:border-[#4a6b82] shadow-sm" 
                  />
                </div>
              </div>
              <div>
                <label className="text-[10px] text-zinc-650 block mb-1 font-semibold">Email Address</label>
                <input 
                  type="email" 
                  name="email" 
                  value={formData.email} 
                  onChange={handleChange} 
                  placeholder="owner@acme.com"
                  className="w-full px-3 py-2 bg-[#fdfdfc] border border-stone-200 rounded-lg text-xs text-zinc-800 focus:outline-none focus:border-[#4a6b82] shadow-sm" 
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] text-zinc-650 block mb-1 font-semibold">WhatsApp Number</label>
                  <input 
                    type="text" 
                    name="phone" 
                    value={formData.phone} 
                    onChange={handleChange} 
                    placeholder="+1 555-0199"
                    className="w-full px-3 py-2 bg-[#fdfdfc] border border-stone-200 rounded-lg text-xs text-zinc-800 focus:outline-none focus:border-[#4a6b82] shadow-sm" 
                  />
                </div>
                <div>
                  <label className="text-[10px] text-zinc-650 block mb-1 font-semibold">Password</label>
                  <input 
                    type="password" 
                    name="password" 
                    value={formData.password} 
                    onChange={handleChange} 
                    placeholder="••••••••"
                    className="w-full px-3 py-2 bg-[#fdfdfc] border border-stone-200 rounded-lg text-xs text-zinc-800 focus:outline-none focus:border-[#4a6b82] shadow-sm" 
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: BUSINESS INFORMATION */}
          {step === 2 && (
            <div className="space-y-4">
              <h4 className="font-bold text-xs text-zinc-500">Business Profile Parameters</h4>
              <div>
                <label className="text-[10px] text-zinc-650 block mb-1 font-semibold">Industry Type</label>
                <select 
                  name="industry" 
                  value={formData.industry} 
                  onChange={handleChange} 
                  className="w-full px-3 py-2 bg-[#fdfdfc] border border-stone-200 rounded-lg text-xs text-zinc-800 focus:outline-none focus:border-[#4a6b82] shadow-sm"
                >
                  <option value="Technology">Technology & SaaS</option>
                  <option value="Retail">Retail & E-commerce</option>
                  <option value="Healthcare">Healthcare & Beauty</option>
                  <option value="Real Estate">Real Estate</option>
                  <option value="Finance">Finance & Crypto</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] text-zinc-650 block mb-1 font-semibold">Business Size</label>
                  <select 
                    name="businessSize" 
                    value={formData.businessSize} 
                    onChange={handleChange} 
                    className="w-full px-3 py-2 bg-[#fdfdfc] border border-stone-200 rounded-lg text-xs text-zinc-800 focus:outline-none focus:border-[#4a6b82] shadow-sm"
                  >
                    <option value="1-10">1-10 Employees</option>
                    <option value="11-50">11-50 Employees</option>
                    <option value="51-200">51-200 Employees</option>
                    <option value="200+">200+ Employees</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] text-zinc-650 block mb-1 font-semibold">Monthly Volume</label>
                  <select 
                    name="volume" 
                    value={formData.volume} 
                    onChange={handleChange} 
                    className="w-full px-3 py-2 bg-[#fdfdfc] border border-stone-200 rounded-lg text-xs text-zinc-800 focus:outline-none focus:border-[#4a6b82] shadow-sm"
                  >
                    <option value="Under 1k">Under 1,000 Chats</option>
                    <option value="1k-5k">1,000 - 5,000 Chats</option>
                    <option value="5k-20k">5,000 - 20,000 Chats</option>
                    <option value="20k+">20,000+ Chats</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="text-[10px] text-zinc-650 block mb-1 font-semibold">Primary Use Case</label>
                <select 
                  name="useCase" 
                  value={formData.useCase} 
                  onChange={handleChange} 
                  className="w-full px-3 py-2 bg-[#fdfdfc] border border-stone-200 rounded-lg text-xs text-zinc-800 focus:outline-none focus:border-[#4a6b82] shadow-sm"
                >
                  <option value="Support Automation">Customer Support Automation</option>
                  <option value="Lead Qualification">Lead Generation & Qualifying</option>
                  <option value="Appointment Booking">Scheduling & Appointment Booking</option>
                  <option value="Omnichannel Sales">Social Selling & Cart Recovery</option>
                </select>
              </div>
            </div>
          )}

          {/* STEP 3: PLATFORM CONNECTIONS */}
          {step === 3 && (
            <div className="space-y-4">
              <h4 className="font-bold text-xs text-zinc-500">Social Channel Details</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] text-zinc-650 block mb-1 font-semibold">WhatsApp Business Number</label>
                  <input 
                    type="text" 
                    name="whatsappNumber" 
                    value={formData.whatsappNumber} 
                    onChange={handleChange} 
                    placeholder="+1 555-0199"
                    className="w-full px-3 py-2 bg-[#fdfdfc] border border-stone-200 rounded-lg text-xs text-zinc-800 focus:outline-none focus:border-[#4a6b82] shadow-sm" 
                  />
                </div>
                <div>
                  <label className="text-[10px] text-zinc-650 block mb-1 font-semibold">Instagram Business Handle</label>
                  <input 
                    type="text" 
                    name="instagramHandle" 
                    value={formData.instagramHandle} 
                    onChange={handleChange} 
                    placeholder="@acme_styles"
                    className="w-full px-3 py-2 bg-[#fdfdfc] border border-stone-200 rounded-lg text-xs text-zinc-800 focus:outline-none focus:border-[#4a6b82] shadow-sm" 
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] text-zinc-650 block mb-1 font-semibold">Facebook Page Name</label>
                  <input 
                    type="text" 
                    name="facebookPage" 
                    value={formData.facebookPage} 
                    onChange={handleChange} 
                    placeholder="Acme Corporation"
                    className="w-full px-3 py-2 bg-[#fdfdfc] border border-stone-200 rounded-lg text-xs text-zinc-800 focus:outline-none focus:border-[#4a6b82] shadow-sm" 
                  />
                </div>
                <div>
                  <label className="text-[10px] text-zinc-650 block mb-1 font-semibold">Business Website URL</label>
                  <input 
                    type="text" 
                    name="websiteUrl" 
                    value={formData.websiteUrl} 
                    onChange={handleChange} 
                    placeholder="https://acme.com"
                    className="w-full px-3 py-2 bg-[#fdfdfc] border border-stone-200 rounded-lg text-xs text-zinc-800 focus:outline-none focus:border-[#4a6b82] shadow-sm" 
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: AI PREFERENCES */}
          {step === 4 && (
            <div className="space-y-4">
              <h4 className="font-bold text-xs text-zinc-500">AI Model Setup & Settings</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] text-zinc-650 block mb-1 font-semibold">Bring Own Key?</label>
                  <select 
                    name="byoKey" 
                    value={formData.byoKey} 
                    onChange={handleChange} 
                    className="w-full px-3 py-2 bg-[#fdfdfc] border border-stone-200 rounded-lg text-xs text-zinc-800 focus:outline-none focus:border-[#4a6b82] shadow-sm"
                  >
                    <option value="Yes">Yes (Using OpenRouter/OpenAI)</option>
                    <option value="No">No (Managed RAG infrastructure)</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] text-zinc-650 block mb-1 font-semibold">Preferred Model</label>
                  <select 
                    name="model" 
                    value={formData.model} 
                    onChange={handleChange} 
                    className="w-full px-3 py-2 bg-[#fdfdfc] border border-stone-200 rounded-lg text-xs text-zinc-800 focus:outline-none focus:border-[#4a6b82] shadow-sm"
                  >
                    <option value="gpt-4o-mini">GPT-4o Mini (Cost Efficient)</option>
                    <option value="gpt-4o">GPT-4o (Smart Reasoning)</option>
                    <option value="gemini-1.5-flash">Gemini 1.5 Flash (Low latency)</option>
                    <option value="claude-3-haiku">Claude 3 Haiku</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="text-[10px] text-zinc-650 block mb-1 font-semibold">Expected Daily Chats</label>
                <select 
                  name="dailyChats" 
                  value={formData.dailyChats} 
                  onChange={handleChange} 
                  className="w-full px-3 py-2 bg-[#fdfdfc] border border-stone-200 rounded-lg text-xs text-zinc-800 focus:outline-none focus:border-[#4a6b82] shadow-sm"
                >
                  <option value="0-50">Under 50 chats/day</option>
                  <option value="50-200">50 - 200 chats/day</option>
                  <option value="200-1k">200 - 1,000 chats/day</option>
                  <option value="1k+">1,000+ chats/day</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] text-zinc-650 block mb-1 font-semibold">Team Size</label>
                  <input 
                    type="text" 
                    name="teamSize" 
                    value={formData.teamSize} 
                    onChange={handleChange} 
                    placeholder="3 members"
                    className="w-full px-3 py-2 bg-[#fdfdfc] border border-stone-200 rounded-lg text-xs text-zinc-800 focus:outline-none focus:border-[#4a6b82] shadow-sm" 
                  />
                </div>
                <div>
                  <label className="text-[10px] text-zinc-650 block mb-1 font-semibold">Country</label>
                  <input 
                    type="text" 
                    name="country" 
                    value={formData.country} 
                    onChange={handleChange} 
                    placeholder="United States"
                    className="w-full px-3 py-2 bg-[#fdfdfc] border border-stone-200 rounded-lg text-xs text-zinc-800 focus:outline-none focus:border-[#4a6b82] shadow-sm" 
                  />
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Footer controls */}
        <div className="p-6 border-t border-stone-100 flex justify-between bg-stone-50/50">
          <button
            onClick={handleBack}
            disabled={step === 1}
            className={`px-4 py-2 border border-stone-200 text-xs font-semibold rounded-lg text-zinc-550 hover:text-zinc-800 ${step === 1 ? 'opacity-40 cursor-not-allowed' : ''}`}
          >
            Back
          </button>
          
          <button
            onClick={handleNext}
            className="px-5 py-2 bg-[#4a6b82] hover:bg-[#385265] text-xs font-bold text-white rounded-lg transition-all shadow-sm"
          >
            {step === 4 ? 'Complete Onboarding' : 'Next Step'}
          </button>
        </div>

      </div>
    </div>
  );
}

// ==========================================
// 3. PREMIUM REDESIGNED DASHBOARD CONSOLE
// ==========================================
interface DashboardConsoleProps {
  onExitToLanding: () => void;
}

function DashboardConsole({ onExitToLanding }: DashboardConsoleProps) {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'inbox' | 'analytics' | 'agents' | 'workflows' | 'leads' | 'integrations' | 'settings'>('dashboard');
  
  // States copied from old page.tsx
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

  // Read backend URL. If deployed, reads process.env.NEXT_PUBLIC_BACKEND_URL. Otherwise defaults to port 4000.
  const BACKEND_URL = "https://autobot-1-elsg.onrender.com";

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
      setSeedingStatus('Cannot connect to Render backend database.');
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
      console.error('[SSE] Connection error. Retrying...', err);
    };

    return () => {
      eventSource.close();
    };
  }, []);

  // 4. Scroll to bottom of message panel
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeConversation?.messages]);

  // 5. Send Manual Message Response
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

      if (res.ok) {
        fetchConversations();
      }
    } catch (err) {
      console.error('Error posting message:', err);
    }
  };

  // 6. Change Conversation Automation Status
  const toggleAutomationStatus = async (newStatus: 'AI_MANAGED' | 'HUMAN_PENDING') => {
    if (!selectedConvId) return;

    try {
      const res = await fetch(`${BACKEND_URL}/api/v1/conversations/${selectedConvId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (res.ok) {
        fetchConversations();
      }
    } catch (err) {
      console.error('Error updating status:', err);
    }
  };

  // 7. Dev Seed Utility
  const runDatabaseSeed = async () => {
    setSeedingStatus('Seeding active database on Render...');
    try {
      const res = await fetch(`${BACKEND_URL}/api/v1/dev/seed`, {
        method: 'POST'
      });
      if (res.ok) {
        const data = await res.json();
        setTenantKey(data.tenantApiKey);
        setSeedingStatus('Successfully seeded. Clicking refresh.');
        fetchConversations();
      } else {
        setSeedingStatus('Failed database seeding.');
      }
    } catch (err) {
      setSeedingStatus('Server database connection is unavailable.');
    }
  };

  const getChannelIcon = (channel: string) => {
    switch (channel) {
      case 'WHATSAPP': return <Phone className="h-3.5 w-3.5 text-emerald-500" />;
      case 'INSTAGRAM': return <Instagram className="h-3.5 w-3.5 text-pink-500" />;
      case 'FACEBOOK': return <Facebook className="h-3.5 w-3.5 text-blue-500" />;
      case 'VOICE': return <Phone className="h-3.5 w-3.5 text-orange-500" />;
      default: return <Globe className="h-3.5 w-3.5 text-indigo-500" />;
    }
  };

  const filteredConversations = conversations.filter(c => {
    const matchesSearch = c.customer.name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          c.customer.phone?.includes(searchQuery) ||
                          c.messages[0]?.body?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesChannel = channelFilter === 'ALL' || c.channel === channelFilter;
    const matchesStatus = statusFilter === 'ALL' || c.status === statusFilter;

    return matchesSearch && matchesChannel && matchesStatus;
  });

  return (
    <div className="flex h-screen bg-[#fbfaf7] text-stone-850 overflow-hidden font-sans select-none">
      
      {/* LEFT REDESIGNED SIDEBAR */}
      <aside className="w-64 border-r border-stone-200 bg-[#f5f4ef] flex flex-col justify-between p-4 shrink-0">
        <div className="space-y-6">
          {/* Logo & branding */}
          <div className="flex items-center gap-2 px-2 cursor-pointer" onClick={onExitToLanding}>
            <div className="p-1.5 bg-[#4a6b82] rounded-lg text-white glow-primary">
              <Sparkles className="h-4 w-4" />
            </div>
            <div>
              <span className="font-extrabold text-sm text-stone-800 tracking-wide">Svachalit</span>
              <span className="block text-[8px] font-mono text-stone-500 tracking-widest mt-0.5">CONSOLE</span>
            </div>
          </div>

          {/* User summaries */}
          <div className="p-3 bg-white border border-stone-200/85 rounded-xl space-y-2">
            <span className="text-[9px] uppercase tracking-wider text-stone-400 block font-bold">Workspace Stats</span>
            <div className="flex justify-between items-center text-xs">
              <span className="text-stone-500 font-medium">Total Enrolled</span>
              <span className="font-semibold text-stone-850">{conversations.length}</span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-stone-500 font-medium">AI Active</span>
              <span className="font-semibold text-[#5f7a68]">{conversations.filter(c => c.status === 'AI_MANAGED').length}</span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-stone-500 font-medium">Escalations</span>
              <span className="font-semibold text-amber-600">{conversations.filter(c => c.status === 'HUMAN_PENDING').length}</span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${activeTab === 'dashboard' ? 'bg-[#4a6b82]/10 text-[#4a6b82] border border-[#4a6b82]/20' : 'text-stone-600 hover:bg-stone-200/60 hover:text-stone-900 border border-transparent'}`}
            >
              <Cpu className="h-4 w-4" /> Dashboard
            </button>

            <button
              onClick={() => setActiveTab('inbox')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold transition-all ${activeTab === 'inbox' ? 'bg-[#4a6b82]/10 text-[#4a6b82] border border-[#4a6b82]/20' : 'text-stone-600 hover:bg-stone-200/60 hover:text-stone-900 border border-transparent'}`}
            >
              <span className="flex items-center gap-3">
                <MessageSquare className="h-4 w-4" /> Live Inbox
              </span>
              {conversations.filter(c => c.status === 'HUMAN_PENDING').length > 0 && (
                <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse"></span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('analytics')}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${activeTab === 'analytics' ? 'bg-[#4a6b82]/10 text-[#4a6b82] border border-[#4a6b82]/20' : 'text-stone-600 hover:bg-stone-200/60 hover:text-stone-900 border border-transparent'}`}
            >
              <BarChart2 className="h-4 w-4" /> Analytics
            </button>

            <button
              onClick={() => setActiveTab('workflows')}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${activeTab === 'workflows' ? 'bg-[#4a6b82]/10 text-[#4a6b82] border border-[#4a6b82]/20' : 'text-stone-600 hover:bg-stone-200/60 hover:text-stone-900 border border-transparent'}`}
            >
              <GitBranch className="h-4 w-4" /> Workflows
            </button>

            <button
              onClick={() => setActiveTab('leads')}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${activeTab === 'leads' ? 'bg-[#4a6b82]/10 text-[#4a6b82] border border-[#4a6b82]/20' : 'text-stone-600 hover:bg-stone-200/60 hover:text-stone-900 border border-transparent'}`}
            >
              <User className="h-4 w-4" /> Leads CRM
            </button>

            <button
              onClick={() => setActiveTab('agents')}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${activeTab === 'agents' ? 'bg-[#4a6b82]/10 text-[#4a6b82] border border-[#4a6b82]/20' : 'text-stone-600 hover:bg-stone-200/60 hover:text-stone-900 border border-transparent'}`}
            >
              <Bot className="h-4 w-4" /> AI Agents & Memory
            </button>

            <button
              onClick={() => setActiveTab('integrations')}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${activeTab === 'integrations' ? 'bg-[#4a6b82]/10 text-[#4a6b82] border border-[#4a6b82]/20' : 'text-stone-600 hover:bg-stone-200/60 hover:text-stone-900 border border-transparent'}`}
            >
              <Layers className="h-4 w-4" /> Integrations
            </button>
          </nav>
        </div>

        {/* Diagnostic console seed tools */}
        <div className="space-y-3">
          <div className="p-2.5 bg-white border border-stone-200/80 rounded-xl text-[10px] text-stone-500">
            <span className="block text-stone-400 font-bold mb-1">Service Status:</span>
            <span className="truncate block font-mono font-medium text-stone-600">{seedingStatus || 'Connected'}</span>
          </div>

          <button
            onClick={runDatabaseSeed}
            className="w-full flex items-center justify-center gap-2 py-2 bg-[#4a6b82]/10 hover:bg-[#4a6b82]/15 border border-[#4a6b82]/20 text-[#4a6b82] text-xs font-bold rounded-lg transition-colors"
          >
            <Database className="h-3.5 w-3.5" /> Seed Database
          </button>
          
          <button
            onClick={onExitToLanding}
            className="w-full py-2 bg-white hover:bg-stone-55 text-stone-600 text-xs font-semibold rounded-lg transition-colors border border-stone-200"
          >
            Exit Console
          </button>
        </div>
      </aside>

      {/* MAIN VIEW CONTROLLER */}
      <main className="flex-1 flex flex-col bg-[#fbfaf7] overflow-hidden">
        
        {/* HEADER BAR */}
        <header className="px-6 py-4 border-b border-stone-200/80 bg-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h2 className="text-sm font-bold text-stone-850 capitalize">
              {activeTab === 'agents' ? 'AI Agents & Memory' : `${activeTab} Manager`}
            </h2>
            <span className="text-stone-300 font-normal">|</span>
            <span className="text-[10px] font-mono text-[#4a6b82] tracking-wider uppercase font-semibold">Svachalit Core Engine</span>
          </div>

          {/* Active channels indicator */}
          <div className="flex items-center gap-2.5">
            <div className="flex items-center gap-1.5 bg-stone-50 px-2.5 py-1 rounded-lg border border-stone-200/80 text-[10px] text-stone-600 font-medium">
              <Phone className="h-3.5 w-3.5 text-emerald-600" />
              <span>WhatsApp</span>
            </div>
            <div className="flex items-center gap-1.5 bg-stone-50 px-2.5 py-1 rounded-lg border border-stone-200/80 text-[10px] text-stone-600 font-medium">
              <Instagram className="h-3.5 w-3.5 text-pink-600" />
              <span>Instagram</span>
            </div>
            <div className="flex items-center gap-1.5 bg-stone-50 px-2.5 py-1 rounded-lg border border-stone-200/80 text-[10px] text-stone-600 font-medium">
              <Facebook className="h-3.5 w-3.5 text-blue-600" />
              <span>Facebook</span>
            </div>
            <div className="flex items-center gap-1.5 bg-stone-50 px-2.5 py-1 rounded-lg border border-stone-200/80 text-[10px] text-stone-600 font-medium">
              <Phone className="h-3.5 w-3.5 text-orange-600" />
              <span>Voice Calls</span>
            </div>
          </div>
        </header>

        {/* VIEW TAB RENDERERS */}
        <div className="flex-1 overflow-hidden relative">
          
          {/* TAB 1: OVERVIEW METRICS */}
          {activeTab === 'dashboard' && (
            <div className="h-full overflow-y-auto p-6 space-y-6">
              
              {/* Top row cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div className="glass-panel p-4 rounded-xl space-y-2 relative">
                  <div className="absolute top-3 right-3 p-1.5 bg-[#4a6b82]/10 rounded-lg text-[#4a6b82]">
                    <Bot className="h-4 w-4" />
                  </div>
                  <span className="text-[10px] text-stone-400 block uppercase font-bold tracking-wider">AI Accuracy</span>
                  <h3 className="text-xl font-extrabold text-stone-850">98.4%</h3>
                  <p className="text-[9px] text-emerald-600 font-medium">Answers resolved cleanly</p>
                </div>

                <div className="glass-panel p-4 rounded-xl space-y-2 relative">
                  <div className="absolute top-3 right-3 p-1.5 bg-[#5f7a68]/10 rounded-lg text-[#5f7a68]">
                    <TrendingUp className="h-4 w-4" />
                  </div>
                  <span className="text-[10px] text-stone-400 block uppercase font-bold tracking-wider">Auto Handled</span>
                  <h3 className="text-xl font-extrabold text-stone-850">87.2%</h3>
                  <p className="text-[9px] text-stone-500 font-medium">Conversations solved by assistant</p>
                </div>

                <div className="glass-panel p-4 rounded-xl space-y-2 relative">
                  <div className="absolute top-3 right-3 p-1.5 bg-amber-500/10 rounded-lg text-amber-600">
                    <User className="h-4 w-4" />
                  </div>
                  <span className="text-[10px] text-stone-400 block uppercase font-bold tracking-wider">Escalation Rate</span>
                  <h3 className="text-xl font-extrabold text-stone-850">12.8%</h3>
                  <p className="text-[9px] text-amber-600 animate-pulse-slow font-medium">Handoffs pending human agent</p>
                </div>

                <div className="glass-panel p-4 rounded-xl space-y-2 relative">
                  <div className="absolute top-3 right-3 p-1.5 bg-emerald-500/10 rounded-lg text-emerald-600">
                    <CheckCircle className="h-4 w-4" />
                  </div>
                  <span className="text-[10px] text-stone-400 block uppercase font-bold tracking-wider">Response Speed</span>
                  <h3 className="text-xl font-extrabold text-stone-850">1.8s</h3>
                  <p className="text-[9px] text-emerald-600 font-medium">Average response time</p>
                </div>
              </div>

              {/* Main SVG Area Chart & Heatmaps */}
              <div className="grid md:grid-cols-12 gap-6">
                
                {/* SVG Area Chart */}
                <div className="md:col-span-8 glass-panel p-6 rounded-xl space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-xs font-bold text-stone-800">Conversation Volume (Last 7 Days)</h3>
                    <span className="text-[10px] text-[#4a6b82] font-mono font-medium">Real-time sync active</span>
                  </div>
                  {/* Custom SVG line/area graph */}
                  <div className="w-full h-48 bg-stone-50/50 rounded-lg relative overflow-hidden flex items-end border border-stone-100">
                    <svg className="w-full h-full" viewBox="0 0 500 150" preserveAspectRatio="none">
                      {/* Grid Lines */}
                      <line x1="0" y1="30" x2="500" y2="30" stroke="rgba(0,0,0,0.03)" strokeWidth="1" />
                      <line x1="0" y1="75" x2="500" y2="75" stroke="rgba(0,0,0,0.03)" strokeWidth="1" />
                      <line x1="0" y1="120" x2="500" y2="120" stroke="rgba(0,0,0,0.03)" strokeWidth="1" />
                      
                      {/* Gradient Fill */}
                      <defs>
                        <linearGradient id="chartGlow" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="rgba(74, 107, 130, 0.18)" />
                          <stop offset="100%" stopColor="rgba(74, 107, 130, 0.0)" />
                        </linearGradient>
                      </defs>

                      {/* Area Fill */}
                      <path 
                        d="M0,150 L0,120 Q80,90 160,110 T320,60 T440,30 L500,45 L500,150 Z" 
                        fill="url(#chartGlow)"
                      />

                      {/* Line */}
                      <path 
                        d="M0,120 Q80,90 160,110 T320,60 T440,30 L500,45" 
                        fill="none" 
                        stroke="#4a6b82" 
                        strokeWidth="2" 
                      />

                      {/* Chart dots */}
                      <circle cx="160" cy="110" r="3.5" fill="#4a6b82" stroke="#ffffff" strokeWidth="1" />
                      <circle cx="320" cy="60" r="3.5" fill="#4a6b82" stroke="#ffffff" strokeWidth="1" />
                      <circle cx="440" cy="30" r="3.5" fill="#4a6b82" stroke="#ffffff" strokeWidth="1" />
                    </svg>

                    {/* X-Axis labels */}
                    <div className="absolute bottom-1 left-0 right-0 flex justify-between px-4 text-[9px] text-stone-400 font-mono">
                      <span>Mon</span>
                      <span>Tue</span>
                      <span>Wed</span>
                      <span>Thu</span>
                      <span>Fri</span>
                      <span>Sat</span>
                      <span>Sun</span>
                    </div>
                  </div>
                </div>

                {/* Heatmap Grid */}
                <div className="md:col-span-4 glass-panel p-6 rounded-xl space-y-4">
                  <h3 className="text-xs font-bold text-stone-800">Conversation Heatmap</h3>
                  <div className="grid grid-cols-7 gap-2">
                    {Array.from({ length: 28 }).map((_, idx) => {
                      const intensities = ['bg-[#4a6b82]/5', 'bg-[#4a6b82]/20', 'bg-[#4a6b82]/50', 'bg-[#4a6b82]/85'];
                      const randomIntensity = intensities[idx % 4];
                      return (
                        <div 
                          key={idx} 
                          className={`h-6 rounded-md ${randomIntensity} border border-white`}
                          title={`Hour ${idx} intensity`}
                        />
                      );
                    })}
                  </div>
                  <div className="flex justify-between text-[9px] text-stone-400 font-mono">
                    <span>Low Volume</span>
                    <span>High Volume</span>
                  </div>
                </div>

              </div>

              {/* Recent Activity Log & confidence metrics */}
              <div className="grid md:grid-cols-12 gap-6">
                
                {/* Recent Feed */}
                <div className="md:col-span-6 glass-panel p-6 rounded-xl space-y-4">
                  <h3 className="text-xs font-bold text-stone-800">Live Activity Feed</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center text-xs border-b border-stone-100 pb-2">
                      <span className="text-stone-600">Customer message received & processed</span>
                      <span className="text-[10px] font-mono text-stone-400">Just Now</span>
                    </div>
                    <div className="flex justify-between items-center text-xs border-b border-stone-100 pb-2">
                      <span className="text-stone-600">Secure memory search completed</span>
                      <span className="text-[10px] font-mono text-stone-400">2 min ago</span>
                    </div>
                    <div className="flex justify-between items-center text-xs border-b border-stone-100 pb-2">
                      <span className="text-stone-600">Calendar integration verified appointment slot</span>
                      <span className="text-[10px] font-mono text-[#4a6b82] font-semibold">5 min ago</span>
                    </div>
                  </div>
                </div>

                {/* Accuracy list */}
                <div className="md:col-span-6 glass-panel p-6 rounded-xl space-y-4">
                  <h3 className="text-xs font-bold text-stone-800">AI Confidence Scores</h3>
                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-stone-600">FAQ responses</span>
                        <span className="font-semibold text-stone-800">99.2%</span>
                      </div>
                      <div className="w-full bg-stone-100 h-1.5 rounded-full overflow-hidden">
                        <div className="bg-[#4a6b82] h-full w-[99%]" />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-stone-600">Appointment scheduling</span>
                        <span className="font-semibold text-stone-800">96.8%</span>
                      </div>
                      <div className="w-full bg-stone-100 h-1.5 rounded-full overflow-hidden">
                        <div className="bg-[#4a6b82] h-full w-[96%]" />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-stone-600">CRM database updates</span>
                        <span className="font-semibold text-stone-800">94.1%</span>
                      </div>
                      <div className="w-full bg-stone-100 h-1.5 rounded-full overflow-hidden">
                        <div className="bg-[#4a6b82] h-full w-[94%]" />
                      </div>
                    </div>
                  </div>
                </div>

              </div>

            </div>
          )}

          {/* TAB 2: LIVE INBOX (REDESIGNED 3-COLUMN LAYOUT) */}
          {activeTab === 'inbox' && (
            <div className="h-full flex overflow-hidden">
              
              {/* Column 1: Conversations List */}
              <section className="w-80 border-r border-stone-200/80 flex flex-col bg-white">
                {/* Search */}
                <div className="p-4 border-b border-stone-100 bg-[#fdfdfc]/50">
                  <div className="relative">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-stone-400" />
                    <input
                      type="text"
                      placeholder="Search conversations..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-9 pr-4 py-2 text-xs bg-stone-50 border border-stone-200/80 rounded-lg text-stone-800 placeholder-stone-400 focus:outline-none focus:bg-white focus:border-[#4a6b82] transition-colors"
                    />
                  </div>
                </div>

                {/* Filters */}
                <div className="px-4 py-2.5 border-b border-stone-100 flex flex-wrap gap-1 bg-stone-50/30">
                  {['ALL', 'WHATSAPP', 'INSTAGRAM', 'FACEBOOK', 'VOICE'].map(ch => (
                    <button
                      key={ch}
                      onClick={() => setChannelFilter(ch)}
                      className={`px-2 py-1 text-[10px] font-bold rounded-md transition-all ${channelFilter === ch ? 'bg-[#4a6b82] text-white font-semibold' : 'text-stone-500 hover:text-stone-800 hover:bg-stone-100/50'}`}
                    >
                      {ch === 'ALL' ? 'All' : ch}
                    </button>
                  ))}
                </div>

                <div className="px-4 py-2 border-b border-stone-100 flex gap-2 justify-between bg-[#fdfdfc]/30">
                  <button
                    onClick={() => setStatusFilter('ALL')}
                    className={`flex-1 py-1 text-[10px] font-bold text-center rounded-md transition-colors ${statusFilter === 'ALL' ? 'bg-stone-100 text-stone-800 font-semibold' : 'text-stone-550 hover:text-stone-800 hover:bg-stone-100/40'}`}
                  >
                    All Status
                  </button>
                  <button
                    onClick={() => setStatusFilter('HUMAN_PENDING')}
                    className={`flex-1 py-1 text-[10px] font-bold text-center rounded-md flex items-center justify-center gap-1 transition-colors ${statusFilter === 'HUMAN_PENDING' ? 'bg-amber-50 text-amber-700 border border-amber-200/60 font-semibold' : 'text-stone-550 hover:text-stone-800 border border-transparent'}`}
                  >
                    <AlertTriangle className="h-3 w-3" /> Agent
                  </button>
                  <button
                    onClick={() => setStatusFilter('AI_MANAGED')}
                    className={`flex-1 py-1 text-[10px] font-bold text-center rounded-md flex items-center justify-center gap-1 transition-colors ${statusFilter === 'AI_MANAGED' ? 'bg-[#4a6b82]/10 text-[#4a6b82] border border-[#4a6b82]/20 font-semibold' : 'text-stone-550 hover:text-stone-800 border border-transparent'}`}
                  >
                    <Bot className="h-3 w-3" /> AI Active
                  </button>
                </div>

                {/* List area */}
                <div className="flex-1 overflow-y-auto divide-y divide-stone-100">
                  {filteredConversations.length === 0 ? (
                    <div className="p-8 text-center text-xs text-stone-400 flex flex-col items-center gap-2">
                      <MessageSquare className="h-8 w-8 text-stone-300" />
                      No conversations found
                    </div>
                  ) : (
                    filteredConversations.map(conv => {
                      const isActive = selectedConvId === conv.id;
                      const lastMsg = conv.messages && conv.messages[0];
                      const isPending = conv.status === 'HUMAN_PENDING';

                      return (
                        <div
                          key={conv.id}
                          onClick={() => setSelectedConvId(conv.id)}
                          className={`p-4 cursor-pointer relative transition-all border-l-2 ${isActive ? 'bg-[#4a6b82]/5 border-[#4a6b82]' : isPending ? 'bg-amber-50/20 hover:bg-stone-50/50 border-amber-500' : 'hover:bg-stone-50/50 border-transparent'}`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center gap-1.5">
                              {getChannelIcon(conv.channel)}
                              <span className="font-bold text-xs truncate max-w-[120px] text-stone-800">
                                {conv.customer.name || 'Anonymous'}
                              </span>
                            </div>
                            <span className="text-[9px] text-stone-400 font-medium">
                              {new Date(conv.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>

                          <p className="text-[11px] text-stone-500 truncate max-w-[200px] mb-2 font-medium">
                            {lastMsg ? lastMsg.body : 'No messages'}
                          </p>

                          <div className="flex items-center justify-between">
                            <span className="text-[8px] tracking-wider text-stone-400 font-bold uppercase font-mono">{conv.channel}</span>
                            {isPending ? (
                              <span className="flex items-center gap-1 text-[9px] px-1.5 py-0.5 rounded-md bg-amber-50 text-amber-700 font-semibold border border-amber-200/60">
                                <span className="h-1 w-1 rounded-full bg-amber-500"></span> AGENT TAKE-OVER
                              </span>
                            ) : (
                              <span className="flex items-center gap-1 text-[9px] px-1.5 py-0.5 rounded-md bg-[#5f7a68]/10 text-[#5f7a68] font-semibold border border-[#5f7a68]/20">
                                <span className="h-1 w-1 rounded-full bg-[#5f7a68]"></span> AI AUTO
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </section>

              {/* Column 2: Live chat thread */}
              <section className="flex-1 flex flex-col bg-[#fcfbfa] border-r border-stone-200/80">
                {activeConversation ? (
                  <>
                    {/* Header */}
                    <div className="px-6 py-4 border-b border-stone-200/80 bg-white flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-stone-50 rounded-full border border-stone-200/80">
                          {getChannelIcon(activeConversation.channel)}
                        </div>
                        <div>
                          <h3 className="text-xs font-bold text-stone-850">{activeConversation.customer.name || 'Anonymous User'}</h3>
                          <span className="text-[10px] text-stone-400 uppercase font-mono font-bold">{activeConversation.channel} Channel</span>
                        </div>
                      </div>

                      {/* Toggles */}
                      <div className="flex items-center gap-2">
                        {activeConversation.status === 'AI_MANAGED' ? (
                          <button
                            onClick={() => toggleAutomationStatus('HUMAN_PENDING')}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-amber-50 hover:bg-amber-100/80 text-amber-700 border border-amber-200/60 rounded-md transition-all font-semibold"
                          >
                            <ArrowRightLeft className="h-3.5 w-3.5" /> Pause AI responder
                          </button>
                        ) : (
                          <button
                            onClick={() => toggleAutomationStatus('AI_MANAGED')}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-[#4a6b82]/10 hover:bg-[#4a6b82]/15 text-[#4a6b82] border border-[#4a6b82]/20 rounded-md transition-all font-semibold"
                          >
                            <Bot className="h-3.5 w-3.5" /> Resume AI responder
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Chat logs area */}
                    <div className="flex-1 overflow-y-auto p-6 space-y-4">
                      {activeConversation.messages.map((msg, index) => {
                        const isAgent = msg.senderType === 'AGENT';
                        const isAI = msg.senderType === 'AI';
                        const isCustomer = msg.senderType === 'CUSTOMER';

                        return (
                          <div key={msg.id || index} className={`flex ${isCustomer ? 'justify-start' : 'justify-end'}`}>
                            <div className={`max-w-[75%] rounded-lg p-3 text-xs leading-relaxed border ${
                              isCustomer
                                ? 'bg-white border-stone-200 text-stone-850 shadow-sm'
                                : isAI
                                  ? 'bg-[#e2e8e4] border-[#5f7a68]/20 text-[#1c1d21] shadow-sm'
                                  : 'bg-[#eae8e0] border-stone-300 text-stone-850 shadow-sm'
                            }`}>
                              <div className="flex items-center gap-1.5 mb-1.5 text-[9px] font-bold text-stone-500">
                                {isCustomer && <User className="h-3 w-3 text-stone-400" />}
                                {isAI && <Bot className="h-3 w-3 text-[#5f7a68]" />}
                                {isAgent && <User className="h-3 w-3 text-[#4a6b82]" />}
                                <span className="uppercase">{isCustomer ? 'Customer' : isAI ? 'AI' : 'Agent'}</span>
                                <span className="text-stone-400 font-normal">
                                  {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                              </div>
                              <p className="font-medium text-stone-800">{msg.body}</p>
                              {msg.metadata?.toolCallsTriggered && (
                                <div className="mt-2 pt-1 border-t border-stone-200/50 text-[9px] text-[#4a6b82] font-mono flex items-center gap-1">
                                  <Sparkles className="h-2.5 w-2.5" /> Triggered automation
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                      <div ref={chatEndRef} />
                    </div>

                    {/* Send box */}
                    <form onSubmit={handleSendMessage} className="p-4 border-t border-stone-200/80 bg-white">
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder={activeConversation.status === 'AI_MANAGED' ? 'Responding pauses AI automations...' : 'Type message response...'}
                          value={replyText}
                          onChange={(e) => setReplyText(e.target.value)}
                          className="flex-1 px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-xs text-stone-800 placeholder-stone-400 focus:outline-none focus:bg-white focus:border-[#4a6b82] transition-colors"
                        />
                        <button type="submit" className="p-2.5 bg-[#4a6b82] hover:bg-[#385265] rounded-lg text-white transition-colors">
                          <Send className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </form>
                  </>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center text-stone-400 text-xs gap-3">
                    <MessageSquare className="h-8 w-8 text-stone-300 animate-pulse-slow" />
                    <span className="font-medium">Select a thread from sidebar list</span>
                  </div>
                )}
              </section>

              {/* Column 3: CRM Profile details & overrides */}
              <section className="w-80 p-6 overflow-y-auto space-y-6 bg-white">
                {activeConversation ? (
                  <div className="space-y-6">
                    <div>
                      <h4 className="text-[10px] font-bold uppercase tracking-wider text-stone-400 mb-3">Customer Profile</h4>
                      <div className="p-4 rounded-xl bg-stone-50/50 border border-stone-200/80 space-y-3">
                        <div>
                          <span className="text-[9px] text-stone-400 block font-bold uppercase tracking-wider">Name</span>
                          <span className="text-xs font-semibold text-stone-800">{activeConversation.customer.name || 'Anonymous'}</span>
                        </div>
                        <div>
                          <span className="text-[9px] text-stone-400 block font-bold uppercase tracking-wider">Phone</span>
                          <span className="text-xs font-semibold text-stone-800">{activeConversation.customer.phone || 'N/A'}</span>
                        </div>
                        <div>
                          <span className="text-[9px] text-stone-400 block font-bold uppercase tracking-wider">Email</span>
                          <span className="text-xs font-semibold text-stone-800">{activeConversation.customer.email || 'None Captured'}</span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="text-[10px] font-bold uppercase tracking-wider text-stone-400 mb-3">Workspace CRM Details</h4>
                      <div className="p-4 rounded-xl bg-stone-50/50 border border-stone-200/80 space-y-3">
                        <div className="flex items-start gap-2.5 text-xs">
                          <Calendar className="h-4 w-4 text-[#4a6b82] mt-0.5 shrink-0" />
                          <div>
                            <span className="text-[9px] text-stone-400 block font-bold uppercase tracking-wider">Meeting Scheduled</span>
                            <span className="text-[11px] font-semibold text-stone-700">
                              {activeConversation.customer.metadata?.appointmentDate 
                                ? new Date(activeConversation.customer.metadata.appointmentDate).toLocaleString() 
                                : 'No appointment recorded'}
                            </span>
                          </div>
                        </div>
                        
                        <div className="flex items-start gap-2.5 pt-2 border-t border-stone-200/50 text-xs">
                          <Database className="h-4 w-4 text-[#4a6b82] mt-0.5 shrink-0" />
                          <div>
                            <span className="text-[9px] text-stone-400 block font-bold uppercase tracking-wider">CRM Sink Status</span>
                            <span className="text-[11px] font-semibold text-stone-700">
                              {activeConversation.customer.metadata?.exportedToSheet ? (
                                <span className="text-emerald-600 flex items-center gap-1 font-bold">
                                  <CheckCircle className="h-3.5 w-3.5" /> Synced to CRM
                                </span>
                              ) : (
                                <span className="text-stone-400">Unsaved Lead</span>
                              )}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center text-stone-400 text-xs py-12 font-medium">Select thread to view logs</div>
                )}
              </section>

            </div>
          )}

          {/* TAB 3: ENTERPRISE ANALYTICS DETAIL PANEL */}
          {activeTab === 'analytics' && (
            <div className="h-full overflow-y-auto p-6 space-y-6 pb-24">
              
              {/* Header section */}
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                  <h3 className="font-bold text-base text-stone-850">Enterprise ROI & Sales Diagnostics</h3>
                  <p className="text-xs text-stone-500">Real-time business performance, conversion rates, and cost containment metrics.</p>
                </div>
                <div className="flex gap-2">
                  <span className="text-[10px] font-mono px-2.5 py-1 bg-stone-50 border border-stone-200 text-stone-600 rounded-lg">
                    Database: Active (SSE Streamed)
                  </span>
                  <span className="text-[10px] font-mono px-2.5 py-1 bg-[#4a6b82]/10 text-[#4a6b82] border border-[#4a6b82]/20 rounded-lg font-bold">
                    Target ARR: $1,494,000
                  </span>
                </div>
              </div>

              {/* 4 Enterprise KPI Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                
                {/* Sales Pipeline */}
                <div className="glass-panel p-5 rounded-xl space-y-3 relative hover:border-stone-300 transition-all">
                  <div className="absolute top-4 right-4 p-2 bg-emerald-50 rounded-lg text-emerald-600">
                    <DollarSign className="h-4 w-4" />
                  </div>
                  <span className="text-[10px] text-stone-400 block uppercase font-bold tracking-wider">Sales Pipeline</span>
                  <div>
                    <h3 className="text-2xl font-bold text-stone-850">$124,500</h3>
                    <p className="text-[10px] text-emerald-600 flex items-center gap-1 mt-1 font-semibold">
                      <TrendingUp className="h-3 w-3" /> +14.2% MoM ARR growth
                    </p>
                  </div>
                </div>

                {/* Automated Bookings */}
                <div className="glass-panel p-5 rounded-xl space-y-3 relative hover:border-stone-300 transition-all">
                  <div className="absolute top-4 right-4 p-2 bg-[#4a6b82]/10 rounded-lg text-[#4a6b82]">
                    <Calendar className="h-4 w-4" />
                  </div>
                  <span className="text-[10px] text-stone-400 block uppercase font-bold tracking-wider">Automated Bookings</span>
                  <div>
                    <h3 className="text-2xl font-bold text-stone-850">342 slots</h3>
                    <p className="text-[10px] text-[#4a6b82] flex items-center gap-1 mt-1 font-semibold">
                      <TrendingUp className="h-3 w-3" /> +18.5% booking containment
                    </p>
                  </div>
                </div>

                {/* Hours Saved */}
                <div className="glass-panel p-5 rounded-xl space-y-3 relative hover:border-stone-300 transition-all">
                  <div className="absolute top-4 right-4 p-2 bg-blue-50 rounded-lg text-blue-600">
                    <Briefcase className="h-4 w-4" />
                  </div>
                  <span className="text-[10px] text-stone-400 block uppercase font-bold tracking-wider">Hours Reclaimed</span>
                  <div>
                    <h3 className="text-2xl font-bold text-stone-850">1,280 hours</h3>
                    <p className="text-[10px] text-blue-600 flex items-center gap-1 mt-1 font-semibold">
                      85.4% support efficiency rate
                    </p>
                  </div>
                </div>

                {/* CSAT Rating */}
                <div className="glass-panel p-5 rounded-xl space-y-3 relative hover:border-stone-300 transition-all">
                  <div className="absolute top-4 right-4 p-2 bg-amber-50 rounded-lg text-amber-600">
                    <CheckCircle className="h-4 w-4" />
                  </div>
                  <span className="text-[10px] text-stone-400 block uppercase font-bold tracking-wider">Customer CSAT</span>
                  <div>
                    <h3 className="text-2xl font-bold text-stone-850">4.85 / 5.0</h3>
                    <p className="text-[10px] text-amber-600 flex items-center gap-1 mt-1 font-semibold">
                      Based on 1,420 post-chat ratings
                    </p>
                  </div>
                </div>
              </div>

              {/* 2 custom responsive SVG charts */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                {/* SVG Revenue Growth Line Chart */}
                <div className="lg:col-span-8 glass-panel p-6 rounded-xl space-y-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <h4 className="font-bold text-xs text-stone-850">Pipeline Revenue Growth (Last 30 Days)</h4>
                      <p className="text-[10px] text-stone-400">Incremental revenue qualified and booked by Svachalit AI.</p>
                    </div>
                    <span className="text-[10px] text-[#4a6b82] font-mono font-semibold">+14.2% MoM</span>
                  </div>
                  
                  {/* Inline Responsive SVG Line/Area Graph */}
                  <div className="w-full h-56 bg-stone-50/50 rounded-lg relative overflow-hidden flex flex-col justify-end border border-stone-100">
                    <svg className="w-full h-full" viewBox="0 0 600 180" preserveAspectRatio="none">
                      {/* Grid Lines */}
                      <line x1="0" y1="36" x2="600" y2="36" stroke="rgba(0,0,0,0.02)" strokeWidth="1" />
                      <line x1="0" y1="72" x2="600" y2="72" stroke="rgba(0,0,0,0.02)" strokeWidth="1" />
                      <line x1="0" y1="108" x2="600" y2="108" stroke="rgba(0,0,0,0.02)" strokeWidth="1" />
                      <line x1="0" y1="144" x2="600" y2="144" stroke="rgba(0,0,0,0.02)" strokeWidth="1" />
                      
                      {/* Chart Glow Gradient */}
                      <defs>
                        <linearGradient id="revenueGlow" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="rgba(74, 107, 130, 0.15)" />
                          <stop offset="100%" stopColor="rgba(74, 107, 130, 0.0)" />
                        </linearGradient>
                      </defs>

                      {/* Area Fill path */}
                      <path 
                        d="M 0 160 L 0 140 Q 60 135 120 120 T 240 100 T 360 70 T 480 50 L 600 35 L 600 160 Z" 
                        fill="url(#revenueGlow)"
                      />

                      {/* Line path */}
                      <path 
                        d="M 0 140 Q 60 135 120 120 T 240 100 T 360 70 T 480 50 L 600 35" 
                        fill="none" 
                        stroke="#4a6b82" 
                        strokeWidth="2" 
                      />

                      {/* Chart Dots for key checkpoints */}
                      <circle cx="120" cy="120" r="3" fill="#4a6b82" stroke="#ffffff" strokeWidth="1" />
                      <circle cx="240" cy="100" r="3" fill="#4a6b82" stroke="#ffffff" strokeWidth="1" />
                      <circle cx="360" cy="70" r="3" fill="#4a6b82" stroke="#ffffff" strokeWidth="1" />
                      <circle cx="480" cy="50" r="3" fill="#4a6b82" stroke="#ffffff" strokeWidth="1" />
                      <circle cx="600" cy="35" r="3" fill="#4a6b82" stroke="#ffffff" strokeWidth="1" />
                    </svg>

                    {/* Y-Axis scale label markers */}
                    <div className="absolute top-2 left-3 flex flex-col justify-between h-40 text-[9px] text-stone-400 font-mono pointer-events-none">
                      <span>$125k</span>
                      <span>$100k</span>
                      <span>$75k</span>
                      <span>$50k</span>
                      <span>$25k</span>
                    </div>

                    {/* X-Axis labels */}
                    <div className="flex justify-between px-6 py-2 border-t border-stone-200/50 bg-[#faf9f5]/80 text-[9px] text-stone-400 font-mono">
                      <span>Day 1</span>
                      <span>Day 5</span>
                      <span>Day 10</span>
                      <span>Day 15</span>
                      <span>Day 20</span>
                      <span>Day 25</span>
                      <span>Day 30</span>
                    </div>
                  </div>
                </div>

                {/* SVG Conversions by Channel Chart */}
                <div className="lg:col-span-4 glass-panel p-6 rounded-xl space-y-4 flex flex-col justify-between">
                  <div>
                    <h4 className="font-bold text-xs text-stone-850">Channel Conversions</h4>
                    <p className="text-[10px] text-stone-400">Conversions qualified per communication stream.</p>
                  </div>
                  
                  {/* Custom SVG Bar Chart */}
                  <div className="space-y-4 my-2">
                    
                    {/* WhatsApp */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-[10px]">
                        <span className="flex items-center gap-1.5 font-bold text-stone-650">
                          <Phone className="h-3 w-3 text-emerald-600" /> WhatsApp
                        </span>
                        <span className="font-mono text-stone-500 font-semibold">45% (154 slots)</span>
                      </div>
                      <div className="w-full bg-stone-100 h-2 rounded-full overflow-hidden border border-stone-200/40">
                        <div className="bg-emerald-500/80 h-full rounded-full" style={{ width: '45%' }} />
                      </div>
                    </div>

                    {/* Instagram */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-[10px]">
                        <span className="flex items-center gap-1.5 font-bold text-stone-650">
                          <Instagram className="h-3 w-3 text-pink-600" /> Instagram
                        </span>
                        <span className="font-mono text-stone-500 font-semibold">30% (103 slots)</span>
                      </div>
                      <div className="w-full bg-stone-100 h-2 rounded-full overflow-hidden border border-stone-200/40">
                        <div className="bg-pink-500/80 h-full rounded-full" style={{ width: '30%' }} />
                      </div>
                    </div>

                    {/* Facebook */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-[10px]">
                        <span className="flex items-center gap-1.5 font-bold text-stone-650">
                          <Facebook className="h-3 w-3 text-blue-600" /> Facebook
                        </span>
                        <span className="font-mono text-stone-500 font-semibold">15% (51 slots)</span>
                      </div>
                      <div className="w-full bg-stone-100 h-2 rounded-full overflow-hidden border border-stone-200/40">
                        <div className="bg-blue-500/80 h-full rounded-full" style={{ width: '15%' }} />
                      </div>
                    </div>

                    {/* Inbound Voice */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-[10px]">
                        <span className="flex items-center gap-1.5 font-bold text-stone-650">
                          <Phone className="h-3 w-3 text-orange-655" /> Inbound Voice
                        </span>
                        <span className="font-mono text-stone-500 font-semibold">10% (34 slots)</span>
                      </div>
                      <div className="w-full bg-stone-100 h-2 rounded-full overflow-hidden border border-stone-200/40">
                        <div className="bg-orange-500/80 h-full rounded-full" style={{ width: '10%' }} />
                      </div>
                    </div>

                  </div>

                  <div className="pt-3 border-t border-stone-100 text-center">
                    <p className="text-[10px] text-stone-400 font-medium">Svachalit automates booking events across all channels.</p>
                  </div>
                </div>

              </div>

              {/* Conversion Funnel & ROI Savings Section */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* Funnel chart card */}
                <div className="glass-panel p-6 rounded-xl space-y-4">
                  <div>
                    <h4 className="font-bold text-xs text-stone-850">Qualifying & Booking Sales Funnel</h4>
                    <p className="text-[10px] text-stone-400">How inbound customer messages flow into booked meetings.</p>
                  </div>

                  <div className="space-y-3 pt-2">
                    {/* Funnel Stage 1 */}
                    <div className="flex items-center gap-4 bg-stone-50/50 p-3 rounded-lg border border-stone-200/50 hover:border-stone-300 transition-all">
                      <div className="w-14 text-center shrink-0 font-mono text-[10px] text-[#4a6b82] font-bold bg-[#4a6b82]/10 border border-[#4a6b82]/20 px-1.5 py-0.5 rounded">
                        100%
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between items-center text-xs font-bold text-stone-800">
                          <span>Total Inbound Chats</span>
                          <span>8,432 messages</span>
                        </div>
                        <p className="text-[10px] text-stone-500">Inbound chats initiated on WhatsApp, DMs, or voice transcripts.</p>
                      </div>
                    </div>

                    {/* Funnel Stage 2 */}
                    <div className="flex items-center gap-4 bg-stone-50/50 p-3 rounded-lg border border-stone-200/50 hover:border-stone-300 transition-all">
                      <div className="w-14 text-center shrink-0 font-mono text-[10px] text-[#4a6b82] font-bold bg-[#4a6b82]/10 border border-[#4a6b82]/20 px-1.5 py-0.5 rounded">
                        66.5%
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between items-center text-xs font-bold text-stone-800">
                          <span>AI Qualified Leads</span>
                          <span>5,612 leads</span>
                        </div>
                        <p className="text-[10px] text-stone-500">AI successfully qualified customer details, budgets, or interests.</p>
                      </div>
                    </div>

                    {/* Funnel Stage 3 */}
                    <div className="flex items-center gap-4 bg-stone-50/50 p-3 rounded-lg border border-stone-200/50 hover:border-stone-300 transition-all">
                      <div className="w-14 text-center shrink-0 font-mono text-[10px] text-[#4a6b82] font-bold bg-[#4a6b82]/10 border border-[#4a6b82]/20 px-1.5 py-0.5 rounded">
                        38.4%
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between items-center text-xs font-bold text-stone-800">
                          <span>CRM Profiles Synced</span>
                          <span>3,240 rows</span>
                        </div>
                        <p className="text-[10px] text-stone-500">Lead records automatically pushed to Google Sheets or webhooks.</p>
                      </div>
                    </div>

                    {/* Funnel Stage 4 */}
                    <div className="flex items-center gap-4 bg-[#4a6b82]/5 p-3 rounded-lg border border-[#4a6b82]/20 hover:border-[#4a6b82]/30 transition-all">
                      <div className="w-14 text-center shrink-0 font-mono text-[10px] text-emerald-700 font-bold bg-emerald-50 border border-emerald-200/50 px-1.5 py-0.5 rounded">
                        4.1%
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between items-center text-xs font-bold text-stone-800">
                          <span>Successful Appt. Bookings</span>
                          <span>342 slots secured</span>
                        </div>
                        <p className="text-[10px] text-[#4a6b82] font-medium">High-value calendar slots reserved directly by AI assistant logic.</p>
                      </div>
                    </div>

                  </div>
                </div>

                {/* Cost Savings Analysis Card */}
                <div className="glass-panel p-6 rounded-xl space-y-5 flex flex-col justify-between">
                  <div>
                    <h4 className="font-bold text-xs text-stone-850">Automated Cost Savings & ROI</h4>
                    <p className="text-[10px] text-stone-400">Savings calculated based on reclaimed support workflows.</p>
                  </div>

                  <div className="space-y-4 my-2">
                    {/* Manual agent cost */}
                    <div className="flex items-center justify-between p-3.5 bg-stone-50/50 rounded-lg border border-stone-200/50">
                      <div>
                        <span className="text-[10px] text-stone-400 block uppercase font-bold">Manual Agent Estimate</span>
                        <span className="text-xs text-stone-500 mt-1 block">1,280 hours × $10.00/hour</span>
                      </div>
                      <span className="text-sm font-semibold text-stone-700 font-mono">$12,800.00 / mo</span>
                    </div>

                    {/* Svachalit cost */}
                    <div className="flex items-center justify-between p-3.5 bg-[#4a6b82]/5 rounded-lg border border-[#4a6b82]/20">
                      <div>
                        <span className="text-[10px] text-[#4a6b82] block uppercase font-bold">Svachalit Managed cost</span>
                        <span className="text-xs text-stone-550 mt-1 block">Flat Subscription (Unlimited Messages)</span>
                      </div>
                      <span className="text-sm font-semibold text-[#4a6b82] font-mono">$49.00 / mo</span>
                    </div>

                    {/* Net Savings */}
                    <div className="flex items-center justify-between p-4 bg-emerald-50 rounded-lg border border-emerald-250/30">
                      <div>
                        <span className="text-[10px] text-emerald-700 block uppercase font-extrabold tracking-wider">Net Monthly Reclaimed</span>
                        <span className="text-xs text-emerald-650 mt-1 block font-medium">99.6% Reduction in Operating Cost</span>
                      </div>
                      <span className="text-lg font-bold text-emerald-600 font-mono">$12,751.00 / mo</span>
                    </div>
                  </div>

                  <div className="p-3 bg-stone-50/60 rounded-xl text-[10px] text-stone-500 text-center border border-stone-200/60">
                    💡 **ROI Multiplier**: Every $1 invested in Svachalit yields **$260.22** in operational savings.
                  </div>
                </div>

              </div>

            </div>
          )}

          {/* TAB 4: WORKFLOW SCHEMATIC */}
          {activeTab === 'workflows' && (
            <div className="h-full p-6 flex flex-col gap-6 overflow-y-auto">
              <h3 className="font-bold text-sm text-stone-850">Active Workflow Visualizer</h3>
              
              <div className="flex-1 bg-white rounded-xl border border-stone-200/80 p-6 flex flex-col justify-center items-center gap-8 relative overflow-hidden shadow-sm">
                <div className="absolute inset-0 grid-bg opacity-40 pointer-events-none" />
                
                {/* Node 1 */}
                <div className="flex items-center gap-4 bg-white border border-stone-250/70 px-4 py-2.5 rounded-xl w-72 shadow-sm z-10">
                  <div className="p-2 bg-[#4a6b82]/10 rounded-lg text-[#4a6b82]">
                    <Globe className="h-4 w-4" />
                  </div>
                  <div className="text-left">
                    <h4 className="font-bold text-xs text-stone-800">1. Inbound Ingress Webhook</h4>
                    <p className="text-[9px] text-stone-400 font-mono">Meta API standardizer</p>
                  </div>
                </div>

                <div className="h-6 w-0.5 bg-[#4a6b82]/40" />

                {/* Node 2 */}
                <div className="flex items-center gap-4 bg-white border border-stone-250/70 px-4 py-2.5 rounded-xl w-72 shadow-sm z-10">
                  <div className="p-2 bg-[#4a6b82]/10 rounded-lg text-[#4a6b82]">
                    <Database className="h-4 w-4" />
                  </div>
                  <div className="text-left">
                    <h4 className="font-bold text-xs text-stone-800">2. Message Queue Buffer</h4>
                    <p className="text-[9px] text-stone-400 font-mono">Real-time processing queue</p>
                  </div>
                </div>

                <div className="h-6 w-0.5 bg-[#4a6b82]/40" />

                {/* Node 3 */}
                <div className="flex items-center gap-4 bg-[#4a6b82]/5 border border-[#4a6b82]/35 px-4 py-2.5 rounded-xl w-72 shadow-md z-10">
                  <div className="p-2 bg-[#4a6b82]/20 rounded-lg text-[#4a6b82]">
                    <Bot className="h-4 w-4 animate-float" />
                  </div>
                  <div className="text-left">
                    <h4 className="font-bold text-xs text-stone-850">3. Secure Business Memory</h4>
                    <p className="text-[9px] text-[#4a6b82] font-mono font-semibold">Semantic match & response</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: LEADS LIST */}
          {activeTab === 'leads' && (
            <div className="h-full overflow-y-auto p-6 space-y-6">
              <h3 className="font-bold text-sm text-stone-850">Unified Lead Records</h3>
              <div className="bg-white border border-stone-200/80 rounded-xl overflow-hidden shadow-sm">
                <table className="w-full text-left text-xs text-stone-600">
                  <thead className="bg-[#fdfdfc] border-b border-stone-200 text-stone-500 text-[10px] uppercase font-bold tracking-wider">
                    <tr>
                      <th className="p-4">Customer Name</th>
                      <th className="p-4">Phone</th>
                      <th className="p-4">Email</th>
                      <th className="p-4">Budget Goal</th>
                      <th className="p-4">CRM Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {conversations.map(conv => (
                      <tr key={conv.id} className="hover:bg-stone-50/50 transition-colors">
                        <td className="p-4 font-bold text-stone-800">{conv.customer.name || 'Anonymous'}</td>
                        <td className="p-4 font-medium">{conv.customer.phone || 'N/A'}</td>
                        <td className="p-4 font-medium">{conv.customer.email || 'N/A'}</td>
                        <td className="p-4 font-mono font-medium text-[#4a6b82]">{conv.customer.metadata?.budget || 'N/A'}</td>
                        <td className="p-4 font-semibold">
                          {conv.customer.metadata?.exportedToSheet ? (
                            <span className="text-emerald-600">Synced</span>
                          ) : (
                            <span className="text-stone-400">Pending Sync</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 6: INTEGRATIONS */}
          {activeTab === 'integrations' && (
            <div className="h-full overflow-y-auto p-6 space-y-6">
              <h3 className="font-bold text-sm text-stone-850">Channel Integration Links</h3>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="glass-panel p-6 rounded-xl flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Phone className="h-6 w-6 text-emerald-600" />
                    <div>
                      <h4 className="font-bold text-xs text-stone-850">Meta WhatsApp Cloud</h4>
                      <p className="text-[10px] text-stone-500">Link credentials and page credentials</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-full border border-emerald-200/50">CONNECTED</span>
                </div>

                <div className="glass-panel p-6 rounded-xl flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Instagram className="h-6 w-6 text-pink-600" />
                    <div>
                      <h4 className="font-bold text-xs text-stone-850">Instagram DM API</h4>
                      <p className="text-[10px] text-stone-500">Direct page messages automation</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-full border border-emerald-200/50">CONNECTED</span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 7: AI AGENTS SETUP */}
          {activeTab === 'agents' && (
            <div className="h-full overflow-y-auto p-6 space-y-6">
              <h3 className="font-bold text-sm text-stone-850">AI Prompt Persona & Secure Business Memory</h3>
              <div className="space-y-4">
                <div className="glass-panel p-6 rounded-xl space-y-3">
                  <h4 className="font-bold text-xs text-stone-850">System Instruction Prompt</h4>
                  <textarea 
                    value="You are a helpful, professional AI business automation assistant representing Acme Corp. ONLY answer using provided Knowledge Base. If unknown, transfer to human agent."
                    readOnly
                    className="w-full h-24 bg-stone-50 border border-stone-200 rounded-lg p-3 text-xs text-stone-700 font-mono focus:outline-none font-medium"
                  />
                </div>

                <div className="glass-panel p-6 rounded-xl space-y-3">
                  <h4 className="font-bold text-xs text-stone-850">Business Memory (Document Chunks)</h4>
                  <div className="space-y-2 text-xs">
                    <div className="p-3 bg-stone-50/50 border border-stone-200/50 rounded-lg text-stone-600">
                      <span className="font-bold text-stone-850 block mb-1">Pricing Plans</span>
                      Acme Corp offers three plans: Starter ($19/mo, 1000 messages), Growth ($49/mo, 5000 messages)...
                    </div>
                    <div className="p-3 bg-stone-50/50 border border-stone-200/50 rounded-lg text-stone-600">
                      <span className="font-bold text-stone-850 block mb-1">Opening Hours</span>
                      Our support desk is open Monday through Friday from 9:00 AM to 6:00 PM EST...
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>
      </main>

    </div>
>>>>>>> 765969bd30239688115f15de9bc845dfa0e7665c
  );
}

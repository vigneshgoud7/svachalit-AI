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
    <div className="min-h-screen bg-[#030303] text-zinc-100 overflow-x-hidden grid-bg relative selection:bg-indigo-500/30">
      <div className="absolute inset-0 grid-bg-glow pointer-events-none" />

      {/* Sticky Header */}
      <header className="sticky top-0 z-50 w-full border-b border-zinc-900 bg-zinc-950/65 backdrop-blur-md px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-indigo-600 rounded-lg text-white shadow-lg glow-primary">
            <Sparkles className="h-4 w-4" />
          </div>
          <div>
            <h1 className="text-md font-extrabold tracking-tight text-white">Svachalit</h1>
            <p className="text-[10px] text-zinc-500 tracking-wide font-mono">HYBRID RAG AI</p>
          </div>
        </div>

        {/* Desktop Navigation links */}
        <nav className="hidden md:flex items-center gap-8 text-xs font-semibold text-zinc-400">
          <a href="#features" className="hover:text-white transition-colors">Features</a>
          <a href="#demo" className="hover:text-white transition-colors">Interactive Demo</a>
          <a href="#workflow" className="hover:text-white transition-colors">Workflow</a>
          <a href="#pricing" className="hover:text-white transition-colors">Pricing</a>
        </nav>

        <div className="flex items-center gap-3">
          <button
            onClick={onLaunchDashboard}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-xs font-bold rounded-lg transition-all glow-primary active:scale-95 flex items-center gap-1.5"
          >
            Launch Console <ArrowRight className="h-3.5 w-3.5" />
          </button>
          
          {/* Mobile menu button */}
          <button 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)} 
            className="md:hidden p-2 text-zinc-400 hover:text-white border border-zinc-800 rounded-lg"
          >
            <Menu className="h-4 w-4" />
          </button>
        </div>
      </header>

      {/* Mobile Nav Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-zinc-800 bg-zinc-950 p-6 flex flex-col gap-4 text-sm font-semibold">
          <a href="#features" onClick={() => setMobileMenuOpen(false)} className="text-zinc-400 hover:text-white">Features</a>
          <a href="#demo" onClick={() => setMobileMenuOpen(false)} className="text-zinc-400 hover:text-white">Interactive Demo</a>
          <a href="#workflow" onClick={() => setMobileMenuOpen(false)} className="text-zinc-400 hover:text-white">Workflow</a>
          <a href="#pricing" onClick={() => setMobileMenuOpen(false)} className="text-zinc-400 hover:text-white">Pricing</a>
        </div>
      )}

      {/* HERO SECTION */}
      <section className="relative px-6 pt-20 pb-24 text-center max-w-4xl mx-auto flex flex-col items-center">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-950/40 border border-indigo-800/30 text-[10px] font-bold text-indigo-400 mb-6 tracking-wide animate-pulse-slow">
          <Zap className="h-3 w-3" /> SVACALIT V1.0 LIVE: OMNICHANNEL ENGINE
        </div>
        
        <h2 className="text-4xl md:text-6xl font-extrabold tracking-tight text-white mb-6 leading-tight max-w-3xl">
          Automate WhatsApp, Instagram & Facebook with <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-indigo-200 to-indigo-600">Hybrid RAG AI</span>
        </h2>
        
        <p className="text-sm md:text-base text-zinc-400 max-w-2xl mb-8 leading-relaxed">
          Svachalit helps businesses automate conversations using hallucination-resistant Hybrid RAG AI workflows. Run customer support, book slots, and qualify leads on autopilot.
        </p>

        <div className="flex flex-wrap justify-center gap-4 mb-16">
          <a 
            href="#pricing"
            className="px-6 py-3 bg-white text-zinc-950 hover:bg-zinc-100 text-xs font-bold rounded-lg transition-all active:scale-95 flex items-center gap-1.5 shadow-xl"
          >
            Start Free Trial
          </a>
          <a 
            href="#demo"
            className="px-6 py-3 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-xs font-semibold rounded-lg transition-all active:scale-95 flex items-center gap-1.5"
          >
            Watch Demo <Play className="h-3 w-3 text-indigo-400 fill-indigo-400" />
          </a>
          <button 
            onClick={onLaunchDashboard}
            className="px-6 py-3 bg-indigo-900/20 hover:bg-indigo-900/35 border border-indigo-500/20 text-xs font-semibold text-indigo-300 rounded-lg transition-all active:scale-95"
          >
            View Dashboard
          </button>
        </div>

        {/* Hero Visual Mockup */}
        <div className="w-full rounded-2xl border border-zinc-800 bg-zinc-950/60 p-2 overflow-hidden shadow-2xl relative">
          <div className="absolute -inset-px bg-gradient-to-tr from-indigo-500/20 to-transparent rounded-2xl -z-10 blur-xl" />
          <div className="h-6 w-full flex items-center gap-1.5 px-3 border-b border-zinc-900 bg-zinc-950/90 text-zinc-600 text-xs">
            <span className="h-2 w-2 rounded-full bg-red-500/50"></span>
            <span className="h-2 w-2 rounded-full bg-yellow-500/50"></span>
            <span className="h-2 w-2 rounded-full bg-green-500/50"></span>
            <span className="ml-2 font-mono text-[9px] text-zinc-500">svachalit-console.cloud</span>
          </div>
          <div className="bg-[#08080d] p-4 h-64 md:h-96 flex overflow-hidden rounded-b-xl">
            {/* Sidebar list mock */}
            <div className="w-1/4 border-r border-zinc-900/70 hidden md:flex flex-col gap-2 p-2">
              <div className="h-6 bg-zinc-900 rounded animate-pulse" />
              <div className="h-6 bg-zinc-900 rounded animate-pulse w-3/4" />
              <div className="h-10 bg-indigo-950/20 border border-indigo-800/20 rounded mt-4" />
              <div className="h-10 bg-zinc-900/40 rounded" />
              <div className="h-10 bg-zinc-900/40 rounded" />
            </div>
            {/* Center Area */}
            <div className="flex-1 flex flex-col p-2">
              <div className="flex justify-between items-center pb-2 border-b border-zinc-900">
                <span className="h-4 bg-zinc-900 rounded w-1/3 animate-pulse" />
                <span className="h-5 px-2 bg-indigo-950 text-indigo-400 text-[9px] rounded-full border border-indigo-800/30">AI Active</span>
              </div>
              <div className="flex-1 flex flex-col gap-3 py-4 justify-end">
                <div className="bg-zinc-900 rounded-lg p-2 max-w-[60%] text-left text-[10px]">
                  How can I check pricing?
                </div>
                <div className="bg-indigo-950/30 border border-indigo-500/20 rounded-lg p-2 max-w-[65%] self-end text-left text-[10px]">
                  🔍 Checking database inventory pricing...
                </div>
                <div className="bg-indigo-950/40 border border-indigo-500/30 rounded-lg p-2 max-w-[65%] self-end text-left text-[10px]">
                  Starter plan starts at $19/mo. Let me know if you would like me to set up an account!
                </div>
              </div>
              <div className="h-8 bg-zinc-900 rounded w-full flex items-center justify-end px-3">
                <Send className="h-3 w-3 text-zinc-500" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. INTERACTIVE DEMO SECTION */}
      <section id="demo" className="py-24 border-y border-zinc-900 bg-zinc-950/30 px-6">
        <div className="max-w-5xl mx-auto grid md:grid-cols-12 gap-12 items-center">
          
          {/* Info Side */}
          <div className="md:col-span-5 space-y-6">
            <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-400">Interactive Simulator</h3>
            <h2 className="text-3xl font-extrabold tracking-tight text-white leading-tight">
              Test AI Workflows Live
            </h2>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Toggle channels to preview how Svachalit standardizes webhook signals, runs semantic queries, updates customer profiles, and executes automated business events.
            </p>

            {/* Simulated channel switch buttons */}
            <div className="flex flex-col gap-2">
              <button 
                onClick={() => setDemoTab('whatsapp')}
                className={`flex items-center justify-between p-3 rounded-lg border text-left transition-all ${demoTab === 'whatsapp' ? 'bg-zinc-900 border-zinc-700 text-white' : 'border-zinc-900 hover:border-zinc-800 text-zinc-400'}`}
              >
                <div className="flex items-center gap-2 text-xs font-semibold">
                  <Phone className="h-4 w-4 text-emerald-500" />
                  WhatsApp Business Chat
                </div>
                <ChevronRight className="h-3 w-3 text-zinc-600" />
              </button>

              <button 
                onClick={() => setDemoTab('instagram')}
                className={`flex items-center justify-between p-3 rounded-lg border text-left transition-all ${demoTab === 'instagram' ? 'bg-zinc-900 border-zinc-700 text-white' : 'border-zinc-900 hover:border-zinc-800 text-zinc-400'}`}
              >
                <div className="flex items-center gap-2 text-xs font-semibold">
                  <Instagram className="h-4 w-4 text-pink-500" />
                  Instagram Auto-Replies
                </div>
                <ChevronRight className="h-3 w-3 text-zinc-600" />
              </button>

              <button 
                onClick={() => setDemoTab('lead')}
                className={`flex items-center justify-between p-3 rounded-lg border text-left transition-all ${demoTab === 'lead' ? 'bg-zinc-900 border-zinc-700 text-white' : 'border-zinc-900 hover:border-zinc-800 text-zinc-400'}`}
              >
                <div className="flex items-center gap-2 text-xs font-semibold">
                  <Layers className="h-4 w-4 text-blue-500" />
                  Lead Capture & CRM Sync
                </div>
                <ChevronRight className="h-3 w-3 text-zinc-600" />
              </button>

              <button 
                onClick={() => setDemoTab('routing')}
                className={`flex items-center justify-between p-3 rounded-lg border text-left transition-all ${demoTab === 'routing' ? 'bg-zinc-900 border-zinc-700 text-white' : 'border-zinc-900 hover:border-zinc-800 text-zinc-400'}`}
              >
                <div className="flex items-center gap-2 text-xs font-semibold">
                  <ArrowRightLeft className="h-4 w-4 text-amber-500" />
                  AI to Agent Escalation
                </div>
                <ChevronRight className="h-3 w-3 text-zinc-600" />
              </button>
            </div>
          </div>

          {/* Interactive Chat Mockup Panel */}
          <div className="md:col-span-7 bg-[#0c0c12] border border-zinc-850 rounded-2xl p-4 shadow-xl flex flex-col h-[400px]">
            {/* Header info */}
            <div className="flex justify-between items-center pb-3 border-b border-zinc-900">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-emerald-500 animate-ping"></div>
                <span className="text-xs font-bold text-zinc-200 capitalize">{demoTab} Simulator Channel</span>
              </div>
              <span className="text-[10px] text-zinc-500 font-mono">SSE Stream Connected</span>
            </div>

            {/* Chat Body */}
            <div className="flex-1 overflow-y-auto py-4 space-y-3">
              {demoMessages.map((msg, idx) => (
                <div 
                  key={idx} 
                  className={`flex ${msg.sender === 'user' ? 'justify-start' : msg.sender === 'system' ? 'justify-center' : 'justify-end'}`}
                >
                  <div className={`p-2.5 rounded-lg text-xs max-w-[80%] ${
                    msg.sender === 'user'
                      ? 'bg-zinc-900 text-zinc-100'
                      : msg.sender === 'system'
                        ? 'bg-amber-950/20 border border-amber-800/30 text-amber-400 text-[10px]'
                        : msg.isTool
                          ? 'bg-indigo-950/40 border border-indigo-500/20 text-indigo-300 font-mono text-[10px] flex items-center gap-1.5'
                          : 'bg-indigo-600 text-white'
                  }`}>
                    {msg.isTool && <Sparkles className="h-3 w-3 text-indigo-400" />}
                    {msg.text}
                  </div>
                </div>
              ))}
              {isTyping && (
                <div className="flex justify-end">
                  <div className="bg-indigo-950/20 border border-indigo-500/10 p-2.5 rounded-lg text-xs text-zinc-400">
                    AI agent is typing...
                  </div>
                </div>
              )}
            </div>

            {/* Chat Input */}
            <form onSubmit={handleDemoChat} className="flex gap-2 pt-3 border-t border-zinc-900">
              <input 
                type="text" 
                placeholder="Type messages to simulate caller interactions..."
                value={demoInput}
                onChange={(e) => setDemoInput(e.target.value)}
                className="flex-1 px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-xs text-white focus:outline-none focus:border-indigo-500"
              />
              <button 
                type="submit" 
                className="p-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-white"
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
          <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-400">Deep capabilities</h3>
          <h2 className="text-3xl font-extrabold tracking-tight text-white leading-tight">
            Hallucination-Resistant Business Automation
          </h2>
          <p className="text-xs text-zinc-400 max-w-lg mx-auto">
            Traditional LLM chatbots make up facts. Svachalit secures accuracy by fusing multi-channel handlers with vector-based hybrid retrieval structures.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Card 1 */}
          <div className="glass-card p-6 rounded-xl space-y-4">
            <div className="p-3 bg-indigo-600/10 border border-indigo-500/20 rounded-lg text-indigo-400 w-fit">
              <Cpu className="h-5 w-5" />
            </div>
            <h3 className="font-bold text-sm text-zinc-200">Hybrid RAG AI</h3>
            <p className="text-xs text-zinc-500 leading-relaxed">
              Query PostgreSQL pgvector database and combine structural attributes to answer questions with precision.
            </p>
          </div>

          {/* Card 2 */}
          <div className="glass-card p-6 rounded-xl space-y-4">
            <div className="p-3 bg-indigo-600/10 border border-indigo-500/20 rounded-lg text-indigo-400 w-fit">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <h3 className="font-bold text-sm text-zinc-200">Hallucination Reduction</h3>
            <p className="text-xs text-zinc-500 leading-relaxed">
              Enforce system boundaries so the agent refuses to answer queries outside specified knowledge context bases.
            </p>
          </div>

          {/* Card 3 */}
          <div className="glass-card p-6 rounded-xl space-y-4">
            <div className="p-3 bg-indigo-600/10 border border-indigo-500/20 rounded-lg text-indigo-400 w-fit">
              <Globe className="h-5 w-5" />
            </div>
            <h3 className="font-bold text-sm text-zinc-200">Multi-platform Automation</h3>
            <p className="text-xs text-zinc-500 leading-relaxed">
              A single configuration handles webhooks from WhatsApp, Instagram, Facebook Messenger, and Inbound Voice call streams.
            </p>
          </div>

          {/* Card 4 */}
          <div className="glass-card p-6 rounded-xl space-y-4">
            <div className="p-3 bg-indigo-600/10 border border-indigo-500/20 rounded-lg text-indigo-400 w-fit">
              <MessageSquare className="h-5 w-5" />
            </div>
            <h3 className="font-bold text-sm text-zinc-200">AI Inbox Console</h3>
            <p className="text-xs text-zinc-500 leading-relaxed">
              Monitor active chat histories and override automated processes dynamically. A manual response pauses AI responders instantly.
            </p>
          </div>

          {/* Card 5 */}
          <div className="glass-card p-6 rounded-xl space-y-4">
            <div className="p-3 bg-indigo-600/10 border border-indigo-500/20 rounded-lg text-indigo-400 w-fit">
              <GitBranch className="h-5 w-5" />
            </div>
            <h3 className="font-bold text-sm text-zinc-200">Workflow Routing</h3>
            <p className="text-xs text-zinc-500 leading-relaxed">
              Chain events to run OpenAI function definitions like appointment bookings, spreadsheet exports, or CRM updates.
            </p>
          </div>

          {/* Card 6 */}
          <div className="glass-card p-6 rounded-xl space-y-4">
            <div className="p-3 bg-indigo-600/10 border border-indigo-500/20 rounded-lg text-indigo-400 w-fit">
              <BarChart2 className="h-5 w-5" />
            </div>
            <h3 className="font-bold text-sm text-zinc-200">Analytics Dashboard</h3>
            <p className="text-xs text-zinc-500 leading-relaxed">
              Track customer volume, confidence score rankings, database tables activity, and human escalation rates.
            </p>
          </div>
        </div>
      </section>

      {/* 4. WORKFLOW VISUALIZATION */}
      <section id="workflow" className="py-24 border-t border-zinc-900 bg-zinc-950/20 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center space-y-4 mb-16">
            <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-400">Platform Pipeline</h3>
            <h2 className="text-3xl font-extrabold tracking-tight text-white leading-tight">
              Ingress to Response Workflow
            </h2>
            <p className="text-xs text-zinc-400 max-w-md mx-auto">
              How Svachalit processes and executes business automation events behind the scenes.
            </p>
          </div>

          {/* Workflow Step Grid */}
          <div className="grid md:grid-cols-5 gap-6 relative">
            {/* Step 1 */}
            <div className="p-5 bg-zinc-950 border border-zinc-900 rounded-xl relative flex flex-col items-center text-center">
              <div className="w-10 h-10 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center font-bold text-xs text-indigo-400 mb-4">
                1
              </div>
              <h4 className="font-bold text-xs text-zinc-200 mb-2">Message Inbound</h4>
              <p className="text-[10px] text-zinc-550">Webhooks parse Meta Cloud API or Voice transcripts and enqueue messages.</p>
            </div>

            {/* Step 2 */}
            <div className="p-5 bg-zinc-950 border border-zinc-900 rounded-xl relative flex flex-col items-center text-center">
              <div className="w-10 h-10 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center font-bold text-xs text-indigo-400 mb-4">
                2
              </div>
              <h4 className="font-bold text-xs text-zinc-200 mb-2">Queue Processing</h4>
              <p className="text-[10px] text-zinc-550">Redis/BullMQ orchestrates messages asynchronously with retry resilience.</p>
            </div>

            {/* Step 3 */}
            <div className="p-5 bg-zinc-950 border border-zinc-900 rounded-xl relative flex flex-col items-center text-center">
              <div className="w-10 h-10 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center font-bold text-xs text-indigo-400 mb-4">
                3
              </div>
              <h4 className="font-bold text-xs text-zinc-200 mb-2">Hybrid RAG Retrieval</h4>
              <p className="text-[10px] text-zinc-550">Generates OpenAI embeddings and pulls document matches from Postgres vector store.</p>
            </div>

            {/* Step 4 */}
            <div className="p-5 bg-zinc-950 border border-zinc-900 rounded-xl relative flex flex-col items-center text-center">
              <div className="w-10 h-10 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center font-bold text-xs text-indigo-400 mb-4">
                4
              </div>
              <h4 className="font-bold text-xs text-zinc-200 mb-2">AI Execution</h4>
              <p className="text-[10px] text-zinc-550">OpenAI completions check schemas to run calendar bookings or sync CRM sheets.</p>
            </div>

            {/* Step 5 */}
            <div className="p-5 bg-zinc-950 border border-zinc-900 rounded-xl relative flex flex-col items-center text-center">
              <div className="w-10 h-10 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-xs mb-4 glow-primary">
                5
              </div>
              <h4 className="font-bold text-xs text-zinc-200 mb-2">Outbound Delivery</h4>
              <p className="text-[10px] text-zinc-550">Dispatches API replies back to WhatsApp/Meta or transfers the user to a Live Agent.</p>
            </div>
          </div>
        </div>
      </section>

      {/* 5. PRICING SECTION */}
      <section id="pricing" className="py-24 max-w-4xl mx-auto px-6">
        <div className="text-center space-y-4 mb-16">
          <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-400">Pricing Models</h3>
          <h2 className="text-3xl font-extrabold tracking-tight text-white leading-tight">
            Select Your Subscription Plan
          </h2>
          <p className="text-xs text-zinc-400 max-w-sm mx-auto">
            Choose between self-managed API hosting and our premium unified RAG framework.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Plan 1 */}
          <div className="glass-card p-8 rounded-xl border border-zinc-900 relative flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h4 className="font-bold text-sm text-zinc-400">Plan 1</h4>
                  <h3 className="font-bold text-lg text-zinc-200 mt-1">Bring Your Own API Key</h3>
                </div>
                <span className="text-xs font-bold px-2 py-1 bg-zinc-900 rounded border border-zinc-800 text-zinc-400 font-mono">$19/mo</span>
              </div>
              <p className="text-xs text-zinc-500 mb-6">
                Perfect for developers, technical founders, and startups looking to hook up their own LLM accounts.
              </p>
              <ul className="space-y-3 text-xs text-zinc-400 mb-8">
                <li className="flex items-center gap-2"><CheckCircle className="h-3.5 w-3.5 text-indigo-400" /> Hook own OpenAI/Gemini accounts</li>
                <li className="flex items-center gap-2"><CheckCircle className="h-3.5 w-3.5 text-indigo-400" /> WhatsApp & Instagram integrations</li>
                <li className="flex items-center gap-2"><CheckCircle className="h-3.5 w-3.5 text-indigo-400" /> SSE Live Chat Dashboard console</li>
                <li className="flex items-center gap-2"><CheckCircle className="h-3.5 w-3.5 text-indigo-400" /> Basic support channels</li>
              </ul>
            </div>
            <button
              onClick={() => onChoosePlan('byok')}
              className="w-full py-2.5 bg-zinc-900 hover:bg-zinc-800 text-xs font-bold text-white rounded-lg transition-colors border border-zinc-800"
            >
              Choose Plan 1
            </button>
          </div>

          {/* Plan 2 */}
          <div className="glass-card p-8 rounded-xl border border-indigo-500/30 relative flex flex-col justify-between overflow-hidden shadow-xl">
            <div className="absolute top-0 right-0 bg-indigo-600 text-[9px] font-extrabold px-3 py-1 uppercase rounded-bl-lg tracking-wider glow-primary text-white">
              Recommended
            </div>
            <div>
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h4 className="font-bold text-sm text-indigo-400">Plan 2</h4>
                  <h3 className="font-bold text-lg text-zinc-100 mt-1">Svachalit Managed Plan</h3>
                </div>
                <span className="text-xs font-bold px-2 py-1 bg-indigo-950 text-indigo-300 rounded border border-indigo-800/40 font-mono">$49/mo</span>
              </div>
              <p className="text-xs text-zinc-500 mb-6">
                Enterprise solution with dedicated hosted RAG databases, priority query models, and low latency pipelines.
              </p>
              <ul className="space-y-3 text-xs text-zinc-400 mb-8">
                <li className="flex items-center gap-2"><CheckCircle className="h-3.5 w-3.5 text-indigo-400" /> Zero-setup hosted database & Redis</li>
                <li className="flex items-center gap-2"><CheckCircle className="h-3.5 w-3.5 text-indigo-400" /> Reduced hallucination guarantees</li>
                <li className="flex items-center gap-2"><CheckCircle className="h-3.5 w-3.5 text-indigo-400" /> Live Twilio Voice assistant stream</li>
                <li className="flex items-center gap-2"><CheckCircle className="h-3.5 w-3.5 text-indigo-400" /> Advanced analytics & heatmaps</li>
                <li className="flex items-center gap-2"><CheckCircle className="h-3.5 w-3.5 text-indigo-400" /> Priority SLAs & 24/7 Premium support</li>
              </ul>
            </div>
            <button
              onClick={() => onChoosePlan('managed')}
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-xs font-bold text-white rounded-lg transition-all glow-primary"
            >
              Choose Managed Plan
            </button>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-zinc-900 bg-zinc-950 py-12 px-6 mt-16 text-center text-xs text-zinc-600">
        <p className="mb-2">© 2026 Svachalit Inc. All rights reserved.</p>
        <p className="font-mono text-[10px]">Automate Conversations. Scale Businesses.</p>
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4 animate-fade-in">
      <div className="w-full max-w-xl bg-zinc-950 border border-zinc-800 rounded-2xl overflow-hidden shadow-2xl relative">
        
        {/* Header step tracking indicator */}
        <div className="p-6 border-b border-zinc-900 flex justify-between items-center bg-zinc-900/20">
          <div>
            <h3 className="font-bold text-sm text-zinc-100">Setup Svachalit Account</h3>
            <p className="text-[10px] text-indigo-400 font-mono tracking-wider mt-0.5">STEP {step} OF 4</p>
          </div>
          <button onClick={onClose} className="p-2 text-zinc-500 hover:text-zinc-300">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Progress bar */}
        <div className="w-full h-1 bg-zinc-900">
          <div 
            className="h-full bg-indigo-600 transition-all duration-300"
            style={{ width: `${(step / 4) * 100}%` }}
          />
        </div>

        {/* Form Body */}
        <div className="p-6 h-96 overflow-y-auto space-y-4">
          
          {/* STEP 1: BASIC DETAILS */}
          {step === 1 && (
            <div className="space-y-4">
              <h4 className="font-bold text-xs text-zinc-400">Account Owner Details</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] text-zinc-500 block mb-1">Full Name</label>
                  <input 
                    type="text" 
                    name="fullName" 
                    value={formData.fullName} 
                    onChange={handleChange} 
                    placeholder="Alice Johnson"
                    className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-xs text-white focus:outline-none focus:border-indigo-500" 
                  />
                </div>
                <div>
                  <label className="text-[10px] text-zinc-500 block mb-1">Business Name</label>
                  <input 
                    type="text" 
                    name="businessName" 
                    value={formData.businessName} 
                    onChange={handleChange} 
                    placeholder="Acme Corp"
                    className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-xs text-white focus:outline-none focus:border-indigo-500" 
                  />
                </div>
              </div>
              <div>
                <label className="text-[10px] text-zinc-500 block mb-1">Email Address</label>
                <input 
                  type="email" 
                  name="email" 
                  value={formData.email} 
                  onChange={handleChange} 
                  placeholder="owner@acme.com"
                  className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-xs text-white focus:outline-none focus:border-indigo-500" 
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] text-zinc-500 block mb-1">WhatsApp Number</label>
                  <input 
                    type="text" 
                    name="phone" 
                    value={formData.phone} 
                    onChange={handleChange} 
                    placeholder="+1 555-0199"
                    className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-xs text-white focus:outline-none focus:border-indigo-500" 
                  />
                </div>
                <div>
                  <label className="text-[10px] text-zinc-500 block mb-1">Password</label>
                  <input 
                    type="password" 
                    name="password" 
                    value={formData.password} 
                    onChange={handleChange} 
                    placeholder="••••••••"
                    className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-xs text-white focus:outline-none focus:border-indigo-500" 
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: BUSINESS INFORMATION */}
          {step === 2 && (
            <div className="space-y-4">
              <h4 className="font-bold text-xs text-zinc-400">Business Profile Parameters</h4>
              <div>
                <label className="text-[10px] text-zinc-500 block mb-1">Industry Type</label>
                <select 
                  name="industry" 
                  value={formData.industry} 
                  onChange={handleChange} 
                  className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-xs text-white focus:outline-none focus:border-indigo-500"
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
                  <label className="text-[10px] text-zinc-500 block mb-1">Business Size</label>
                  <select 
                    name="businessSize" 
                    value={formData.businessSize} 
                    onChange={handleChange} 
                    className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-xs text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="1-10">1-10 Employees</option>
                    <option value="11-50">11-50 Employees</option>
                    <option value="51-200">51-200 Employees</option>
                    <option value="200+">200+ Employees</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] text-zinc-500 block mb-1">Monthly Volume</label>
                  <select 
                    name="volume" 
                    value={formData.volume} 
                    onChange={handleChange} 
                    className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-xs text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="Under 1k">Under 1,000 Chats</option>
                    <option value="1k-5k">1,000 - 5,000 Chats</option>
                    <option value="5k-20k">5,000 - 20,000 Chats</option>
                    <option value="20k+">20,000+ Chats</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="text-[10px] text-zinc-500 block mb-1">Primary Use Case</label>
                <select 
                  name="useCase" 
                  value={formData.useCase} 
                  onChange={handleChange} 
                  className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-xs text-white focus:outline-none focus:border-indigo-500"
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
              <h4 className="font-bold text-xs text-zinc-400">Social Channel Ingress Details</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] text-zinc-500 block mb-1">WhatsApp Business Number</label>
                  <input 
                    type="text" 
                    name="whatsappNumber" 
                    value={formData.whatsappNumber} 
                    onChange={handleChange} 
                    placeholder="+1 555-0199"
                    className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-xs text-white focus:outline-none focus:border-indigo-500" 
                  />
                </div>
                <div>
                  <label className="text-[10px] text-zinc-500 block mb-1">Instagram Business Handle</label>
                  <input 
                    type="text" 
                    name="instagramHandle" 
                    value={formData.instagramHandle} 
                    onChange={handleChange} 
                    placeholder="@acme_styles"
                    className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-xs text-white focus:outline-none focus:border-indigo-500" 
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] text-zinc-500 block mb-1">Facebook Page Name</label>
                  <input 
                    type="text" 
                    name="facebookPage" 
                    value={formData.facebookPage} 
                    onChange={handleChange} 
                    placeholder="Acme Corporation"
                    className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-xs text-white focus:outline-none focus:border-indigo-500" 
                  />
                </div>
                <div>
                  <label className="text-[10px] text-zinc-500 block mb-1">Business Website URL</label>
                  <input 
                    type="text" 
                    name="websiteUrl" 
                    value={formData.websiteUrl} 
                    onChange={handleChange} 
                    placeholder="https://acme.com"
                    className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-xs text-white focus:outline-none focus:border-indigo-500" 
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: AI PREFERENCES */}
          {step === 4 && (
            <div className="space-y-4">
              <h4 className="font-bold text-xs text-zinc-400">AI Model Setup & Settings</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] text-zinc-500 block mb-1">Bring Own Key?</label>
                  <select 
                    name="byoKey" 
                    value={formData.byoKey} 
                    onChange={handleChange} 
                    className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-xs text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="Yes">Yes (Using OpenRouter/OpenAI)</option>
                    <option value="No">No (Managed RAG infrastructure)</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] text-zinc-500 block mb-1">Preferred Model</label>
                  <select 
                    name="model" 
                    value={formData.model} 
                    onChange={handleChange} 
                    className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-xs text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="gpt-4o-mini">GPT-4o Mini (Cost Efficient)</option>
                    <option value="gpt-4o">GPT-4o (Smart Reasoning)</option>
                    <option value="gemini-1.5-flash">Gemini 1.5 Flash (Low latency)</option>
                    <option value="claude-3-haiku">Claude 3 Haiku</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="text-[10px] text-zinc-500 block mb-1">Expected Daily Chats</label>
                <select 
                  name="dailyChats" 
                  value={formData.dailyChats} 
                  onChange={handleChange} 
                  className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-xs text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="0-50">Under 50 chats/day</option>
                  <option value="50-200">50 - 200 chats/day</option>
                  <option value="200-1k">200 - 1,000 chats/day</option>
                  <option value="1k+">1,000+ chats/day</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] text-zinc-500 block mb-1">Team Size</label>
                  <input 
                    type="text" 
                    name="teamSize" 
                    value={formData.teamSize} 
                    onChange={handleChange} 
                    placeholder="3 members"
                    className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-xs text-white focus:outline-none focus:border-indigo-500" 
                  />
                </div>
                <div>
                  <label className="text-[10px] text-zinc-500 block mb-1">Country</label>
                  <input 
                    type="text" 
                    name="country" 
                    value={formData.country} 
                    onChange={handleChange} 
                    placeholder="United States"
                    className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-xs text-white focus:outline-none focus:border-indigo-500" 
                  />
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Footer controls */}
        <div className="p-6 border-t border-zinc-900 flex justify-between bg-zinc-900/10">
          <button
            onClick={handleBack}
            disabled={step === 1}
            className={`px-4 py-2 border border-zinc-800 text-xs font-semibold rounded-lg text-zinc-400 hover:text-zinc-200 ${step === 1 ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            Back
          </button>
          
          <button
            onClick={handleNext}
            className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-xs font-bold text-white rounded-lg transition-all glow-primary"
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
  const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:4000';

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
    <div className="flex h-screen bg-[#030303] text-zinc-150 overflow-hidden font-sans select-none">
      
      {/* LEFT REDESIGNED SIDEBAR */}
      <aside className="w-64 border-r border-zinc-900 bg-zinc-950 flex flex-col justify-between p-4 shrink-0">
        <div className="space-y-6">
          {/* Logo & branding */}
          <div className="flex items-center gap-2 px-2 cursor-pointer" onClick={onExitToLanding}>
            <div className="p-1.5 bg-indigo-600 rounded-lg text-white glow-primary">
              <Sparkles className="h-4 w-4" />
            </div>
            <div>
              <span className="font-extrabold text-sm text-white tracking-wide">Svachalit</span>
              <span className="block text-[8px] font-mono text-zinc-500 tracking-widest mt-0.5">CONSOLE</span>
            </div>
          </div>

          {/* User summaries */}
          <div className="p-3 bg-zinc-900/40 border border-zinc-900 rounded-lg space-y-2">
            <span className="text-[9px] uppercase tracking-wider text-zinc-500 block font-bold">Workspace Stats</span>
            <div className="flex justify-between items-center text-xs">
              <span className="text-zinc-400">Total Enrolled</span>
              <span className="font-semibold text-zinc-200">{conversations.length}</span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-zinc-400">AI Active</span>
              <span className="font-semibold text-indigo-400">{conversations.filter(c => c.status === 'AI_MANAGED').length}</span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-zinc-400">Escalations</span>
              <span className="font-semibold text-amber-500">{conversations.filter(c => c.status === 'HUMAN_PENDING').length}</span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1.5">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${activeTab === 'dashboard' ? 'bg-indigo-600/10 text-indigo-400 border border-indigo-500/20' : 'text-zinc-400 hover:bg-zinc-900/50 hover:text-zinc-200'}`}
            >
              <Cpu className="h-4 w-4" /> Dashboard
            </button>

            <button
              onClick={() => setActiveTab('inbox')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold transition-all ${activeTab === 'inbox' ? 'bg-indigo-600/10 text-indigo-400 border border-indigo-500/20' : 'text-zinc-400 hover:bg-zinc-900/50 hover:text-zinc-200'}`}
            >
              <span className="flex items-center gap-3">
                <MessageSquare className="h-4 w-4" /> Live Inbox
              </span>
              {conversations.filter(c => c.status === 'HUMAN_PENDING').length > 0 && (
                <span className="h-2 w-2 rounded-full bg-amber-400 animate-pulse"></span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('analytics')}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${activeTab === 'analytics' ? 'bg-indigo-600/10 text-indigo-400 border border-indigo-500/20' : 'text-zinc-400 hover:bg-zinc-900/50 hover:text-zinc-200'}`}
            >
              <BarChart2 className="h-4 w-4" /> Analytics
            </button>

            <button
              onClick={() => setActiveTab('workflows')}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${activeTab === 'workflows' ? 'bg-indigo-600/10 text-indigo-400 border border-indigo-500/20' : 'text-zinc-400 hover:bg-zinc-900/50 hover:text-zinc-200'}`}
            >
              <GitBranch className="h-4 w-4" /> Workflows
            </button>

            <button
              onClick={() => setActiveTab('leads')}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${activeTab === 'leads' ? 'bg-indigo-600/10 text-indigo-400 border border-indigo-500/20' : 'text-zinc-400 hover:bg-zinc-900/50 hover:text-zinc-200'}`}
            >
              <User className="h-4 w-4" /> Leads CRM
            </button>

            <button
              onClick={() => setActiveTab('agents')}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${activeTab === 'agents' ? 'bg-indigo-600/10 text-indigo-400 border border-indigo-500/20' : 'text-zinc-400 hover:bg-zinc-900/50 hover:text-zinc-200'}`}
            >
              <Bot className="h-4 w-4" /> AI Agents & RAG
            </button>

            <button
              onClick={() => setActiveTab('integrations')}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${activeTab === 'integrations' ? 'bg-indigo-600/10 text-indigo-400 border border-indigo-500/20' : 'text-zinc-400 hover:bg-zinc-900/50 hover:text-zinc-200'}`}
            >
              <Layers className="h-4 w-4" /> Integrations
            </button>
          </nav>
        </div>

        {/* Diagnostic console seed tools */}
        <div className="space-y-3">
          <div className="p-2.5 bg-zinc-900/40 rounded-lg text-[10px] text-zinc-550 border border-zinc-900">
            <span className="block text-zinc-500 font-bold mb-1">Render API status:</span>
            <span className="truncate block font-mono">{seedingStatus || 'Connected'}</span>
          </div>

          <button
            onClick={runDatabaseSeed}
            className="w-full flex items-center justify-center gap-2 py-2 bg-indigo-600/10 hover:bg-indigo-600/20 border border-indigo-500/20 text-indigo-400 text-xs font-bold rounded-lg transition-colors"
          >
            <Database className="h-3.5 w-3.5" /> Seed Database
          </button>
          
          <button
            onClick={onExitToLanding}
            className="w-full py-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 text-xs font-semibold rounded-lg transition-colors border border-zinc-800"
          >
            Exit Console
          </button>
        </div>
      </aside>

      {/* MAIN VIEW CONTROLLER */}
      <main className="flex-1 flex flex-col bg-[#030303] overflow-hidden">
        
        {/* HEADER BAR */}
        <header className="px-6 py-4 border-b border-zinc-900 bg-zinc-950 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h2 className="text-sm font-bold text-white capitalize">{activeTab} Manager</h2>
            <span className="text-zinc-700 font-normal">|</span>
            <span className="text-[10px] font-mono text-indigo-400 tracking-wider">SVACALIT CORE ENGINE</span>
          </div>

          {/* Active channels indicator */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1 bg-zinc-900/60 px-2 py-1 rounded border border-zinc-800">
              <Phone className="h-3.5 w-3.5 text-emerald-500" />
              <span className="text-[10px] font-bold text-zinc-400">WhatsApp</span>
            </div>
            <div className="flex items-center gap-1 bg-zinc-900/60 px-2 py-1 rounded border border-zinc-800">
              <Instagram className="h-3.5 w-3.5 text-pink-500" />
              <span className="text-[10px] font-bold text-zinc-400">Instagram</span>
            </div>
            <div className="flex items-center gap-1 bg-zinc-900/60 px-2 py-1 rounded border border-zinc-800">
              <Facebook className="h-3.5 w-3.5 text-blue-500" />
              <span className="text-[10px] font-bold text-zinc-400">Facebook</span>
            </div>
            <div className="flex items-center gap-1 bg-zinc-900/60 px-2 py-1 rounded border border-zinc-800">
              <Phone className="h-3.5 w-3.5 text-orange-500" />
              <span className="text-[10px] font-bold text-zinc-400">Voice Calls</span>
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
                  <div className="absolute top-2 right-2 p-1.5 bg-indigo-500/10 rounded-lg text-indigo-400">
                    <Bot className="h-4 w-4" />
                  </div>
                  <span className="text-[10px] text-zinc-500 block uppercase font-bold tracking-wider">AI Accuracy</span>
                  <h3 className="text-xl font-extrabold text-white">98.4%</h3>
                  <p className="text-[9px] text-emerald-400">Hallucinations Reduced by 99%</p>
                </div>

                <div className="glass-panel p-4 rounded-xl space-y-2 relative">
                  <div className="absolute top-2 right-2 p-1.5 bg-blue-500/10 rounded-lg text-blue-400">
                    <TrendingUp className="h-4 w-4" />
                  </div>
                  <span className="text-[10px] text-zinc-500 block uppercase font-bold tracking-wider">Auto Handled</span>
                  <h3 className="text-xl font-extrabold text-white">87.2%</h3>
                  <p className="text-[9px] text-zinc-500">Conversations solved by bot</p>
                </div>

                <div className="glass-panel p-4 rounded-xl space-y-2 relative">
                  <div className="absolute top-2 right-2 p-1.5 bg-amber-500/10 rounded-lg text-amber-400">
                    <User className="h-4 w-4" />
                  </div>
                  <span className="text-[10px] text-zinc-500 block uppercase font-bold tracking-wider">Escalation Rate</span>
                  <h3 className="text-xl font-extrabold text-white">12.8%</h3>
                  <p className="text-[9px] text-amber-400 animate-pulse-slow">Handoffs pending review</p>
                </div>

                <div className="glass-panel p-4 rounded-xl space-y-2 relative">
                  <div className="absolute top-2 right-2 p-1.5 bg-emerald-500/10 rounded-lg text-emerald-400">
                    <CheckCircle className="h-4 w-4" />
                  </div>
                  <span className="text-[10px] text-zinc-500 block uppercase font-bold tracking-wider">Response Speed</span>
                  <h3 className="text-xl font-extrabold text-white">1.8s</h3>
                  <p className="text-[9px] text-emerald-400">Average response pipeline</p>
                </div>
              </div>

              {/* Main SVG Area Chart & Heatmaps */}
              <div className="grid md:grid-cols-12 gap-6">
                
                {/* SVG Area Chart */}
                <div className="md:col-span-8 glass-panel p-6 rounded-xl space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-xs font-bold text-zinc-200">Conversation Volume (Last 7 Days)</h3>
                    <span className="text-[10px] text-indigo-400 font-mono">Real-time stats</span>
                  </div>
                  {/* Custom SVG line/area graph */}
                  <div className="w-full h-48 bg-zinc-950/40 rounded-lg relative overflow-hidden flex items-end">
                    <svg className="w-full h-full" viewBox="0 0 500 150">
                      {/* Grid Lines */}
                      <line x1="0" y1="30" x2="500" y2="30" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
                      <line x1="0" y1="75" x2="500" y2="75" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
                      <line x1="0" y1="120" x2="500" y2="120" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
                      
                      {/* Gradient Fill */}
                      <defs>
                        <linearGradient id="chartGlow" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="rgba(99, 102, 241, 0.4)" />
                          <stop offset="100%" stopColor="rgba(99, 102, 241, 0.0)" />
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
                        stroke="#818cf8" 
                        strokeWidth="2" 
                      />

                      {/* Chart dots */}
                      <circle cx="160" cy="110" r="3.5" fill="#818cf8" />
                      <circle cx="320" cy="60" r="3.5" fill="#818cf8" />
                      <circle cx="440" cy="30" r="3.5" fill="#818cf8" />
                    </svg>

                    {/* X-Axis labels */}
                    <div className="absolute bottom-1 left-0 right-0 flex justify-between px-4 text-[9px] text-zinc-600 font-mono">
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
                  <h3 className="text-xs font-bold text-zinc-200">Conversation Heatmap</h3>
                  <div className="grid grid-cols-7 gap-2">
                    {Array.from({ length: 28 }).map((_, idx) => {
                      const intensities = ['bg-indigo-950/20', 'bg-indigo-900/40', 'bg-indigo-600/50', 'bg-indigo-500/80'];
                      const randomIntensity = intensities[idx % 4];
                      return (
                        <div 
                          key={idx} 
                          className={`h-6 rounded-md ${randomIntensity} border border-zinc-900`}
                          title={`Hour ${idx} intensity`}
                        />
                      );
                    })}
                  </div>
                  <div className="flex justify-between text-[9px] text-zinc-600 font-mono">
                    <span>Low Volume</span>
                    <span>High Volume</span>
                  </div>
                </div>

              </div>

              {/* Recent Activity Log & confidence metrics */}
              <div className="grid md:grid-cols-12 gap-6">
                
                {/* Recent Feed */}
                <div className="md:col-span-6 glass-panel p-6 rounded-xl space-y-4">
                  <h3 className="text-xs font-bold text-zinc-200">Live Activity Feed</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center text-xs border-b border-zinc-900 pb-2">
                      <span className="text-zinc-400">Customer message enqueued in BullMQ</span>
                      <span className="text-[10px] font-mono text-zinc-600">Just Now</span>
                    </div>
                    <div className="flex justify-between items-center text-xs border-b border-zinc-900 pb-2">
                      <span className="text-zinc-400">RAG similarity search completed (Distance: 0.12)</span>
                      <span className="text-[10px] font-mono text-zinc-600">2 min ago</span>
                    </div>
                    <div className="flex justify-between items-center text-xs border-b border-zinc-900 pb-2">
                      <span className="text-zinc-400">OpenAI function `bookAppointment` executed</span>
                      <span className="text-[10px] font-mono text-indigo-400">5 min ago</span>
                    </div>
                  </div>
                </div>

                {/* Accuracy list */}
                <div className="md:col-span-6 glass-panel p-6 rounded-xl space-y-4">
                  <h3 className="text-xs font-bold text-zinc-200">AI Confidence Scores</h3>
                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-zinc-400">FAQ responses</span>
                        <span className="font-semibold text-zinc-200">99.2%</span>
                      </div>
                      <div className="w-full bg-zinc-900 h-1.5 rounded-full overflow-hidden">
                        <div className="bg-indigo-600 h-full w-[99%]" />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-zinc-400">Appointment scheduling</span>
                        <span className="font-semibold text-zinc-200">96.8%</span>
                      </div>
                      <div className="w-full bg-zinc-900 h-1.5 rounded-full overflow-hidden">
                        <div className="bg-indigo-600 h-full w-[96%]" />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-zinc-400">CRM database updates</span>
                        <span className="font-semibold text-zinc-200">94.1%</span>
                      </div>
                      <div className="w-full bg-zinc-900 h-1.5 rounded-full overflow-hidden">
                        <div className="bg-indigo-600 h-full w-[94%]" />
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
              <section className="w-80 border-r border-zinc-900 flex flex-col bg-zinc-950/40">
                {/* Search */}
                <div className="p-4 border-b border-zinc-900">
                  <div className="relative">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-500" />
                    <input
                      type="text"
                      placeholder="Search conversations..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-9 pr-4 py-2 text-xs bg-zinc-900 border border-zinc-800 rounded-md focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                {/* Filters */}
                <div className="px-4 py-2 border-b border-zinc-900 flex flex-wrap gap-1 bg-zinc-950/20">
                  {['ALL', 'WHATSAPP', 'INSTAGRAM', 'FACEBOOK', 'VOICE'].map(ch => (
                    <button
                      key={ch}
                      onClick={() => setChannelFilter(ch)}
                      className={`px-2 py-1 text-[10px] font-semibold rounded-md transition-all ${channelFilter === ch ? 'bg-zinc-800 text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
                    >
                      {ch === 'ALL' ? 'All' : ch.substring(0, 4)}
                    </button>
                  ))}
                </div>

                <div className="px-4 py-2 border-b border-zinc-900 flex gap-2 justify-between">
                  <button
                    onClick={() => setStatusFilter('ALL')}
                    className={`flex-1 py-1 text-[10px] font-semibold text-center rounded-md ${statusFilter === 'ALL' ? 'bg-zinc-800 text-zinc-100' : 'text-zinc-500 hover:text-zinc-300'}`}
                  >
                    All Status
                  </button>
                  <button
                    onClick={() => setStatusFilter('HUMAN_PENDING')}
                    className={`flex-1 py-1 text-[10px] font-semibold text-center rounded-md flex items-center justify-center gap-1 ${statusFilter === 'HUMAN_PENDING' ? 'bg-amber-950/40 text-amber-400 border border-amber-800/40' : 'text-zinc-500 hover:text-zinc-300'}`}
                  >
                    <AlertTriangle className="h-3 w-3" /> Agent
                  </button>
                  <button
                    onClick={() => setStatusFilter('AI_MANAGED')}
                    className={`flex-1 py-1 text-[10px] font-semibold text-center rounded-md flex items-center justify-center gap-1 ${statusFilter === 'AI_MANAGED' ? 'bg-indigo-950/40 text-indigo-400 border border-indigo-800/40' : 'text-zinc-500 hover:text-zinc-300'}`}
                  >
                    <Bot className="h-3 w-3" /> AI Active
                  </button>
                </div>

                {/* List area */}
                <div className="flex-1 overflow-y-auto divide-y divide-zinc-900">
                  {filteredConversations.length === 0 ? (
                    <div className="p-8 text-center text-xs text-zinc-600 flex flex-col items-center gap-2">
                      <MessageSquare className="h-8 w-8 text-zinc-800" />
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
                          className={`p-4 cursor-pointer relative transition-all border-l-2 ${isActive ? 'bg-zinc-900/60 border-indigo-500' : isPending ? 'bg-amber-950/5 hover:bg-zinc-900/30 border-amber-500' : 'hover:bg-zinc-900/20 border-transparent'}`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center gap-1.5">
                              {getChannelIcon(conv.channel)}
                              <span className="font-semibold text-xs truncate max-w-[120px] text-zinc-200">
                                {conv.customer.name || 'Anonymous'}
                              </span>
                            </div>
                            <span className="text-[9px] text-zinc-650 font-medium">
                              {new Date(conv.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>

                          <p className="text-[11px] text-zinc-500 truncate max-w-[200px] mb-2">
                            {lastMsg ? lastMsg.body : 'No messages'}
                          </p>

                          <div className="flex items-center justify-between">
                            <span className="text-[8px] tracking-wider text-zinc-600 uppercase font-mono">{conv.channel}</span>
                            {isPending ? (
                              <span className="flex items-center gap-1 text-[9px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 font-medium border border-amber-800/20">
                                <span className="h-1 w-1 rounded-full bg-amber-400"></span> AGENT TAKE-OVER
                              </span>
                            ) : (
                              <span className="flex items-center gap-1 text-[9px] px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-400 font-medium border border-indigo-900/20">
                                <span className="h-1 w-1 rounded-full bg-indigo-400"></span> AI AUTO
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
              <section className="flex-1 flex flex-col bg-[#08080c] border-r border-zinc-900">
                {activeConversation ? (
                  <>
                    {/* Header */}
                    <div className="px-6 py-4 border-b border-zinc-900 bg-zinc-950 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-zinc-900 rounded-full border border-zinc-800">
                          {getChannelIcon(activeConversation.channel)}
                        </div>
                        <div>
                          <h3 className="text-xs font-bold text-zinc-200">{activeConversation.customer.name || 'Anonymous User'}</h3>
                          <span className="text-[10px] text-zinc-500 uppercase font-mono">{activeConversation.channel} Channel</span>
                        </div>
                      </div>

                      {/* Toggles */}
                      <div className="flex items-center gap-2">
                        {activeConversation.status === 'AI_MANAGED' ? (
                          <button
                            onClick={() => toggleAutomationStatus('HUMAN_PENDING')}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/20 rounded-md transition-all"
                          >
                            <ArrowRightLeft className="h-3.5 w-3.5" /> Pause AI responder
                          </button>
                        ) : (
                          <button
                            onClick={() => toggleAutomationStatus('AI_MANAGED')}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 border border-indigo-500/20 rounded-md transition-all"
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
                                ? 'bg-zinc-900 border-zinc-800 text-zinc-100'
                                : isAI
                                  ? 'bg-indigo-950/30 border-indigo-500/20 text-indigo-200 glow-primary'
                                  : 'bg-zinc-850 border-zinc-700 text-zinc-100'
                            }`}>
                              <div className="flex items-center gap-1.5 mb-1.5 text-[9px] font-semibold text-zinc-400">
                                {isCustomer && <User className="h-3 w-3 text-zinc-400" />}
                                {isAI && <Bot className="h-3 w-3 text-indigo-400" />}
                                {isAgent && <User className="h-3 w-3 text-indigo-400" />}
                                <span>{isCustomer ? 'Customer' : isAI ? 'AI' : 'Agent'}</span>
                                <span className="text-zinc-650 font-normal">
                                  {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                              </div>
                              <p>{msg.body}</p>
                              {msg.metadata?.toolCallsTriggered && (
                                <div className="mt-2 pt-1 border-t border-indigo-500/20 text-[9px] text-indigo-300 font-mono flex items-center gap-1">
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
                    <form onSubmit={handleSendMessage} className="p-4 border-t border-zinc-900 bg-zinc-950/40">
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder={activeConversation.status === 'AI_MANAGED' ? 'Responding pauses AI automations...' : 'Type message response...'}
                          value={replyText}
                          onChange={(e) => setReplyText(e.target.value)}
                          className="flex-1 px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-md text-xs text-white focus:outline-none"
                        />
                        <button type="submit" className="p-2.5 bg-indigo-600 hover:bg-indigo-500 rounded-md text-white">
                          <Send className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </form>
                  </>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center text-zinc-500 text-xs gap-3">
                    <MessageSquare className="h-8 w-8 text-zinc-700 animate-pulse" />
                    <span>Select a thread from sidebar list</span>
                  </div>
                )}
              </section>

              {/* Column 3: CRM Profile details & overrides */}
              <section className="w-80 p-6 overflow-y-auto space-y-6 bg-zinc-950/40">
                {activeConversation ? (
                  <div className="space-y-6">
                    <div>
                      <h4 className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 mb-3">Customer Profile</h4>
                      <div className="p-4 rounded-lg bg-zinc-900 border border-zinc-850 space-y-3">
                        <div>
                          <span className="text-[9px] text-zinc-500 block">Name</span>
                          <span className="text-xs font-semibold text-zinc-200">{activeConversation.customer.name || 'Anonymous'}</span>
                        </div>
                        <div>
                          <span className="text-[9px] text-zinc-500 block">Phone</span>
                          <span className="text-xs font-semibold text-zinc-200">{activeConversation.customer.phone || 'N/A'}</span>
                        </div>
                        <div>
                          <span className="text-[9px] text-zinc-500 block">Email</span>
                          <span className="text-xs font-semibold text-zinc-200">{activeConversation.customer.email || 'None Captured'}</span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 mb-3">AI Metadata CRM</h4>
                      <div className="p-4 rounded-lg bg-zinc-900 border border-zinc-850 space-y-3">
                        <div className="flex items-start gap-2 text-xs">
                          <Calendar className="h-4 w-4 text-indigo-400 mt-0.5 shrink-0" />
                          <div>
                            <span className="text-[9px] text-zinc-500 block">Meeting Scheduled</span>
                            <span className="text-[11px] font-semibold text-zinc-250">
                              {activeConversation.customer.metadata?.appointmentDate 
                                ? new Date(activeConversation.customer.metadata.appointmentDate).toLocaleString() 
                                : 'No appointment recorded'}
                            </span>
                          </div>
                        </div>
                        
                        <div className="flex items-start gap-2 text-xs pt-2 border-t border-zinc-800">
                          <Database className="h-4 w-4 text-indigo-400 mt-0.5 shrink-0" />
                          <div>
                            <span className="text-[9px] text-zinc-500 block">CRM Sink Status</span>
                            <span className="text-[11px] font-semibold text-zinc-250">
                              {activeConversation.customer.metadata?.exportedToSheet ? (
                                <span className="text-emerald-400 flex items-center gap-1 font-bold">
                                  <CheckCircle className="h-3.5 w-3.5" /> Synced to CRM
                                </span>
                              ) : (
                                <span className="text-zinc-500">Unsaved Lead</span>
                              )}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center text-zinc-650 text-xs py-12">Select thread to view logs</div>
                )}
              </section>

            </div>
          )}

          {/* TAB 3: ANALYTICS DETAIL PANEL */}
          {activeTab === 'analytics' && (
            <div className="h-full overflow-y-auto p-6 space-y-6">
              <h3 className="font-bold text-sm text-zinc-200">Advanced AI Performance Diagnostics</h3>
              <div className="grid md:grid-cols-3 gap-6">
                <div className="glass-panel p-5 rounded-xl space-y-2">
                  <span className="text-[10px] text-zinc-500 block uppercase font-bold">RAG Retrieval Success</span>
                  <h3 className="text-2xl font-extrabold text-white">99.1%</h3>
                  <div className="w-full bg-zinc-900 h-1 rounded-full overflow-hidden mt-2">
                    <div className="bg-indigo-500 h-full w-[99%]" />
                  </div>
                </div>
                <div className="glass-panel p-5 rounded-xl space-y-2">
                  <span className="text-[10px] text-zinc-500 block uppercase font-bold">Average Latency</span>
                  <h3 className="text-2xl font-extrabold text-white">1.64s</h3>
                  <div className="w-full bg-zinc-900 h-1 rounded-full overflow-hidden mt-2">
                    <div className="bg-indigo-500 h-full w-[80%]" />
                  </div>
                </div>
                <div className="glass-panel p-5 rounded-xl space-y-2">
                  <span className="text-[10px] text-zinc-500 block uppercase font-bold">Token Efficiency</span>
                  <h3 className="text-2xl font-extrabold text-white">94.8%</h3>
                  <div className="w-full bg-zinc-900 h-1 rounded-full overflow-hidden mt-2">
                    <div className="bg-indigo-500 h-full w-[94%]" />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: WORKFLOW SCHEMATIC */}
          {activeTab === 'workflows' && (
            <div className="h-full p-6 flex flex-col gap-6 overflow-y-auto">
              <h3 className="font-bold text-sm text-zinc-200">Active Workflow Visualizer</h3>
              
              <div className="flex-1 bg-zinc-950/40 rounded-xl border border-zinc-900 p-6 flex flex-col justify-center items-center gap-8 relative overflow-hidden">
                <div className="absolute inset-0 grid-bg opacity-30 pointer-events-none" />
                
                {/* Node 1 */}
                <div className="flex items-center gap-4 bg-zinc-900/80 border border-zinc-800 px-4 py-2.5 rounded-lg w-72 shadow-xl z-10">
                  <div className="p-2 bg-indigo-500/10 rounded-md text-indigo-400">
                    <Globe className="h-4 w-4" />
                  </div>
                  <div className="text-left">
                    <h4 className="font-semibold text-xs text-zinc-200">1. Inbound Ingress Webhook</h4>
                    <p className="text-[9px] text-zinc-500 font-mono">Meta API standardizer</p>
                  </div>
                </div>

                <div className="h-6 w-0.5 bg-indigo-600/40 animate-pulse-slow" />

                {/* Node 2 */}
                <div className="flex items-center gap-4 bg-zinc-900/80 border border-zinc-800 px-4 py-2.5 rounded-lg w-72 shadow-xl z-10">
                  <div className="p-2 bg-indigo-500/10 rounded-md text-indigo-400">
                    <Database className="h-4 w-4" />
                  </div>
                  <div className="text-left">
                    <h4 className="font-semibold text-xs text-zinc-200">2. Redis BullMQ Buffer</h4>
                    <p className="text-[9px] text-zinc-500 font-mono">Queue enqueuer pipeline</p>
                  </div>
                </div>

                <div className="h-6 w-0.5 bg-indigo-600/40 animate-pulse-slow" />

                {/* Node 3 */}
                <div className="flex items-center gap-4 bg-indigo-600/10 border border-indigo-500/30 px-4 py-2.5 rounded-lg w-72 shadow-xl z-10 glow-primary">
                  <div className="p-2 bg-indigo-500/20 rounded-md text-indigo-400">
                    <Bot className="h-4 w-4 animate-bounce" />
                  </div>
                  <div className="text-left">
                    <h4 className="font-semibold text-xs text-indigo-200">3. Hybrid RAG Processor</h4>
                    <p className="text-[9px] text-indigo-300 font-mono">Pgvector query match (Distance &lt; 0.15)</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: LEADS LIST */}
          {activeTab === 'leads' && (
            <div className="h-full overflow-y-auto p-6 space-y-6">
              <h3 className="font-bold text-sm text-zinc-200">Unified Lead Records</h3>
              <div className="bg-zinc-950 border border-zinc-900 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs text-zinc-400">
                  <thead className="bg-zinc-900/40 border-b border-zinc-850 text-zinc-300 text-[10px] uppercase font-bold tracking-wider">
                    <tr>
                      <th className="p-4">Customer Name</th>
                      <th className="p-4">Phone</th>
                      <th className="p-4">Email</th>
                      <th className="p-4">Budget Goal</th>
                      <th className="p-4">CRM Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-900">
                    {conversations.map(conv => (
                      <tr key={conv.id} className="hover:bg-zinc-900/20">
                        <td className="p-4 font-semibold text-zinc-200">{conv.customer.name || 'Anonymous'}</td>
                        <td className="p-4">{conv.customer.phone || 'N/A'}</td>
                        <td className="p-4">{conv.customer.email || 'N/A'}</td>
                        <td className="p-4 font-mono">{conv.customer.metadata?.budget || 'N/A'}</td>
                        <td className="p-4">
                          {conv.customer.metadata?.exportedToSheet ? (
                            <span className="text-emerald-400">Synced</span>
                          ) : (
                            <span className="text-zinc-650">Pending Sync</span>
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
              <h3 className="font-bold text-sm text-zinc-200">Channel Integration Links</h3>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="glass-panel p-6 rounded-xl flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Phone className="h-6 w-6 text-emerald-500" />
                    <div>
                      <h4 className="font-semibold text-xs text-zinc-200">Meta WhatsApp Cloud</h4>
                      <p className="text-[10px] text-zinc-550">Link business wa_id and tokens</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 bg-emerald-950 text-emerald-400 rounded-full border border-emerald-900/30">CONNECTED</span>
                </div>

                <div className="glass-panel p-6 rounded-xl flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Instagram className="h-6 w-6 text-pink-500" />
                    <div>
                      <h4 className="font-semibold text-xs text-zinc-200">Instagram DM API</h4>
                      <p className="text-[10px] text-zinc-550">Direct page messages automation</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 bg-emerald-950 text-emerald-400 rounded-full border border-emerald-900/30">CONNECTED</span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 7: AI AGENTS SETUP */}
          {activeTab === 'agents' && (
            <div className="h-full overflow-y-auto p-6 space-y-6">
              <h3 className="font-bold text-sm text-zinc-200">AI Prompt Persona & Knowledge Base</h3>
              <div className="space-y-4">
                <div className="glass-panel p-6 rounded-xl space-y-3">
                  <h4 className="font-bold text-xs text-zinc-200">System Instruction Prompt</h4>
                  <textarea 
                    value="You are a helpful, professional AI business automation assistant representing Acme Corp. ONLY answer using provided Knowledge Base. If unknown, transfer to human agent."
                    readOnly
                    className="w-full h-24 bg-zinc-900 border border-zinc-800 rounded-lg p-3 text-xs text-zinc-400 font-mono focus:outline-none"
                  />
                </div>

                <div className="glass-panel p-6 rounded-xl space-y-3">
                  <h4 className="font-bold text-xs text-zinc-200">RAG Document Chunks</h4>
                  <div className="space-y-2 text-xs text-zinc-400">
                    <div className="p-3 bg-zinc-900 rounded-lg">
                      <span className="font-bold text-zinc-200 block mb-1">Pricing Plans</span>
                      Acme Corp offers three plans: Starter ($19/mo, 1000 messages), Growth ($49/mo, 5000 messages)...
                    </div>
                    <div className="p-3 bg-zinc-900 rounded-lg">
                      <span className="font-bold text-zinc-200 block mb-1">Opening Hours</span>
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
  );
}

'use client';

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
                </div>
              )}
            </div>

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
  );
}

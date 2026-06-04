'use client';

import { MessageCircle, Phone, RefreshCw, Send, UserRound } from 'lucide-react';
import { Analytics, Conversation } from '@/lib/types';

const channelStyles: Record<string, string> = {
  WHATSAPP: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  INSTAGRAM: 'bg-pink-50 text-pink-800 border-pink-200',
  FACEBOOK: 'bg-blue-50 text-blue-800 border-blue-200',
  VOICE: 'bg-amber-50 text-amber-900 border-amber-200',
  WEB: 'bg-slate-50 text-slate-800 border-slate-200'
};

function channelIcon(channel: string) {
  return channel === 'VOICE' ? <Phone size={15} aria-hidden /> : <MessageCircle size={15} aria-hidden />;
}

export function ConversationList({
  conversations,
  analytics,
  onRefresh,
  onSelect,
  selectedId
}: {
  conversations: Conversation[];
  analytics: Analytics | null;
  selectedId?: string;
  onRefresh: () => void;
  onSelect: (conversation: Conversation) => void;
}) {
  return (
    <section className="rounded-md border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
        <div>
          <h2 className="text-sm font-semibold text-slate-950">Live Inbox</h2>
          <p className="text-xs text-slate-500">{analytics?.messages ?? 0} messages tracked</p>
        </div>
        <button
          className="grid h-9 w-9 place-items-center rounded-md border border-slate-200 text-slate-700 hover:bg-slate-50"
          onClick={onRefresh}
          title="Refresh conversations"
        >
          <RefreshCw size={16} aria-hidden />
        </button>
      </div>

      <div className="max-h-[520px] overflow-auto">
        {conversations.length === 0 ? (
          <div className="p-6 text-sm text-slate-500">No conversations yet. Run the demo seed to create examples.</div>
        ) : (
          conversations.map((conversation) => {
            const latest = conversation.messages[0];
            const selected = selectedId === conversation.id;

            return (
              <button
                key={conversation.id}
                className={`block w-full border-b border-slate-100 p-4 text-left hover:bg-slate-50 ${
                  selected ? 'bg-blue-50' : ''
                }`}
                onClick={() => onSelect(conversation)}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <UserRound size={16} className="text-slate-500" aria-hidden />
                      <p className="truncate text-sm font-semibold text-slate-950">
                        {conversation.customer.name || 'Unknown customer'}
                      </p>
                    </div>
                    <p className="mt-2 line-clamp-2 text-sm text-slate-600">
                      {latest?.body || 'Conversation opened'}
                    </p>
                  </div>
                  <span
                    className={`inline-flex shrink-0 items-center gap-1 rounded-md border px-2 py-1 text-xs font-medium ${
                      channelStyles[conversation.channel]
                    }`}
                  >
                    {channelIcon(conversation.channel)}
                    {conversation.channel}
                  </span>
                </div>
                <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
                  <span>{conversation.status}</span>
                  <span>{new Date(conversation.updatedAt).toLocaleTimeString()}</span>
                </div>
              </button>
            );
          })
        )}
      </div>
    </section>
  );
}

export function ManualReply({
  value,
  onChange,
  onSend,
  disabled
}: {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  disabled: boolean;
}) {
  return (
    <div className="flex gap-2">
      <input
        className="min-w-0 flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="Write a manual agent reply"
      />
      <button
        className="grid h-10 w-10 place-items-center rounded-md bg-slate-950 text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
        onClick={onSend}
        disabled={disabled}
        title="Send reply"
      >
        <Send size={16} aria-hidden />
      </button>
    </div>
  );
}

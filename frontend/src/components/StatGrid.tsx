'use client';

import { Bot, Clock3, Handshake, Users } from 'lucide-react';
import { Analytics } from '@/lib/types';

const iconMap = {
  conversations: Users,
  saved: Clock3,
  leads: Bot,
  handoffs: Handshake
};

export function StatGrid({ analytics }: { analytics: Analytics | null }) {
  const stats = [
    {
      key: 'conversations',
      label: 'Conversations',
      value: analytics?.conversationCount ?? 0,
      accent: 'bg-blue-600'
    },
    {
      key: 'saved',
      label: 'Minutes Saved',
      value: analytics?.responseTimeSavedMinutes ?? 0,
      accent: 'bg-emerald-600'
    },
    {
      key: 'leads',
      label: 'Leads Captured',
      value: analytics?.leadCount ?? 0,
      accent: 'bg-amber-500'
    },
    {
      key: 'handoffs',
      label: 'Human Handoffs',
      value: analytics?.handoffCount ?? 0,
      accent: 'bg-rose-600'
    }
  ];

  return (
    <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {stats.map((stat) => {
        const Icon = iconMap[stat.key as keyof typeof iconMap];

        return (
          <div key={stat.key} className="rounded-md border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-medium uppercase text-slate-500">{stat.label}</p>
                <p className="mt-2 text-3xl font-semibold text-slate-950">{stat.value}</p>
              </div>
              <span className={`grid h-10 w-10 place-items-center rounded-md text-white ${stat.accent}`}>
                <Icon size={19} aria-hidden />
              </span>
            </div>
          </div>
        );
      })}
    </section>
  );
}

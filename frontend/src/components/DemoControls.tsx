'use client';

import { Play, Sparkles } from 'lucide-react';
import { apiFetch } from '@/lib/api';

export function DemoControls({
  busy,
  setBusy,
  onDone
}: {
  busy: boolean;
  setBusy: (busy: boolean) => void;
  onDone: () => void;
}) {
  async function runSeed() {
    setBusy(true);
    try {
      await apiFetch('/api/v1/dev/seed', { method: 'POST' });
      onDone();
    } finally {
      setBusy(false);
    }
  }

  async function testAi(message: string) {
    setBusy(true);
    try {
      await apiFetch('/api/v1/test-ai', {
        method: 'POST',
        body: JSON.stringify({ message })
      });
      onDone();
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="rounded-md border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-slate-950">Demo Flow</h2>
          <p className="text-xs text-slate-500">Seed tenant, KB, channels, and AI actions.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            className="inline-flex h-10 items-center gap-2 rounded-md bg-slate-950 px-3 text-sm font-medium text-white hover:bg-slate-800 disabled:bg-slate-300"
            onClick={runSeed}
            disabled={busy}
          >
            <Play size={16} aria-hidden />
            Seed Demo
          </button>
          <button
            className="inline-flex h-10 items-center gap-2 rounded-md border border-slate-300 px-3 text-sm font-medium text-slate-800 hover:bg-slate-50 disabled:text-slate-400"
            onClick={() => testAi('Can you capture my lead? My email is demo@example.com')}
            disabled={busy}
          >
            <Sparkles size={16} aria-hidden />
            Trigger Lead
          </button>
          <button
            className="inline-flex h-10 items-center gap-2 rounded-md border border-slate-300 px-3 text-sm font-medium text-slate-800 hover:bg-slate-50 disabled:text-slate-400"
            onClick={() => testAi('Please transfer me to a human agent')}
            disabled={busy}
          >
            <Sparkles size={16} aria-hidden />
            Trigger Handoff
          </button>
        </div>
      </div>
    </section>
  );
}

'use client';

import { Activity } from 'lucide-react';
import { ToolEvent } from '@/lib/types';

export function ToolEvents({ events }: { events: ToolEvent[] }) {
  return (
    <section className="rounded-md border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center gap-2 border-b border-slate-200 px-4 py-3">
        <Activity size={17} className="text-emerald-700" aria-hidden />
        <h2 className="text-sm font-semibold text-slate-950">AI Action History</h2>
      </div>

      <div className="max-h-72 overflow-auto">
        {events.length === 0 ? (
          <p className="p-4 text-sm text-slate-500">Tool events will appear after the AI books, exports, or hands off.</p>
        ) : (
          events.map((event) => (
            <div key={event.id} className="border-b border-slate-100 p-4">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-semibold text-slate-950">{event.toolName}</p>
                <span className="rounded-md bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-800">
                  {event.status}
                </span>
              </div>
              <p className="mt-1 text-xs text-slate-500">{new Date(event.createdAt).toLocaleString()}</p>
            </div>
          ))
        )}
      </div>
    </section>
  );
}

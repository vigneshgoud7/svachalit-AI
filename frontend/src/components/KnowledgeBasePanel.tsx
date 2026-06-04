'use client';

import { FormEvent, useState } from 'react';
import { Database, Plus, RefreshCw, Trash2 } from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { KnowledgeBaseEntry } from '@/lib/types';

export function KnowledgeBasePanel({
  entries,
  onChanged
}: {
  entries: KnowledgeBaseEntry[];
  onChanged: () => void;
}) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [saving, setSaving] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setSaving(true);

    try {
      await apiFetch('/api/v1/knowledge-base', {
        method: 'POST',
        body: JSON.stringify({ title, content })
      });
      setTitle('');
      setContent('');
      onChanged();
    } finally {
      setSaving(false);
    }
  }

  async function remove(id: string) {
    await apiFetch(`/api/v1/knowledge-base/${id}`, { method: 'DELETE' });
    onChanged();
  }

  async function regenerate(id: string) {
    await apiFetch(`/api/v1/knowledge-base/${id}/regenerate`, { method: 'POST' });
    onChanged();
  }

  return (
    <section className="rounded-md border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center gap-2 border-b border-slate-200 px-4 py-3">
        <Database size={17} className="text-blue-700" aria-hidden />
        <h2 className="text-sm font-semibold text-slate-950">Knowledge Base</h2>
      </div>

      <form className="grid gap-2 border-b border-slate-200 p-4" onSubmit={submit}>
        <input
          className="rounded-md border border-slate-300 px-3 py-2 text-sm"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="Chunk title"
          required
        />
        <textarea
          className="min-h-24 resize-y rounded-md border border-slate-300 px-3 py-2 text-sm"
          value={content}
          onChange={(event) => setContent(event.target.value)}
          placeholder="Business facts for AI retrieval"
          required
        />
        <button
          className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-blue-700 px-3 text-sm font-medium text-white hover:bg-blue-800 disabled:bg-slate-300"
          disabled={saving}
        >
          <Plus size={16} aria-hidden />
          Add Chunk
        </button>
      </form>

      <div className="max-h-72 overflow-auto">
        {entries.length === 0 ? (
          <p className="p-4 text-sm text-slate-500">No knowledge chunks yet.</p>
        ) : (
          entries.map((entry) => (
            <div key={entry.id} className="border-b border-slate-100 p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-slate-950">{entry.title}</p>
                  <p className="mt-1 line-clamp-3 text-sm text-slate-600">{entry.content}</p>
                </div>
                <div className="flex shrink-0 gap-1">
                  <button
                    className="grid h-8 w-8 place-items-center rounded-md border border-slate-200 text-slate-700 hover:bg-slate-50"
                    onClick={() => regenerate(entry.id)}
                    title="Regenerate embedding"
                  >
                    <RefreshCw size={15} aria-hidden />
                  </button>
                  <button
                    className="grid h-8 w-8 place-items-center rounded-md border border-rose-200 text-rose-700 hover:bg-rose-50"
                    onClick={() => remove(entry.id)}
                    title="Delete chunk"
                  >
                    <Trash2 size={15} aria-hidden />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  );
}

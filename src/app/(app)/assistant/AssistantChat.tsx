'use client';

import { useState, useRef, useEffect } from 'react';
import { Icon } from '@/components/shell/Icon';

type Msg = { role: 'user' | 'assistant'; content: string };

const SUGGESTIONS = [
  'Quels chantiers commencent cette semaine ?',
  'Quelles factures sont en retard ?',
  'Résume-moi la rentabilité du chantier Lambert',
  'Prépare-moi un email de relance pour un client',
  'Quelles sont mes tâches urgentes ?',
];

export function AssistantChat() {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages.length, loading]);

  async function send(text?: string) {
    const content = (text ?? input).trim();
    if (!content || loading) return;
    const next = [...messages, { role: 'user' as const, content }];
    setMessages(next);
    setInput('');
    setLoading(true);
    try {
      const res = await fetch('/api/assistant', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ messages: next }) });
      const data = await res.json();
      setMessages([...next, { role: 'assistant', content: data.reply }]);
    } catch {
      setMessages([...next, { role: 'assistant', content: "Une erreur est survenue, veuillez réessayer." }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="card flex flex-col h-[calc(100vh-180px)]">
      <div className="flex-1 overflow-y-auto p-5 space-y-4">
        {messages.length === 0 && (
          <div className="text-center py-6">
            <div className="h-14 w-14 rounded-2xl bg-brand-100 flex items-center justify-center mx-auto mb-3">
              <Icon name="Sparkles" size={26} className="text-brand-600" />
            </div>
            <p className="text-ink-600 mb-4">Posez une question sur vos chantiers, devis, factures ou demandez-moi de rédiger un email.</p>
            <div className="flex flex-wrap gap-2 justify-center max-w-lg mx-auto">
              {SUGGESTIONS.map((s) => (
                <button key={s} onClick={() => send(s)} className="badge bg-brand-50 text-brand-700 border-brand-200 hover:bg-brand-100">{s}</button>
              ))}
            </div>
          </div>
        )}
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] rounded-2xl px-4 py-3 whitespace-pre-wrap text-sm ${m.role === 'user' ? 'bg-brand-600 text-white' : 'bg-ink-100 text-ink-800'}`}>
              {m.content}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-ink-100 rounded-2xl px-4 py-3 text-sm text-ink-500">Réflexion…</div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>
      <div className="p-3 border-t border-ink-100 flex items-end gap-2">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
          placeholder="Écrivez votre question…"
          rows={1}
          className="input flex-1 resize-none !py-2.5"
        />
        <button disabled={loading} onClick={() => send()} className="btn-primary shrink-0"><Icon name="Send" size={16} /></button>
      </div>
    </div>
  );
}

'use client';

import { useEffect, useRef, useState, useTransition } from 'react';
import { sendClientMessage } from '../../actions';
import { Icon } from '@/components/shell/Icon';

type Msg = { id: string; body: string; attachmentPath: string | null; attachmentName: string | null; createdAt: string; senderName: string; isMe: boolean };

export function PortalChat({ conversationId }: { conversationId: string }) {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [body, setBody] = useState('');
  const [pending, startTransition] = useTransition();
  const bottomRef = useRef<HTMLDivElement>(null);

  async function load() {
    const res = await fetch(`/api/portail/conversations/${conversationId}/messages`);
    if (res.ok) setMessages((await res.json()).messages);
  }
  useEffect(() => { load(); const t = setInterval(load, 5000); return () => clearInterval(t); }, [conversationId]);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages.length]);

  function submit() {
    if (!body.trim()) return;
    const fd = new FormData();
    fd.set('body', body);
    startTransition(async () => { await sendClientMessage(conversationId, fd); setBody(''); load(); });
  }

  return (
    <div className="card flex flex-col h-[70vh]">
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((m) => (
          <div key={m.id} className={`flex ${m.isMe ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[75%] rounded-2xl px-3.5 py-2.5 ${m.isMe ? 'bg-emerald-600 text-white' : 'bg-ink-100 text-ink-800'}`}>
              {!m.isMe && <p className="text-[11px] font-semibold opacity-70 mb-0.5">{m.senderName}</p>}
              <p className="text-sm whitespace-pre-wrap break-words">{m.body}</p>
              <p className={`text-[10px] mt-1 ${m.isMe ? 'text-white/60' : 'text-ink-400'}`}>{new Intl.DateTimeFormat('fr-FR', { hour: '2-digit', minute: '2-digit' }).format(new Date(m.createdAt))}</p>
            </div>
          </div>
        ))}
        {messages.length === 0 && <p className="text-sm text-ink-400 text-center py-8">Envoyez votre premier message à l'entreprise</p>}
        <div ref={bottomRef} />
      </div>
      <div className="p-3 border-t border-ink-100 flex items-end gap-2">
        <textarea
          value={body} onChange={(e) => setBody(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submit(); } }}
          placeholder="Écrire un message…" rows={1} className="input flex-1 resize-none !py-2.5"
        />
        <button disabled={pending} onClick={submit} className="btn-primary !bg-emerald-600 hover:!bg-emerald-700 btn-sm shrink-0"><Icon name="Send" size={16} /></button>
      </div>
    </div>
  );
}

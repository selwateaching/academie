'use client';

import { useEffect, useRef, useState, useTransition } from 'react';
import { sendMessage } from './actions';
import { Icon } from '@/components/shell/Icon';

type Msg = { id: string; body: string; attachmentPath: string | null; attachmentName: string | null; createdAt: string; senderName: string; isMe: boolean; isClient: boolean };

export function ChatPanel({ conversationId, title, subtitle }: { conversationId: string; title: string; subtitle?: string }) {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [body, setBody] = useState('');
  const [pending, startTransition] = useTransition();
  const fileRef = useRef<HTMLInputElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  async function load() {
    const res = await fetch(`/api/conversations/${conversationId}/messages`);
    if (res.ok) setMessages((await res.json()).messages);
  }

  useEffect(() => {
    load();
    const t = setInterval(load, 5000);
    return () => clearInterval(t);
  }, [conversationId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  function submit() {
    if (!body.trim() && !fileRef.current?.files?.length) return;
    const fd = new FormData();
    fd.set('body', body);
    if (fileRef.current?.files?.[0]) fd.set('attachment', fileRef.current.files[0]);
    startTransition(async () => {
      await sendMessage(conversationId, fd);
      setBody('');
      if (fileRef.current) fileRef.current.value = '';
      load();
    });
  }

  return (
    <div className="card flex flex-col h-[calc(100vh-180px)]">
      <div className="px-5 py-3.5 border-b border-ink-100">
        <p className="font-semibold text-ink-800">{title}</p>
        {subtitle && <p className="text-xs text-ink-400">{subtitle}</p>}
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((m) => (
          <div key={m.id} className={`flex ${m.isMe ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[75%] rounded-2xl px-3.5 py-2.5 ${m.isMe ? 'bg-brand-600 text-white' : 'bg-ink-100 text-ink-800'}`}>
              {!m.isMe && <p className="text-[11px] font-semibold opacity-70 mb-0.5">{m.senderName}{m.isClient ? ' (client)' : ''}</p>}
              <p className="text-sm whitespace-pre-wrap break-words">{m.body}</p>
              {m.attachmentPath && (
                <a href={`/api/files/${m.attachmentPath}`} target="_blank" className={`flex items-center gap-1.5 mt-1.5 text-xs underline ${m.isMe ? 'text-white/90' : 'text-brand-700'}`}>
                  <Icon name="Paperclip" size={12} /> {m.attachmentName}
                </a>
              )}
              <p className={`text-[10px] mt-1 ${m.isMe ? 'text-white/60' : 'text-ink-400'}`}>{new Intl.DateTimeFormat('fr-FR', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' }).format(new Date(m.createdAt))}</p>
            </div>
          </div>
        ))}
        {messages.length === 0 && <p className="text-sm text-ink-400 text-center py-8">Aucun message pour le moment</p>}
        <div ref={bottomRef} />
      </div>
      <div className="p-3 border-t border-ink-100 flex items-end gap-2">
        <button onClick={() => fileRef.current?.click()} className="btn-secondary btn-sm !px-2.5 shrink-0"><Icon name="Paperclip" size={16} /></button>
        <input ref={fileRef} type="file" className="hidden" />
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submit(); } }}
          placeholder="Écrire un message…"
          rows={1}
          className="input flex-1 resize-none !py-2.5"
        />
        <button disabled={pending} onClick={submit} className="btn-primary btn-sm shrink-0"><Icon name="Send" size={16} /></button>
      </div>
    </div>
  );
}

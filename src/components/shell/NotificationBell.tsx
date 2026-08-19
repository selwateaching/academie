'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Icon } from '@/components/shell/Icon';

type Notif = { id: string; title: string; body: string | null; link: string | null; read: boolean; createdAt: string; type: string };

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [notifs, setNotifs] = useState<Notif[]>([]);
  const ref = useRef<HTMLDivElement>(null);

  async function load() {
    const res = await fetch('/api/notifications');
    if (res.ok) setNotifs((await res.json()).notifications ?? []);
  }

  useEffect(() => {
    load();
    const t = setInterval(load, 30000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const unread = notifs.filter((n) => !n.read).length;

  async function markAllRead() {
    await fetch('/api/notifications', { method: 'PATCH' });
    load();
  }

  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen((v) => !v)} className="relative rounded-full p-2.5 hover:bg-ink-100" aria-label="Notifications">
        <Icon name="Bell" size={19} className="text-ink-600" />
        {unread > 0 && (
          <span className="absolute top-1 right-1 h-4 min-w-4 px-0.5 rounded-full bg-rose-600 text-white text-[10px] font-bold flex items-center justify-center">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-80 card p-0 z-50 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-ink-100">
            <p className="font-semibold text-sm text-ink-800">Notifications</p>
            {unread > 0 && (
              <button onClick={markAllRead} className="text-xs text-brand-600 font-medium hover:underline">
                Tout marquer lu
              </button>
            )}
          </div>
          <div className="max-h-96 overflow-y-auto">
            {notifs.length === 0 && <p className="px-4 py-6 text-sm text-ink-400 text-center">Aucune notification</p>}
            {notifs.map((n) => (
              <Link
                key={n.id}
                href={n.link ?? '#'}
                onClick={() => setOpen(false)}
                className={`block px-4 py-3 border-b border-ink-50 last:border-0 hover:bg-ink-50 ${!n.read ? 'bg-brand-50/40' : ''}`}
              >
                <p className="text-sm font-medium text-ink-800">{n.title}</p>
                {n.body && <p className="text-xs text-ink-500 mt-0.5 line-clamp-2">{n.body}</p>}
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

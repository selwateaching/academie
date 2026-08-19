'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { EVENT_TYPES } from '@/lib/enums';
import { rescheduleEvent, deleteEvent } from './actions';
import { Icon } from '@/components/shell/Icon';

type Ev = { id: string; title: string; type: string; start: string; end: string; chantierName?: string | null; clientName?: string | null };

export function MonthCalendar({ year, month, events }: { year: number; month: number; events: Ev[] }) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [dragId, setDragId] = useState<string | null>(null);
  const [selected, setSelected] = useState<Ev | null>(null);

  const first = new Date(year, month, 1);
  const startWeekday = (first.getDay() + 6) % 7; // Monday = 0
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (number | null)[] = [...Array(startWeekday).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)];
  while (cells.length % 7 !== 0) cells.push(null);

  const eventsByDay = new Map<number, Ev[]>();
  for (const e of events) {
    const d = new Date(e.start);
    if (d.getFullYear() === year && d.getMonth() === month) {
      const day = d.getDate();
      eventsByDay.set(day, [...(eventsByDay.get(day) ?? []), e]);
    }
  }

  function changeMonth(delta: number) {
    const d = new Date(year, month + delta, 1);
    router.push(`/calendrier?year=${d.getFullYear()}&month=${d.getMonth()}`);
  }

  function onDrop(day: number) {
    if (!dragId) return;
    const ev = events.find((e) => e.id === dragId);
    if (!ev) return;
    const orig = new Date(ev.start);
    const newStart = new Date(year, month, day, orig.getHours(), orig.getMinutes());
    startTransition(() => rescheduleEvent(dragId, newStart.toISOString()));
    setDragId(null);
  }

  const today = new Date();

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <button onClick={() => changeMonth(-1)} className="btn-secondary btn-sm !px-2.5"><Icon name="ChevronLeft" size={16} /></button>
          <h2 className="font-semibold text-lg text-ink-800 capitalize w-48 text-center">
            {new Intl.DateTimeFormat('fr-FR', { month: 'long', year: 'numeric' }).format(first)}
          </h2>
          <button onClick={() => changeMonth(1)} className="btn-secondary btn-sm !px-2.5"><Icon name="ChevronRight" size={16} /></button>
        </div>
        <Link href="/calendrier/nouveau" className="btn-primary btn-sm"><Icon name="Plus" size={14} /> Nouveau rendez-vous</Link>
      </div>

      <div className="grid grid-cols-7 gap-1.5 text-xs font-semibold text-ink-400 uppercase mb-1.5 px-1">
        {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map((d) => <div key={d} className="text-center">{d}</div>)}
      </div>
      <div className="grid grid-cols-7 gap-1.5">
        {cells.map((day, i) => {
          const isToday = day && today.getFullYear() === year && today.getMonth() === month && today.getDate() === day;
          const dayEvents = day ? eventsByDay.get(day) ?? [] : [];
          return (
            <div
              key={i}
              onDragOver={(e) => day && e.preventDefault()}
              onDrop={() => day && onDrop(day)}
              className={`min-h-24 rounded-xl border p-1.5 ${day ? 'bg-white border-ink-100' : 'bg-transparent border-transparent'} ${isToday ? 'ring-2 ring-brand-500' : ''}`}
            >
              {day && (
                <>
                  <p className={`text-xs font-semibold mb-1 ${isToday ? 'text-brand-600' : 'text-ink-400'}`}>{day}</p>
                  <div className="space-y-1">
                    {dayEvents.slice(0, 3).map((e) => (
                      <button
                        key={e.id}
                        draggable
                        onDragStart={() => setDragId(e.id)}
                        onClick={() => setSelected(e)}
                        className="w-full text-left truncate rounded px-1.5 py-0.5 text-[10px] font-medium text-white"
                        style={{ backgroundColor: (EVENT_TYPES as any)[e.type]?.color ?? '#64748b' }}
                      >
                        {new Intl.DateTimeFormat('fr-FR', { hour: '2-digit', minute: '2-digit' }).format(new Date(e.start))} {e.title}
                      </button>
                    ))}
                    {dayEvents.length > 3 && <p className="text-[10px] text-ink-400 px-1">+{dayEvents.length - 3} autre(s)</p>}
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>

      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setSelected(null)}>
          <div className="card p-5 max-w-sm w-full" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-2 mb-2">
              <span className="h-3 w-3 rounded-full" style={{ backgroundColor: (EVENT_TYPES as any)[selected.type]?.color }} />
              <p className="font-semibold text-ink-800">{selected.title}</p>
            </div>
            <p className="text-sm text-ink-500 mb-1">{new Intl.DateTimeFormat('fr-FR', { dateStyle: 'full', timeStyle: 'short' }).format(new Date(selected.start))}</p>
            {selected.chantierName && <p className="text-sm text-ink-500">Chantier : {selected.chantierName}</p>}
            {selected.clientName && <p className="text-sm text-ink-500">Client : {selected.clientName}</p>}
            <div className="flex gap-2 mt-4">
              <button
                onClick={() => { startTransition(() => deleteEvent(selected.id)); setSelected(null); }}
                className="btn-danger btn-sm"
              >
                <Icon name="Trash2" size={14} /> Supprimer
              </button>
              <button onClick={() => setSelected(null)} className="btn-secondary btn-sm">Fermer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

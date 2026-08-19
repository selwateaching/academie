'use client';

import { useState, useTransition } from 'react';
import { clockIn, clockOut } from './actions';
import { Icon } from '@/components/shell/Icon';

export function ClockWidget({ chantiers, openEntry }: { chantiers: { id: string; name: string }[]; openEntry: { id: string; startTime: string; chantierName?: string | null } | null }) {
  const [chantierId, setChantierId] = useState(chantiers[0]?.id ?? '');
  const [pending, startTransition] = useTransition();

  if (openEntry) {
    const started = new Date(openEntry.startTime);
    return (
      <div className="card p-5 bg-emerald-50 border-emerald-200">
        <div className="flex items-center gap-2 mb-2">
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
          <p className="font-semibold text-emerald-800">Journée en cours{openEntry.chantierName ? ` · ${openEntry.chantierName}` : ''}</p>
        </div>
        <p className="text-sm text-emerald-700 mb-3">Démarrée à {new Intl.DateTimeFormat('fr-FR', { hour: '2-digit', minute: '2-digit' }).format(started)}</p>
        <button disabled={pending} onClick={() => startTransition(() => clockOut())} className="btn-danger w-full">
          <Icon name="Square" size={16} /> Terminer ma journée
        </button>
      </div>
    );
  }

  return (
    <div className="card p-5">
      <p className="font-semibold text-ink-800 mb-3">Pointage</p>
      <select value={chantierId} onChange={(e) => setChantierId(e.target.value)} className="select mb-3">
        <option value="">Sans chantier</option>
        {chantiers.map((c) => (<option key={c.id} value={c.id}>{c.name}</option>))}
      </select>
      <button disabled={pending} onClick={() => startTransition(() => clockIn(chantierId))} className="btn-primary w-full">
        <Icon name="Play" size={16} /> Commencer ma journée
      </button>
    </div>
  );
}

'use client';

import { useTransition, useState } from 'react';
import { CHANTIER_STATUSES } from '@/lib/enums';
import { updateChantierStatus, updateChantierProgress } from '../actions';

export function ChantierStatusSelect({ chantierId, currentStatus }: { chantierId: string; currentStatus: string }) {
  const [pending, startTransition] = useTransition();
  return (
    <select
      defaultValue={currentStatus}
      disabled={pending}
      onChange={(e) => startTransition(() => updateChantierStatus(chantierId, e.target.value))}
      className="select"
    >
      {Object.entries(CHANTIER_STATUSES).map(([k, v]) => (
        <option key={k} value={k}>{v.label}</option>
      ))}
    </select>
  );
}

export function ChantierProgressSlider({ chantierId, currentProgress }: { chantierId: string; currentProgress: number }) {
  const [value, setValue] = useState(currentProgress);
  const [, startTransition] = useTransition();
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs font-semibold text-ink-500">Avancement</span>
        <span className="text-sm font-bold text-brand-700">{value}%</span>
      </div>
      <input
        type="range" min={0} max={100} step={5} value={value}
        onChange={(e) => setValue(Number(e.target.value))}
        onMouseUp={() => startTransition(() => updateChantierProgress(chantierId, value))}
        onTouchEnd={() => startTransition(() => updateChantierProgress(chantierId, value))}
        className="w-full accent-brand-600"
      />
    </div>
  );
}

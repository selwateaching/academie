'use client';

import { useTransition } from 'react';
import { PROSPECT_STATUSES } from '@/lib/enums';
import { updateProspectStatus } from './actions';

export function ProspectStatusSelect({ prospectId, currentStatus }: { prospectId: string; currentStatus: string }) {
  const [pending, startTransition] = useTransition();
  return (
    <select
      defaultValue={currentStatus}
      disabled={pending}
      onChange={(e) => startTransition(() => updateProspectStatus(prospectId, e.target.value))}
      onClick={(e) => e.stopPropagation()}
      className="select !py-1 !text-xs !pr-7 w-full"
    >
      {Object.entries(PROSPECT_STATUSES).map(([k, v]) => (
        <option key={k} value={k}>{v.label}</option>
      ))}
    </select>
  );
}

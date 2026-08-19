'use client';

import { useTransition } from 'react';
import { ROLES } from '@/lib/enums';
import { updateUserRole } from './actions';

export function RoleSelect({ userId, currentRole }: { userId: string; currentRole: string }) {
  const [pending, startTransition] = useTransition();
  return (
    <select
      defaultValue={currentRole}
      disabled={pending}
      onChange={(e) => startTransition(() => updateUserRole(userId, e.target.value))}
      className="select !py-1.5 !text-xs !pr-7 w-auto"
    >
      {Object.entries(ROLES).map(([k, v]) => (
        <option key={k} value={k}>{v.label}</option>
      ))}
    </select>
  );
}

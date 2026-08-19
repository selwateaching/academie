'use client';

import { useTransition } from 'react';
import { updateTaskStatus, deleteTask } from './actions';
import { TASK_PRIORITIES, TASK_STATUSES, fmtDate } from '@/lib/enums';
import { Icon } from '@/components/shell/Icon';

type T = { id: string; title: string; priority: string; status: string; dueDate: string | null; chantierName?: string | null; clientName?: string | null; assigneeName?: string | null };

export function TaskCard({ task }: { task: T }) {
  const [, startTransition] = useTransition();
  const overdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'TERMINEE';

  return (
    <div className={`card p-3.5 ${overdue ? 'border-rose-200' : ''}`}>
      <div className="flex items-start justify-between gap-2 mb-1.5">
        <p className="text-sm font-semibold text-ink-800">{task.title}</p>
        <button onClick={() => startTransition(() => deleteTask(task.id))} className="text-ink-300 hover:text-rose-500 shrink-0"><Icon name="X" size={14} /></button>
      </div>
      <span className={`badge ${(TASK_PRIORITIES as any)[task.priority]?.color} border-0 mb-2`}>{(TASK_PRIORITIES as any)[task.priority]?.label}</span>
      {(task.chantierName || task.clientName) && <p className="text-xs text-ink-400 truncate">{task.chantierName ?? task.clientName}</p>}
      {task.assigneeName && <p className="text-xs text-ink-400">👤 {task.assigneeName}</p>}
      {task.dueDate && <p className={`text-xs mt-1 ${overdue ? 'text-rose-600 font-medium' : 'text-ink-400'}`}>{fmtDate(task.dueDate)}</p>}
      <select
        defaultValue={task.status}
        onChange={(e) => startTransition(() => updateTaskStatus(task.id, e.target.value))}
        className="select !py-1 !text-xs mt-2 w-full"
      >
        {Object.entries(TASK_STATUSES).map(([k, v]) => (<option key={k} value={k}>{v.label}</option>))}
      </select>
    </div>
  );
}

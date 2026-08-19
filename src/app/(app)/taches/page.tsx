import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { requireUser } from '@/lib/session';
import { PageHeader, EmptyState } from '@/components/ui/PageHeader';
import { Icon } from '@/components/shell/Icon';
import { TASK_STATUSES } from '@/lib/enums';
import { TaskCard } from './TaskCard';

export const dynamic = 'force-dynamic';

export default async function TachesPage() {
  const user = await requireUser();
  const tasks = await prisma.task.findMany({
    where: { companyId: user.companyId },
    include: { chantier: true, client: true, assignedTo: true },
    orderBy: [{ priority: 'desc' }, { dueDate: 'asc' }],
  });

  const columns = Object.entries(TASK_STATUSES);

  return (
    <div>
      <PageHeader
        title="Tâches"
        description={`${tasks.length} tâche${tasks.length > 1 ? 's' : ''}`}
        actions={<Link href="/taches/nouveau" className="btn-primary"><Icon name="Plus" size={16} /> Nouvelle tâche</Link>}
      />
      {tasks.length === 0 ? (
        <EmptyState title="Aucune tâche" action={<Link href="/taches/nouveau" className="btn-primary">Nouvelle tâche</Link>} />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {columns.map(([key, meta]) => (
            <div key={key}>
              <p className="text-xs font-bold uppercase tracking-wide text-ink-500 mb-2 px-1">{meta.label} ({tasks.filter((t) => t.status === key).length})</p>
              <div className="space-y-2">
                {tasks.filter((t) => t.status === key).map((t) => (
                  <TaskCard
                    key={t.id}
                    task={{
                      id: t.id, title: t.title, priority: t.priority, status: t.status,
                      dueDate: t.dueDate ? t.dueDate.toISOString() : null,
                      chantierName: t.chantier?.name, clientName: t.client ? `${t.client.firstName} ${t.client.lastName}` : null,
                      assigneeName: t.assignedTo?.name,
                    }}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { requireUser } from '@/lib/session';
import { PageHeader, EmptyState } from '@/components/ui/PageHeader';
import { Icon } from '@/components/shell/Icon';
import { PROSPECT_STATUSES, fmtEUR, fmtDate } from '@/lib/enums';
import { ProspectStatusSelect } from './ProspectStatusSelect';

export const dynamic = 'force-dynamic';

export default async function ProspectsPage() {
  const user = await requireUser();
  const prospects = await prisma.prospect.findMany({ where: { companyId: user.companyId }, orderBy: { createdAt: 'desc' } });

  const columns = Object.entries(PROSPECT_STATUSES);

  return (
    <div>
      <PageHeader
        title="Prospects"
        description={`${prospects.length} prospect${prospects.length > 1 ? 's' : ''} dans le pipeline`}
        actions={<Link href="/prospects/nouveau" className="btn-primary"><Icon name="Plus" size={16} /> Nouveau prospect</Link>}
      />

      {prospects.length === 0 ? (
        <EmptyState title="Aucun prospect" description="Ajoutez vos premières opportunités commerciales." action={<Link href="/prospects/nouveau" className="btn-primary">Nouveau prospect</Link>} />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          {columns.map(([key, meta]) => {
            const items = prospects.filter((p) => p.status === key);
            return (
              <div key={key} className="min-w-0">
                <div className="flex items-center justify-between mb-2 px-1">
                  <p className="text-xs font-bold uppercase tracking-wide text-ink-500">{meta.label}</p>
                  <span className="text-xs text-ink-400">{items.length}</span>
                </div>
                <div className="space-y-2">
                  {items.map((p) => (
                    <Link key={p.id} href={`/prospects/${p.id}`} className="block card p-3 hover:shadow-pop transition-shadow">
                      <p className="font-semibold text-sm text-ink-800 truncate">{p.firstName} {p.lastName}</p>
                      {p.companyName && <p className="text-xs text-ink-400 truncate">{p.companyName}</p>}
                      {p.estimatedAmount != null && <p className="text-xs font-medium text-brand-700 mt-1">{fmtEUR(p.estimatedAmount)}</p>}
                      {p.nextActionDate && <p className="text-[11px] text-ink-400 mt-1">Prochaine action : {fmtDate(p.nextActionDate)}</p>}
                      <div className="mt-2" onClick={(e) => e.preventDefault()}>
                        <ProspectStatusSelect prospectId={p.id} currentStatus={p.status} />
                      </div>
                    </Link>
                  ))}
                  {items.length === 0 && <p className="text-xs text-ink-300 text-center py-4">—</p>}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

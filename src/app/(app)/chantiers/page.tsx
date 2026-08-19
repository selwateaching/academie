import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { requireUser } from '@/lib/session';
import { PageHeader, EmptyState } from '@/components/ui/PageHeader';
import { Icon } from '@/components/shell/Icon';
import { StatusBadge } from '@/components/ui/Badge';
import { CHANTIER_STATUSES, fmtDate, fmtEUR } from '@/lib/enums';

export const dynamic = 'force-dynamic';

export default async function ChantiersPage({ searchParams }: { searchParams: { status?: string; q?: string } }) {
  const user = await requireUser();
  const status = searchParams.status ?? '';
  const q = searchParams.q?.trim() ?? '';

  const chantiers = await prisma.chantier.findMany({
    where: {
      companyId: user.companyId,
      ...(status ? { status } : {}),
      ...(q ? { name: { contains: q } } : {}),
    },
    include: { client: true, manager: true },
    orderBy: { createdAt: 'desc' },
  });

  return (
    <div>
      <PageHeader
        title="Chantiers"
        description={`${chantiers.length} chantier${chantiers.length > 1 ? 's' : ''}`}
        actions={
          <>
            <Link href="/carte" className="btn-secondary"><Icon name="Map" size={16} /> Voir la carte</Link>
            <Link href="/chantiers/nouveau" className="btn-primary"><Icon name="Plus" size={16} /> Nouveau chantier</Link>
          </>
        }
      />

      <form className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1">
          <Icon name="Search" size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" />
          <input name="q" defaultValue={q} placeholder="Nom du chantier…" className="input !pl-9" />
        </div>
        <select name="status" defaultValue={status} className="select w-full sm:w-56">
          <option value="">Tous les statuts</option>
          {Object.entries(CHANTIER_STATUSES).map(([k, v]) => (
            <option key={k} value={k}>{v.label}</option>
          ))}
        </select>
        <button className="btn-secondary">Filtrer</button>
      </form>

      {chantiers.length === 0 ? (
        <EmptyState title="Aucun chantier" action={<Link href="/chantiers/nouveau" className="btn-primary">Nouveau chantier</Link>} />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {chantiers.map((c) => (
            <Link key={c.id} href={`/chantiers/${c.id}`} className="card p-4 hover:shadow-pop transition-shadow">
              <div className="flex items-start justify-between gap-2 mb-2">
                <p className="font-semibold text-ink-800 truncate">{c.name}</p>
                <StatusBadge map={CHANTIER_STATUSES} value={c.status} />
              </div>
              <p className="text-xs text-ink-400 mb-1">{c.client.firstName} {c.client.lastName}</p>
              <p className="text-xs text-ink-400 mb-3 truncate">{c.address}</p>
              <div className="h-2 rounded-full bg-ink-100 overflow-hidden mb-1">
                <div className="h-full bg-brand-600 rounded-full" style={{ width: `${c.progress}%` }} />
              </div>
              <div className="flex items-center justify-between text-xs text-ink-500">
                <span>{c.progress}% terminé</span>
                <span>{fmtEUR(c.revenuePlanned)}</span>
              </div>
              <div className="flex items-center justify-between text-xs text-ink-400 mt-2 pt-2 border-t border-ink-100">
                <span>{c.manager?.name ?? 'Sans responsable'}</span>
                <span>{fmtDate(c.startDate)}</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

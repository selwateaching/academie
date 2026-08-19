import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { requireUser } from '@/lib/session';
import { PageHeader, EmptyState } from '@/components/ui/PageHeader';
import { Icon } from '@/components/shell/Icon';

export const dynamic = 'force-dynamic';

export default async function FournisseursPage({ searchParams }: { searchParams: { q?: string } }) {
  const user = await requireUser();
  const q = searchParams.q?.trim() ?? '';
  const suppliers = await prisma.supplier.findMany({
    where: { companyId: user.companyId, ...(q ? { name: { contains: q } } : {}) },
    include: { _count: { select: { materials: true, orders: true } } },
    orderBy: { name: 'asc' },
  });

  return (
    <div>
      <PageHeader
        title="Fournisseurs"
        description={`${suppliers.length} fournisseur${suppliers.length > 1 ? 's' : ''}`}
        actions={<Link href="/fournisseurs/nouveau" className="btn-primary"><Icon name="Plus" size={16} /> Nouveau fournisseur</Link>}
      />
      <form className="flex gap-3 mb-5">
        <div className="relative flex-1 max-w-md">
          <Icon name="Search" size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" />
          <input name="q" defaultValue={q} placeholder="Rechercher…" className="input !pl-9" />
        </div>
        <button className="btn-secondary">Filtrer</button>
      </form>

      {suppliers.length === 0 ? (
        <EmptyState title="Aucun fournisseur" action={<Link href="/fournisseurs/nouveau" className="btn-primary">Nouveau fournisseur</Link>} />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {suppliers.map((s) => (
            <Link key={s.id} href={`/fournisseurs/${s.id}`} className="card p-4 hover:shadow-pop">
              <p className="font-semibold text-ink-800">{s.name}</p>
              <p className="text-xs text-ink-400 mt-0.5">{s.contactName}</p>
              <p className="text-xs text-ink-400">{s.phone} {s.email ? `· ${s.email}` : ''}</p>
              <div className="flex gap-4 mt-3 pt-2 border-t border-ink-100 text-xs text-ink-500">
                <span>{s._count.materials} matériaux</span>
                <span>{s._count.orders} commandes</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

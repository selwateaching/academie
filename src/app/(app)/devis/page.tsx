import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { requireUser } from '@/lib/session';
import { PageHeader, EmptyState } from '@/components/ui/PageHeader';
import { Icon } from '@/components/shell/Icon';
import { StatusBadge } from '@/components/ui/Badge';
import { DEVIS_STATUSES, fmtDate, fmtEUR } from '@/lib/enums';

export const dynamic = 'force-dynamic';

export default async function DevisPage({ searchParams }: { searchParams: { status?: string; q?: string } }) {
  const user = await requireUser();
  const status = searchParams.status ?? '';
  const q = searchParams.q?.trim() ?? '';

  const devisList = await prisma.devis.findMany({
    where: {
      companyId: user.companyId,
      ...(status ? { status } : {}),
      ...(q ? { OR: [{ number: { contains: q } }, { client: { firstName: { contains: q } } }, { client: { lastName: { contains: q } } }] } : {}),
    },
    include: { client: true, chantier: true },
    orderBy: { createdAt: 'desc' },
  });

  const total = devisList.reduce((s, d) => s + d.totalTTC, 0);

  return (
    <div>
      <PageHeader
        title="Devis"
        description={`${devisList.length} devis · ${fmtEUR(total)}`}
        actions={<Link href="/devis/nouveau" className="btn-primary"><Icon name="Plus" size={16} /> Nouveau devis</Link>}
      />

      <form className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1">
          <Icon name="Search" size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" />
          <input name="q" defaultValue={q} placeholder="Numéro, client…" className="input !pl-9" />
        </div>
        <select name="status" defaultValue={status} className="select w-full sm:w-56">
          <option value="">Tous les statuts</option>
          {Object.entries(DEVIS_STATUSES).map(([k, v]) => (
            <option key={k} value={k}>{v.label}</option>
          ))}
        </select>
        <button className="btn-secondary">Filtrer</button>
      </form>

      {devisList.length === 0 ? (
        <EmptyState title="Aucun devis" action={<Link href="/devis/nouveau" className="btn-primary">Nouveau devis</Link>} />
      ) : (
        <div className="table-wrap">
          <table className="data">
            <thead>
              <tr>
                <th>N°</th><th>Client</th><th>Chantier</th><th>Date</th><th>Validité</th><th>Montant TTC</th><th>Statut</th><th></th>
              </tr>
            </thead>
            <tbody>
              {devisList.map((d) => (
                <tr key={d.id}>
                  <td><Link href={`/devis/${d.id}`} className="font-semibold text-brand-700 hover:underline">{d.number}</Link></td>
                  <td>{d.client.firstName} {d.client.lastName}</td>
                  <td className="text-ink-500">{d.chantier?.name ?? '—'}</td>
                  <td className="text-ink-500">{fmtDate(d.date)}</td>
                  <td className="text-ink-500">{fmtDate(d.validUntil)}</td>
                  <td className="font-medium">{fmtEUR(d.totalTTC)}</td>
                  <td><StatusBadge map={DEVIS_STATUSES} value={d.status} /></td>
                  <td><Link href={`/devis/${d.id}`} className="btn-secondary btn-sm">Ouvrir</Link></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

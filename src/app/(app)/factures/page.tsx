import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { requireUser } from '@/lib/session';
import { PageHeader, EmptyState } from '@/components/ui/PageHeader';
import { Icon } from '@/components/shell/Icon';
import { StatusBadge } from '@/components/ui/Badge';
import { FACTURE_STATUSES, FACTURE_TYPES, fmtDate, fmtEUR } from '@/lib/enums';
import { syncFactureStatuses } from '@/lib/factureStatus';

export const dynamic = 'force-dynamic';

export default async function FacturesPage({ searchParams }: { searchParams: { status?: string; q?: string } }) {
  const user = await requireUser();
  await syncFactureStatuses(user.companyId);

  const status = searchParams.status ?? '';
  const q = searchParams.q?.trim() ?? '';

  const factures = await prisma.facture.findMany({
    where: {
      companyId: user.companyId,
      ...(status ? { status } : {}),
      ...(q ? { OR: [{ number: { contains: q } }, { client: { firstName: { contains: q } } }, { client: { lastName: { contains: q } } }] } : {}),
    },
    include: { client: true, chantier: true },
    orderBy: { createdAt: 'desc' },
  });

  const totalDue = factures.filter((f) => f.status !== 'PAYEE' && f.status !== 'BROUILLON').reduce((s, f) => s + (f.totalTTC - f.paidAmount), 0);

  return (
    <div>
      <PageHeader
        title="Factures"
        description={`${factures.length} facture${factures.length > 1 ? 's' : ''} · ${fmtEUR(totalDue)} restant dû`}
        actions={<Link href="/factures/nouveau" className="btn-primary"><Icon name="Plus" size={16} /> Nouvelle facture</Link>}
      />

      <form className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1">
          <Icon name="Search" size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" />
          <input name="q" defaultValue={q} placeholder="Numéro, client…" className="input !pl-9" />
        </div>
        <select name="status" defaultValue={status} className="select w-full sm:w-56">
          <option value="">Tous les statuts</option>
          {Object.entries(FACTURE_STATUSES).map(([k, v]) => (
            <option key={k} value={k}>{v.label}</option>
          ))}
        </select>
        <button className="btn-secondary">Filtrer</button>
      </form>

      {factures.length === 0 ? (
        <EmptyState title="Aucune facture" action={<Link href="/factures/nouveau" className="btn-primary">Nouvelle facture</Link>} />
      ) : (
        <div className="table-wrap">
          <table className="data">
            <thead>
              <tr><th>N°</th><th>Client</th><th>Type</th><th>Échéance</th><th>Total TTC</th><th>Reste dû</th><th>Statut</th><th></th></tr>
            </thead>
            <tbody>
              {factures.map((f) => (
                <tr key={f.id}>
                  <td><Link href={`/factures/${f.id}`} className="font-semibold text-brand-700 hover:underline">{f.number}</Link></td>
                  <td>{f.client.firstName} {f.client.lastName}</td>
                  <td className="text-ink-500 text-xs">{FACTURE_TYPES[f.type as keyof typeof FACTURE_TYPES]}</td>
                  <td className="text-ink-500">{fmtDate(f.dueDate)}</td>
                  <td className="font-medium">{fmtEUR(f.totalTTC)}</td>
                  <td className={f.totalTTC - f.paidAmount > 0 ? 'text-rose-600 font-medium' : 'text-ink-400'}>{fmtEUR(f.totalTTC - f.paidAmount)}</td>
                  <td><StatusBadge map={FACTURE_STATUSES} value={f.status} /></td>
                  <td><Link href={`/factures/${f.id}`} className="btn-secondary btn-sm">Ouvrir</Link></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

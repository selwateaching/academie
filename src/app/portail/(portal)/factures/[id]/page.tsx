import { notFound } from 'next/navigation';
import { requireClientSession } from '@/lib/clientAuth';
import { prisma } from '@/lib/prisma';
import { StatusBadge } from '@/components/ui/Badge';
import { FACTURE_STATUSES, LINE_TYPES, fmtDate, fmtEUR } from '@/lib/enums';
import { computeTotals } from '@/lib/calc';
import { Icon } from '@/components/shell/Icon';

export default async function PortalFactureDetailPage({ params }: { params: { id: string } }) {
  const session = await requireClientSession();
  const facture = await prisma.facture.findFirst({ where: { id: params.id, clientId: session.clientId }, include: { lines: { orderBy: { order: 'asc' } } } });
  if (!facture) notFound();
  const totals = computeTotals(facture.lines, facture.discountPct);

  return (
    <div className="max-w-2xl">
      <div className="flex items-center justify-between mb-1">
        <h1 className="text-xl font-bold text-ink-900">{facture.number}</h1>
        <StatusBadge map={FACTURE_STATUSES} value={facture.status} />
      </div>
      <p className="text-sm text-ink-400 mb-5">Émise le {fmtDate(facture.date)} · Échéance {fmtDate(facture.dueDate)}</p>

      <a href={`/portail/factures/${facture.id}/pdf`} target="_blank" className="btn-primary !bg-emerald-600 hover:!bg-emerald-700 mb-5 inline-flex">
        <Icon name="Download" size={16} /> Télécharger la facture
      </a>

      <div className="card p-5">
        <div className="table-wrap !shadow-none !border-ink-100">
          <table className="data">
            <thead><tr><th>Description</th><th>Qté</th><th className="text-right">Total HT</th></tr></thead>
            <tbody>
              {facture.lines.map((l) => (
                <tr key={l.id}>
                  <td><span className="badge bg-ink-100 text-ink-500 border-ink-200 mr-2">{LINE_TYPES[l.type as keyof typeof LINE_TYPES]}</span>{l.description}</td>
                  <td>{l.quantity} {l.unit}</td>
                  <td className="text-right font-medium">{fmtEUR(l.quantity * l.unitPrice)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-4 flex justify-end">
          <div className="w-56 space-y-1 text-sm">
            <div className="flex justify-between"><span className="text-ink-500">Total TTC</span><span className="font-bold">{fmtEUR(totals.totalTTC)}</span></div>
            <div className="flex justify-between"><span className="text-ink-500">Réglé</span><span>{fmtEUR(facture.paidAmount)}</span></div>
            <div className="flex justify-between font-semibold border-t border-ink-200 pt-1.5 mt-1.5"><span>Reste dû</span><span className={totals.totalTTC - facture.paidAmount > 0 ? 'text-rose-600' : 'text-emerald-600'}>{fmtEUR(totals.totalTTC - facture.paidAmount)}</span></div>
          </div>
        </div>
      </div>
    </div>
  );
}

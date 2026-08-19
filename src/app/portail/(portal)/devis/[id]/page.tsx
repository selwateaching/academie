import { notFound } from 'next/navigation';
import { requireClientSession } from '@/lib/clientAuth';
import { prisma } from '@/lib/prisma';
import { StatusBadge } from '@/components/ui/Badge';
import { DEVIS_STATUSES, LINE_TYPES, fmtDate, fmtEUR } from '@/lib/enums';
import { computeTotals } from '@/lib/calc';
import { DevisActions } from './DevisActions';

export default async function PortalDevisDetailPage({ params }: { params: { id: string } }) {
  const session = await requireClientSession();
  const devis = await prisma.devis.findFirst({
    where: { id: params.id, clientId: session.clientId },
    include: { lines: { orderBy: { order: 'asc' } }, signatures: true },
  });
  if (!devis) notFound();

  if (devis.status === 'ENVOYE') {
    await prisma.devis.update({ where: { id: devis.id }, data: { status: 'CONSULTE', viewedAt: new Date() } });
  }

  const totals = computeTotals(devis.lines, devis.discountPct);

  return (
    <div className="max-w-2xl">
      <div className="flex items-center justify-between mb-1">
        <h1 className="text-xl font-bold text-ink-900">{devis.number}</h1>
        <StatusBadge map={DEVIS_STATUSES} value={devis.status} />
      </div>
      <p className="text-sm text-ink-400 mb-3">Émis le {fmtDate(devis.date)} · Valide jusqu'au {fmtDate(devis.validUntil)}</p>
      <a href={`/portail/devis/${devis.id}/pdf`} target="_blank" className="btn-secondary mb-5 inline-flex">Télécharger le PDF</a>

      <div className="card p-5 mb-5">
        <div className="table-wrap !shadow-none !border-ink-100">
          <table className="data">
            <thead><tr><th>Description</th><th>Qté</th><th className="text-right">Total HT</th></tr></thead>
            <tbody>
              {devis.lines.map((l) => (
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
            <div className="flex justify-between"><span className="text-ink-500">Total HT</span><span>{fmtEUR(totals.netHT)}</span></div>
            <div className="flex justify-between"><span className="text-ink-500">TVA</span><span>{fmtEUR(totals.vatAmount)}</span></div>
            <div className="flex justify-between font-bold text-base border-t border-ink-200 pt-1.5 mt-1.5"><span>Total TTC</span><span className="text-emerald-700">{fmtEUR(totals.totalTTC)}</span></div>
          </div>
        </div>
      </div>

      {devis.signatures.length > 0 ? (
        <div className="card p-5">
          <p className="text-sm font-semibold text-ink-800 mb-2">Signé électroniquement</p>
          <img src={devis.signatures[0].signatureImage} className="border border-ink-100 rounded-lg bg-white max-h-24" alt="signature" />
          <p className="text-xs text-ink-400 mt-1">{devis.signatures[0].signerName} · {fmtDate(devis.signatures[0].signedAt)}</p>
        </div>
      ) : ['ENVOYE', 'CONSULTE'].includes(devis.status) ? (
        <DevisActions devisId={devis.id} />
      ) : null}
    </div>
  );
}

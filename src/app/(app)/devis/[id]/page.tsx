import { notFound } from 'next/navigation';
import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { requireUser } from '@/lib/session';
import { PageHeader } from '@/components/ui/PageHeader';
import { Icon } from '@/components/shell/Icon';
import { StatusBadge } from '@/components/ui/Badge';
import { ConfirmSubmitButton } from '@/components/ui/ConfirmSubmit';
import { DEVIS_STATUSES, LINE_TYPES, fmtDate, fmtEUR } from '@/lib/enums';
import { computeTotals } from '@/lib/calc';
import { deleteDevis, duplicateDevis, sendDevis, respondDevis, convertDevisToFacture } from '../actions';

export default async function DevisDetailPage({ params }: { params: { id: string } }) {
  const user = await requireUser();
  const devis = await prisma.devis.findFirst({
    where: { id: params.id, companyId: user.companyId },
    include: { client: true, chantier: true, lines: { orderBy: { order: 'asc' } }, factures: true, signatures: true },
  });
  if (!devis) notFound();

  const totals = computeTotals(devis.lines, devis.discountPct);

  return (
    <div className="max-w-5xl">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <PageHeader title={devis.number} description={`${devis.client.firstName} ${devis.client.lastName}${devis.chantier ? ' · ' + devis.chantier.name : ''}`} />
        <StatusBadge map={DEVIS_STATUSES} value={devis.status} />
      </div>

      <div className="flex flex-wrap gap-2 mb-6">
        <a href={`/devis/${devis.id}/pdf`} target="_blank" className="btn-secondary btn-sm"><Icon name="Download" size={14} /> Télécharger PDF</a>
        <a href={`/devis/${devis.id}/pdf`} target="_blank" className="btn-secondary btn-sm"><Icon name="Printer" size={14} /> Imprimer</a>
        {devis.status === 'BROUILLON' && (
          <form action={sendDevis.bind(null, devis.id)}>
            <button className="btn-primary btn-sm"><Icon name="Send" size={14} /> Envoyer par email</button>
          </form>
        )}
        {['ENVOYE', 'CONSULTE'].includes(devis.status) && (
          <>
            <form action={respondDevis.bind(null, devis.id, true)}>
              <button className="btn-primary btn-sm"><Icon name="Check" size={14} /> Marquer accepté</button>
            </form>
            <form action={respondDevis.bind(null, devis.id, false)}>
              <button className="btn-secondary btn-sm"><Icon name="X" size={14} /> Marquer refusé</button>
            </form>
          </>
        )}
        {devis.status === 'ACCEPTE' && devis.factures.length === 0 && (
          <form action={convertDevisToFacture.bind(null, devis.id, 'STANDARD')}>
            <button className="btn-primary btn-sm"><Icon name="Receipt" size={14} /> Générer la facture</button>
          </form>
        )}
        {devis.status === 'BROUILLON' && (
          <Link href={`/devis/${devis.id}/modifier`} className="btn-secondary btn-sm"><Icon name="Pencil" size={14} /> Modifier</Link>
        )}
        <form action={duplicateDevis.bind(null, devis.id)}>
          <button className="btn-secondary btn-sm"><Icon name="Copy" size={14} /> Dupliquer</button>
        </form>
        <form action={deleteDevis.bind(null, devis.id)}>
          <ConfirmSubmitButton message="Supprimer ce devis ?"><Icon name="Trash2" size={14} /> Supprimer</ConfirmSubmitButton>
        </form>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 card p-5 sm:p-6">
          <div className="table-wrap !shadow-none !border-ink-100">
            <table className="data">
              <thead><tr><th>Description</th><th>Qté</th><th>Unité</th><th>P.U. HT</th><th>TVA</th><th className="text-right">Total HT</th></tr></thead>
              <tbody>
                {devis.lines.map((l) => (
                  <tr key={l.id}>
                    <td>
                      <span className="badge bg-ink-100 text-ink-500 border-ink-200 mr-2">{LINE_TYPES[l.type as keyof typeof LINE_TYPES]}</span>
                      {l.description}
                    </td>
                    <td>{l.quantity}</td>
                    <td>{l.unit}</td>
                    <td>{fmtEUR(l.unitPrice)}</td>
                    <td>{l.vatRate}%</td>
                    <td className="text-right font-medium">{fmtEUR(l.quantity * l.unitPrice)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-5 flex justify-end">
            <div className="w-full sm:w-72 space-y-1.5 text-sm">
              <div className="flex justify-between"><span className="text-ink-500">Total HT</span><span>{fmtEUR(totals.subtotalHT)}</span></div>
              {devis.discountPct > 0 && <div className="flex justify-between text-rose-600"><span>Remise ({devis.discountPct}%)</span><span>-{fmtEUR(totals.discountAmount)}</span></div>}
              <div className="flex justify-between"><span className="text-ink-500">TVA</span><span>{fmtEUR(totals.vatAmount)}</span></div>
              <div className="flex justify-between text-base border-t border-ink-200 pt-1.5 mt-1.5"><span className="font-semibold">Total TTC</span><span className="font-bold text-brand-700">{fmtEUR(totals.totalTTC)}</span></div>
              {devis.depositPct > 0 && <div className="flex justify-between text-ink-500"><span>Acompte ({devis.depositPct}%)</span><span>{fmtEUR((totals.totalTTC * devis.depositPct) / 100)}</span></div>}
            </div>
          </div>
          {devis.notes && (
            <div className="mt-5 pt-4 border-t border-ink-100">
              <p className="text-xs font-semibold text-ink-500 mb-1">Notes</p>
              <p className="text-sm text-ink-700 whitespace-pre-wrap">{devis.notes}</p>
            </div>
          )}
        </div>

        <div className="space-y-5">
          <div className="card p-5 text-sm space-y-2">
            <h3 className="font-semibold text-ink-800 mb-1">Informations</h3>
            <div className="flex justify-between"><span className="text-ink-400">Date</span><span>{fmtDate(devis.date)}</span></div>
            <div className="flex justify-between"><span className="text-ink-400">Validité</span><span>{fmtDate(devis.validUntil)}</span></div>
            <div className="flex justify-between"><span className="text-ink-400">Envoyé le</span><span>{fmtDate(devis.sentAt)}</span></div>
            <div className="flex justify-between"><span className="text-ink-400">Réponse le</span><span>{fmtDate(devis.respondedAt)}</span></div>
            {devis.paymentTerms && <p className="text-ink-500 text-xs pt-2 border-t border-ink-100">{devis.paymentTerms}</p>}
          </div>
          {devis.chantier && (
            <Link href={`/chantiers/${devis.chantier.id}`} className="card p-5 block hover:shadow-pop">
              <p className="text-xs text-ink-400 mb-1">Chantier lié</p>
              <p className="font-semibold text-ink-800">{devis.chantier.name}</p>
            </Link>
          )}
          {devis.factures.length > 0 && (
            <div className="card p-5">
              <p className="text-xs text-ink-400 mb-2">Factures liées</p>
              {devis.factures.map((f) => (
                <Link key={f.id} href={`/factures/${f.id}`} className="block text-sm text-brand-700 hover:underline">{f.number}</Link>
              ))}
            </div>
          )}
          {devis.signatures.length > 0 && (
            <div className="card p-5">
              <p className="text-xs text-ink-400 mb-2 flex items-center gap-1"><Icon name="PenTool" size={14} /> Signature électronique</p>
              <img src={devis.signatures[0].signatureImage} alt="signature" className="border border-ink-100 rounded-lg bg-white max-h-20" />
              <p className="text-xs text-ink-400 mt-1">{devis.signatures[0].signerName} · {fmtDate(devis.signatures[0].signedAt)}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

import { notFound } from 'next/navigation';
import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { requireUser } from '@/lib/session';
import { PageHeader } from '@/components/ui/PageHeader';
import { Icon } from '@/components/shell/Icon';
import { StatusBadge } from '@/components/ui/Badge';
import { ConfirmSubmitButton } from '@/components/ui/ConfirmSubmit';
import { FACTURE_STATUSES, FACTURE_TYPES, LINE_TYPES, PAYMENT_METHODS, fmtDate, fmtEUR } from '@/lib/enums';
import { computeTotals } from '@/lib/calc';
import { deleteFacture, sendFacture, sendReminder, recordPayment } from '../actions';

export default async function FactureDetailPage({ params }: { params: { id: string } }) {
  const user = await requireUser();
  const facture = await prisma.facture.findFirst({
    where: { id: params.id, companyId: user.companyId },
    include: { client: true, chantier: true, devis: true, lines: { orderBy: { order: 'asc' } }, payments: { orderBy: { date: 'desc' } } },
  });
  if (!facture) notFound();

  const totals = computeTotals(facture.lines, facture.discountPct);
  const remaining = totals.totalTTC - facture.paidAmount;

  return (
    <div className="max-w-5xl">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <PageHeader title={facture.number} description={`${facture.client.firstName} ${facture.client.lastName}${facture.chantier ? ' · ' + facture.chantier.name : ''} · ${FACTURE_TYPES[facture.type as keyof typeof FACTURE_TYPES]}`} />
        <StatusBadge map={FACTURE_STATUSES} value={facture.status} />
      </div>

      <div className="flex flex-wrap gap-2 mb-6">
        <a href={`/factures/${facture.id}/pdf`} target="_blank" className="btn-secondary btn-sm"><Icon name="Download" size={14} /> Télécharger PDF</a>
        <a href={`/factures/${facture.id}/pdf`} target="_blank" className="btn-secondary btn-sm"><Icon name="Printer" size={14} /> Imprimer</a>
        {facture.status === 'BROUILLON' && (
          <form action={sendFacture.bind(null, facture.id)}>
            <button className="btn-primary btn-sm"><Icon name="Send" size={14} /> Envoyer par email</button>
          </form>
        )}
        {['EN_RETARD', 'IMPAYEE', 'ENVOYEE'].includes(facture.status) && remaining > 0 && (
          <form action={sendReminder.bind(null, facture.id)}>
            <button className="btn-secondary btn-sm"><Icon name="BellRing" size={14} /> Relancer</button>
          </form>
        )}
        {facture.status === 'BROUILLON' && (
          <Link href={`/factures/${facture.id}/modifier`} className="btn-secondary btn-sm"><Icon name="Pencil" size={14} /> Modifier</Link>
        )}
        <form action={deleteFacture.bind(null, facture.id)}>
          <ConfirmSubmitButton message="Supprimer cette facture ?"><Icon name="Trash2" size={14} /> Supprimer</ConfirmSubmitButton>
        </form>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="card p-5 sm:p-6">
            <div className="table-wrap !shadow-none !border-ink-100">
              <table className="data">
                <thead><tr><th>Description</th><th>Qté</th><th>Unité</th><th>P.U. HT</th><th>TVA</th><th className="text-right">Total HT</th></tr></thead>
                <tbody>
                  {facture.lines.map((l) => (
                    <tr key={l.id}>
                      <td><span className="badge bg-ink-100 text-ink-500 border-ink-200 mr-2">{LINE_TYPES[l.type as keyof typeof LINE_TYPES]}</span>{l.description}</td>
                      <td>{l.quantity}</td><td>{l.unit}</td><td>{fmtEUR(l.unitPrice)}</td><td>{l.vatRate}%</td>
                      <td className="text-right font-medium">{fmtEUR(l.quantity * l.unitPrice)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-5 flex justify-end">
              <div className="w-full sm:w-72 space-y-1.5 text-sm">
                <div className="flex justify-between"><span className="text-ink-500">Total HT</span><span>{fmtEUR(totals.subtotalHT)}</span></div>
                {facture.discountPct > 0 && <div className="flex justify-between text-rose-600"><span>Remise</span><span>-{fmtEUR(totals.discountAmount)}</span></div>}
                <div className="flex justify-between"><span className="text-ink-500">TVA</span><span>{fmtEUR(totals.vatAmount)}</span></div>
                <div className="flex justify-between text-base border-t border-ink-200 pt-1.5 mt-1.5"><span className="font-semibold">Total TTC</span><span className="font-bold text-brand-700">{fmtEUR(totals.totalTTC)}</span></div>
                <div className="flex justify-between text-emerald-600"><span>Réglé</span><span>{fmtEUR(facture.paidAmount)}</span></div>
                <div className="flex justify-between font-semibold"><span>Reste dû</span><span className={remaining > 0 ? 'text-rose-600' : 'text-emerald-600'}>{fmtEUR(remaining)}</span></div>
              </div>
            </div>
          </div>

          <div className="card p-5 sm:p-6">
            <h3 className="font-semibold text-ink-800 mb-3">Paiements</h3>
            {remaining > 0 && (
              <form action={recordPayment.bind(null, facture.id)} className="grid sm:grid-cols-4 gap-2 mb-4">
                <input type="number" step="0.01" name="amount" placeholder="Montant €" required defaultValue={remaining} className="input" />
                <select name="method" className="select">
                  {Object.entries(PAYMENT_METHODS).map(([k, v]) => (
                    <option key={k} value={k}>{v}</option>
                  ))}
                </select>
                <input type="date" name="date" defaultValue={new Date().toISOString().slice(0, 10)} className="input" />
                <button className="btn-primary">Enregistrer le paiement</button>
              </form>
            )}
            <div className="space-y-2">
              {facture.payments.length === 0 && <p className="text-sm text-ink-400 text-center py-4">Aucun paiement enregistré</p>}
              {facture.payments.map((p) => (
                <div key={p.id} className="flex items-center justify-between rounded-xl border border-ink-100 px-3 py-2.5">
                  <div>
                    <p className="text-sm font-medium text-ink-800">{fmtEUR(p.amount)}</p>
                    <p className="text-xs text-ink-400">{PAYMENT_METHODS[p.method as keyof typeof PAYMENT_METHODS]} · {fmtDate(p.date)}</p>
                  </div>
                  <Icon name="CircleCheck" size={16} className="text-emerald-500" />
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-5">
          <div className="card p-5 text-sm space-y-2">
            <h3 className="font-semibold text-ink-800 mb-1">Informations</h3>
            <div className="flex justify-between"><span className="text-ink-400">Date</span><span>{fmtDate(facture.date)}</span></div>
            <div className="flex justify-between"><span className="text-ink-400">Échéance</span><span>{fmtDate(facture.dueDate)}</span></div>
            <div className="flex justify-between"><span className="text-ink-400">Envoyée le</span><span>{fmtDate(facture.sentAt)}</span></div>
            <div className="flex justify-between"><span className="text-ink-400">Dernière relance</span><span>{fmtDate(facture.lastReminderAt)}</span></div>
            {facture.paymentTerms && <p className="text-ink-500 text-xs pt-2 border-t border-ink-100">{facture.paymentTerms}</p>}
          </div>
          {facture.chantier && (
            <Link href={`/chantiers/${facture.chantier.id}`} className="card p-5 block hover:shadow-pop">
              <p className="text-xs text-ink-400 mb-1">Chantier lié</p>
              <p className="font-semibold text-ink-800">{facture.chantier.name}</p>
            </Link>
          )}
          {facture.devis && (
            <Link href={`/devis/${facture.devis.id}`} className="card p-5 block hover:shadow-pop">
              <p className="text-xs text-ink-400 mb-1">Devis d'origine</p>
              <p className="font-semibold text-ink-800">{facture.devis.number}</p>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

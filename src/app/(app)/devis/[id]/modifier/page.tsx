import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { requireUser } from '@/lib/session';
import { PageHeader } from '@/components/ui/PageHeader';
import { LineEditor } from '@/components/forms/LineEditor';
import { updateDevis } from '../../actions';

export default async function ModifierDevisPage({ params }: { params: { id: string } }) {
  const user = await requireUser();
  const [devis, clients, chantiers] = await Promise.all([
    prisma.devis.findFirst({ where: { id: params.id, companyId: user.companyId }, include: { lines: { orderBy: { order: 'asc' } } } }),
    prisma.client.findMany({ where: { companyId: user.companyId }, orderBy: { firstName: 'asc' } }),
    prisma.chantier.findMany({ where: { companyId: user.companyId }, orderBy: { name: 'asc' } }),
  ]);
  if (!devis) notFound();

  const action = updateDevis.bind(null, devis.id);

  return (
    <div className="max-w-4xl">
      <PageHeader title={`Modifier ${devis.number}`} />
      <form action={action} className="card p-6 space-y-6">
        <div className="grid sm:grid-cols-3 gap-4">
          <div>
            <label className="label">Client</label>
            <select name="clientId" required defaultValue={devis.clientId} className="select">
              {clients.map((c) => (
                <option key={c.id} value={c.id}>{c.firstName} {c.lastName}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Chantier</label>
            <select name="chantierId" defaultValue={devis.chantierId ?? ''} className="select">
              <option value="">Aucun</option>
              {chantiers.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Valide jusqu'au</label>
            <input type="date" name="validUntil" defaultValue={devis.validUntil ? devis.validUntil.toISOString().slice(0, 10) : ''} className="input" />
          </div>
        </div>

        <div>
          <label className="label mb-3">Prestations</label>
          <LineEditor initialLines={devis.lines} />
        </div>

        <div className="grid sm:grid-cols-3 gap-4">
          <div>
            <label className="label">Remise globale (%)</label>
            <input type="number" step="0.1" name="discountPct" defaultValue={devis.discountPct} className="input" />
          </div>
          <div>
            <label className="label">Acompte demandé (%)</label>
            <input type="number" step="1" name="depositPct" defaultValue={devis.depositPct} className="input" />
          </div>
          <div>
            <label className="label">Conditions de paiement</label>
            <input name="paymentTerms" defaultValue={devis.paymentTerms ?? ''} className="input" />
          </div>
        </div>
        <div>
          <label className="label">Notes</label>
          <textarea name="notes" defaultValue={devis.notes ?? ''} className="input min-h-20" />
        </div>

        <div className="flex gap-3">
          <button type="submit" className="btn-primary">Enregistrer</button>
          <a href={`/devis/${devis.id}`} className="btn-secondary">Annuler</a>
        </div>
      </form>
    </div>
  );
}

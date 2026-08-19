import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { requireUser } from '@/lib/session';
import { PageHeader } from '@/components/ui/PageHeader';
import { LineEditor } from '@/components/forms/LineEditor';
import { FACTURE_TYPES } from '@/lib/enums';
import { updateFacture } from '../../actions';

export default async function ModifierFacturePage({ params }: { params: { id: string } }) {
  const user = await requireUser();
  const [facture, clients, chantiers] = await Promise.all([
    prisma.facture.findFirst({ where: { id: params.id, companyId: user.companyId }, include: { lines: { orderBy: { order: 'asc' } } } }),
    prisma.client.findMany({ where: { companyId: user.companyId }, orderBy: { firstName: 'asc' } }),
    prisma.chantier.findMany({ where: { companyId: user.companyId }, orderBy: { name: 'asc' } }),
  ]);
  if (!facture) notFound();

  const action = updateFacture.bind(null, facture.id);

  return (
    <div className="max-w-4xl">
      <PageHeader title={`Modifier ${facture.number}`} />
      <form action={action} className="card p-6 space-y-6">
        <div className="grid sm:grid-cols-4 gap-4">
          <div>
            <label className="label">Client</label>
            <select name="clientId" required defaultValue={facture.clientId} className="select">
              {clients.map((c) => (
                <option key={c.id} value={c.id}>{c.firstName} {c.lastName}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Chantier</label>
            <select name="chantierId" defaultValue={facture.chantierId ?? ''} className="select">
              <option value="">Aucun</option>
              {chantiers.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Type</label>
            <select name="type" defaultValue={facture.type} className="select">
              {Object.entries(FACTURE_TYPES).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Échéance</label>
            <input type="date" name="dueDate" defaultValue={facture.dueDate ? facture.dueDate.toISOString().slice(0, 10) : ''} className="input" />
          </div>
        </div>

        <div>
          <label className="label mb-3">Prestations</label>
          <LineEditor initialLines={facture.lines} />
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="label">Remise globale (%)</label>
            <input type="number" step="0.1" name="discountPct" defaultValue={facture.discountPct} className="input" />
          </div>
          <div>
            <label className="label">Conditions de paiement</label>
            <input name="paymentTerms" defaultValue={facture.paymentTerms ?? ''} className="input" />
          </div>
        </div>
        <div>
          <label className="label">Notes</label>
          <textarea name="notes" defaultValue={facture.notes ?? ''} className="input min-h-20" />
        </div>

        <div className="flex gap-3">
          <button type="submit" className="btn-primary">Enregistrer</button>
          <a href={`/factures/${facture.id}`} className="btn-secondary">Annuler</a>
        </div>
      </form>
    </div>
  );
}

import { prisma } from '@/lib/prisma';
import { requireUser } from '@/lib/session';
import { PageHeader } from '@/components/ui/PageHeader';
import { LineEditor } from '@/components/forms/LineEditor';
import { createDevis } from '../actions';

export default async function NouveauDevisPage({ searchParams }: { searchParams: { clientId?: string; chantierId?: string } }) {
  const user = await requireUser();
  const [clients, chantiers, company] = await Promise.all([
    prisma.client.findMany({ where: { companyId: user.companyId }, orderBy: { firstName: 'asc' } }),
    prisma.chantier.findMany({ where: { companyId: user.companyId }, orderBy: { name: 'asc' } }),
    prisma.company.findUnique({ where: { id: user.companyId } }),
  ]);

  return (
    <div className="max-w-4xl">
      <PageHeader title="Nouveau devis" />
      <form action={createDevis} className="card p-6 space-y-6">
        <div className="grid sm:grid-cols-3 gap-4">
          <div>
            <label className="label">Client</label>
            <select name="clientId" required defaultValue={searchParams.clientId ?? ''} className="select">
              <option value="" disabled>Sélectionner…</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>{c.firstName} {c.lastName}{c.companyName ? ` · ${c.companyName}` : ''}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Chantier (optionnel)</label>
            <select name="chantierId" defaultValue={searchParams.chantierId ?? ''} className="select">
              <option value="">Aucun</option>
              {chantiers.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Valide jusqu'au</label>
            <input type="date" name="validUntil" className="input" defaultValue={new Date(Date.now() + (company?.quoteValidityDays ?? 30) * 86400000).toISOString().slice(0, 10)} />
          </div>
        </div>

        <div>
          <label className="label mb-3">Prestations</label>
          <LineEditor defaultVatRate={company?.defaultVatRate ?? 20} />
        </div>

        <div className="grid sm:grid-cols-3 gap-4">
          <div>
            <label className="label">Remise globale (%)</label>
            <input type="number" step="0.1" name="discountPct" defaultValue={0} className="input" />
          </div>
          <div>
            <label className="label">Acompte demandé (%)</label>
            <input type="number" step="1" name="depositPct" defaultValue={30} className="input" />
          </div>
          <div>
            <label className="label">Conditions de paiement</label>
            <input name="paymentTerms" defaultValue={company?.paymentTerms ?? ''} className="input" />
          </div>
        </div>
        <div>
          <label className="label">Notes / conditions particulières</label>
          <textarea name="notes" className="input min-h-20" />
        </div>

        <div className="flex gap-3">
          <button type="submit" className="btn-primary">Créer le devis</button>
          <a href="/devis" className="btn-secondary">Annuler</a>
        </div>
      </form>
    </div>
  );
}

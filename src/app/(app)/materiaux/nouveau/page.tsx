import { prisma } from '@/lib/prisma';
import { requireUser } from '@/lib/session';
import { PageHeader } from '@/components/ui/PageHeader';
import { createMaterial } from '../actions';

export default async function NouveauMateriauPage() {
  const user = await requireUser();
  const suppliers = await prisma.supplier.findMany({ where: { companyId: user.companyId }, orderBy: { name: 'asc' } });

  return (
    <div className="max-w-2xl">
      <PageHeader title="Nouveau matériau" />
      <form action={createMaterial} className="card p-6 space-y-4">
        <div className="grid sm:grid-cols-2 gap-4">
          <div><label className="label">Nom</label><input name="name" required className="input" /></div>
          <div><label className="label">Référence</label><input name="reference" className="input" /></div>
          <div>
            <label className="label">Fournisseur</label>
            <select name="supplierId" className="select">
              <option value="">Aucun</option>
              {suppliers.map((s) => (<option key={s.id} value={s.id}>{s.name}</option>))}
            </select>
          </div>
          <div><label className="label">Unité</label><input name="unit" defaultValue="u" className="input" /></div>
          <div><label className="label">Prix d'achat (€)</label><input type="number" step="0.01" name="purchasePrice" className="input" /></div>
          <div><label className="label">Quantité disponible</label><input type="number" step="0.01" name="quantityAvailable" defaultValue={0} className="input" /></div>
          <div><label className="label">Stock minimum (alerte)</label><input type="number" step="0.01" name="stockMin" defaultValue={0} className="input" /></div>
          <div><label className="label">Emplacement</label><input name="location" className="input" /></div>
        </div>
        <div className="flex gap-3">
          <button type="submit" className="btn-primary">Créer</button>
          <a href="/materiaux" className="btn-secondary">Annuler</a>
        </div>
      </form>
    </div>
  );
}

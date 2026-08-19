import { prisma } from '@/lib/prisma';
import { requireUser } from '@/lib/session';
import { PageHeader } from '@/components/ui/PageHeader';
import { CHANTIER_STATUSES } from '@/lib/enums';
import { createChantier } from '../actions';

export default async function NouveauChantierPage({ searchParams }: { searchParams: { clientId?: string } }) {
  const user = await requireUser();
  const [clients, users] = await Promise.all([
    prisma.client.findMany({ where: { companyId: user.companyId }, orderBy: { firstName: 'asc' } }),
    prisma.user.findMany({ where: { companyId: user.companyId, active: true }, orderBy: { name: 'asc' } }),
  ]);

  return (
    <div className="max-w-3xl">
      <PageHeader title="Nouveau chantier" />
      <form action={createChantier} className="card p-6 space-y-4">
        <div>
          <label className="label">Nom du chantier</label>
          <input name="name" required className="input" placeholder="Ex : Rénovation appartement Dupont" />
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="label">Client</label>
            <select name="clientId" required defaultValue={searchParams.clientId ?? ''} className="select">
              <option value="" disabled>Sélectionner…</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>{c.firstName} {c.lastName}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Responsable</label>
            <select name="managerId" className="select">
              <option value="">Non assigné</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>{u.name}</option>
              ))}
            </select>
          </div>
          <div className="sm:col-span-2">
            <label className="label">Adresse du chantier</label>
            <input name="address" className="input" />
          </div>
          <div>
            <label className="label">Latitude (pour la carte, optionnel)</label>
            <input type="number" step="0.000001" name="lat" className="input" placeholder="Ex : 45.7508" />
          </div>
          <div>
            <label className="label">Longitude (pour la carte, optionnel)</label>
            <input type="number" step="0.000001" name="lng" className="input" placeholder="Ex : 4.8324" />
          </div>
          <div>
            <label className="label">Date de début</label>
            <input type="date" name="startDate" className="input" />
          </div>
          <div>
            <label className="label">Date de fin prévue</label>
            <input type="date" name="endDatePlanned" className="input" />
          </div>
          <div>
            <label className="label">Budget prévu (€)</label>
            <input type="number" step="0.01" name="budgetPlanned" defaultValue={0} className="input" />
          </div>
          <div>
            <label className="label">CA prévu (€)</label>
            <input type="number" step="0.01" name="revenuePlanned" defaultValue={0} className="input" />
          </div>
          <div className="sm:col-span-2">
            <label className="label">Statut</label>
            <select name="status" defaultValue="A_PREPARER" className="select">
              {Object.entries(CHANTIER_STATUSES).map(([k, v]) => (
                <option key={k} value={k}>{v.label}</option>
              ))}
            </select>
          </div>
          <div className="sm:col-span-2">
            <label className="label">Description</label>
            <textarea name="description" className="input min-h-20" />
          </div>
        </div>
        <div className="flex gap-3">
          <button type="submit" className="btn-primary">Créer le chantier</button>
          <a href="/chantiers" className="btn-secondary">Annuler</a>
        </div>
      </form>
    </div>
  );
}

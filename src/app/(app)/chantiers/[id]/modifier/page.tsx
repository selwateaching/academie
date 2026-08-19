import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { requireUser } from '@/lib/session';
import { PageHeader } from '@/components/ui/PageHeader';
import { CHANTIER_STATUSES } from '@/lib/enums';
import { updateChantier } from '../../actions';

export default async function ModifierChantierPage({ params }: { params: { id: string } }) {
  const user = await requireUser();
  const [chantier, clients, users] = await Promise.all([
    prisma.chantier.findFirst({ where: { id: params.id, companyId: user.companyId } }),
    prisma.client.findMany({ where: { companyId: user.companyId }, orderBy: { firstName: 'asc' } }),
    prisma.user.findMany({ where: { companyId: user.companyId, active: true }, orderBy: { name: 'asc' } }),
  ]);
  if (!chantier) notFound();

  const action = updateChantier.bind(null, chantier.id);
  const d = (dt: Date | null) => (dt ? dt.toISOString().slice(0, 10) : '');

  return (
    <div className="max-w-3xl">
      <PageHeader title={`Modifier ${chantier.name}`} />
      <form action={action} className="card p-6 space-y-4">
        <div>
          <label className="label">Nom du chantier</label>
          <input name="name" required defaultValue={chantier.name} className="input" />
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="label">Client</label>
            <select name="clientId" required defaultValue={chantier.clientId} className="select">
              {clients.map((c) => (
                <option key={c.id} value={c.id}>{c.firstName} {c.lastName}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Responsable</label>
            <select name="managerId" defaultValue={chantier.managerId ?? ''} className="select">
              <option value="">Non assigné</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>{u.name}</option>
              ))}
            </select>
          </div>
          <div className="sm:col-span-2">
            <label className="label">Adresse</label>
            <input name="address" defaultValue={chantier.address ?? ''} className="input" />
          </div>
          <div>
            <label className="label">Latitude (pour la carte)</label>
            <input type="number" step="0.000001" name="lat" defaultValue={chantier.lat ?? ''} className="input" />
          </div>
          <div>
            <label className="label">Longitude (pour la carte)</label>
            <input type="number" step="0.000001" name="lng" defaultValue={chantier.lng ?? ''} className="input" />
          </div>
          <div>
            <label className="label">Date de début</label>
            <input type="date" name="startDate" defaultValue={d(chantier.startDate)} className="input" />
          </div>
          <div>
            <label className="label">Fin prévue</label>
            <input type="date" name="endDatePlanned" defaultValue={d(chantier.endDatePlanned)} className="input" />
          </div>
          <div>
            <label className="label">Fin réelle</label>
            <input type="date" name="endDateActual" defaultValue={d(chantier.endDateActual)} className="input" />
          </div>
          <div>
            <label className="label">Avancement (%)</label>
            <input type="number" min={0} max={100} name="progress" defaultValue={chantier.progress} className="input" />
          </div>
          <div>
            <label className="label">Budget prévu (€)</label>
            <input type="number" step="0.01" name="budgetPlanned" defaultValue={chantier.budgetPlanned} className="input" />
          </div>
          <div>
            <label className="label">CA prévu (€)</label>
            <input type="number" step="0.01" name="revenuePlanned" defaultValue={chantier.revenuePlanned} className="input" />
          </div>
          <div className="sm:col-span-2">
            <label className="label">Statut</label>
            <select name="status" defaultValue={chantier.status} className="select">
              {Object.entries(CHANTIER_STATUSES).map(([k, v]) => (
                <option key={k} value={k}>{v.label}</option>
              ))}
            </select>
          </div>
          <div className="sm:col-span-2">
            <label className="label">Description</label>
            <textarea name="description" defaultValue={chantier.description ?? ''} className="input min-h-20" />
          </div>
        </div>
        <div className="flex gap-3">
          <button type="submit" className="btn-primary">Enregistrer</button>
          <a href={`/chantiers/${chantier.id}`} className="btn-secondary">Annuler</a>
        </div>
      </form>
    </div>
  );
}

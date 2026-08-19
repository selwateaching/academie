import { prisma } from '@/lib/prisma';
import { requireUser } from '@/lib/session';
import { PageHeader } from '@/components/ui/PageHeader';
import { EVENT_TYPES } from '@/lib/enums';
import { createEvent } from '../actions';

export default async function NouvelEvenementPage({ searchParams }: { searchParams: { chantierId?: string; clientId?: string } }) {
  const user = await requireUser();
  const [chantiers, clients, users] = await Promise.all([
    prisma.chantier.findMany({ where: { companyId: user.companyId }, orderBy: { name: 'asc' } }),
    prisma.client.findMany({ where: { companyId: user.companyId }, orderBy: { firstName: 'asc' } }),
    prisma.user.findMany({ where: { companyId: user.companyId, active: true }, orderBy: { name: 'asc' } }),
  ]);
  const now = new Date();
  now.setMinutes(0, 0, 0);
  now.setHours(now.getHours() + 1);
  const defaultStart = now.toISOString().slice(0, 16);

  return (
    <div className="max-w-2xl">
      <PageHeader title="Nouveau rendez-vous" />
      <form action={createEvent} className="card p-6 space-y-4">
        <div>
          <label className="label">Titre</label>
          <input name="title" required className="input" placeholder="Ex : Visite de chantier" />
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="label">Type</label>
            <select name="type" defaultValue="RDV" className="select">
              {Object.entries(EVENT_TYPES).map(([k, v]) => (
                <option key={k} value={k}>{v.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Lieu</label>
            <input name="location" className="input" />
          </div>
          <div>
            <label className="label">Début</label>
            <input type="datetime-local" name="start" required defaultValue={defaultStart} className="input" />
          </div>
          <div>
            <label className="label">Fin</label>
            <input type="datetime-local" name="end" className="input" />
          </div>
          <div>
            <label className="label">Chantier lié</label>
            <select name="chantierId" defaultValue={searchParams.chantierId ?? ''} className="select">
              <option value="">Aucun</option>
              {chantiers.map((c) => (<option key={c.id} value={c.id}>{c.name}</option>))}
            </select>
          </div>
          <div>
            <label className="label">Client lié</label>
            <select name="clientId" defaultValue={searchParams.clientId ?? ''} className="select">
              <option value="">Aucun</option>
              {clients.map((c) => (<option key={c.id} value={c.id}>{c.firstName} {c.lastName}</option>))}
            </select>
          </div>
        </div>
        <div>
          <label className="label">Participants</label>
          <select name="attendees" multiple className="select h-32">
            {users.map((u) => (<option key={u.id} value={u.id}>{u.name}</option>))}
          </select>
          <p className="text-xs text-ink-400 mt-1">Maintenez Ctrl / Cmd pour sélectionner plusieurs salariés.</p>
        </div>
        <div>
          <label className="label">Notes</label>
          <textarea name="notes" className="input min-h-16" />
        </div>
        <div className="flex gap-3">
          <button type="submit" className="btn-primary">Créer</button>
          <a href="/calendrier" className="btn-secondary">Annuler</a>
        </div>
      </form>
    </div>
  );
}

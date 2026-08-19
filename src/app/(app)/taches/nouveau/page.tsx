import { prisma } from '@/lib/prisma';
import { requireUser } from '@/lib/session';
import { PageHeader } from '@/components/ui/PageHeader';
import { TASK_PRIORITIES } from '@/lib/enums';
import { createTask } from '../actions';

export default async function NouvelleTachePage({ searchParams }: { searchParams: { chantierId?: string; clientId?: string } }) {
  const user = await requireUser();
  const [chantiers, clients, users] = await Promise.all([
    prisma.chantier.findMany({ where: { companyId: user.companyId }, orderBy: { name: 'asc' } }),
    prisma.client.findMany({ where: { companyId: user.companyId }, orderBy: { firstName: 'asc' } }),
    prisma.user.findMany({ where: { companyId: user.companyId, active: true }, orderBy: { name: 'asc' } }),
  ]);

  return (
    <div className="max-w-2xl">
      <PageHeader title="Nouvelle tâche" />
      <form action={createTask} className="card p-6 space-y-4">
        <div><label className="label">Titre</label><input name="title" required className="input" /></div>
        <div><label className="label">Description</label><textarea name="description" className="input min-h-20" /></div>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="label">Priorité</label>
            <select name="priority" defaultValue="NORMALE" className="select">
              {Object.entries(TASK_PRIORITIES).map(([k, v]) => (<option key={k} value={k}>{v.label}</option>))}
            </select>
          </div>
          <div><label className="label">Échéance</label><input type="date" name="dueDate" className="input" /></div>
          <div>
            <label className="label">Chantier</label>
            <select name="chantierId" defaultValue={searchParams.chantierId ?? ''} className="select">
              <option value="">Aucun</option>
              {chantiers.map((c) => (<option key={c.id} value={c.id}>{c.name}</option>))}
            </select>
          </div>
          <div>
            <label className="label">Client</label>
            <select name="clientId" defaultValue={searchParams.clientId ?? ''} className="select">
              <option value="">Aucun</option>
              {clients.map((c) => (<option key={c.id} value={c.id}>{c.firstName} {c.lastName}</option>))}
            </select>
          </div>
          <div className="sm:col-span-2">
            <label className="label">Assigné à</label>
            <select name="assignedToId" className="select">
              <option value="">Non assigné</option>
              {users.map((u) => (<option key={u.id} value={u.id}>{u.name}</option>))}
            </select>
          </div>
        </div>
        <div className="flex gap-3">
          <button type="submit" className="btn-primary">Créer</button>
          <a href="/taches" className="btn-secondary">Annuler</a>
        </div>
      </form>
    </div>
  );
}

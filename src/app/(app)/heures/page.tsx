import { prisma } from '@/lib/prisma';
import { requireUser } from '@/lib/session';
import { PageHeader } from '@/components/ui/PageHeader';
import { ClockWidget } from './ClockWidget';
import { addManualEntry, deleteTimeEntry } from './actions';
import { fmtDate } from '@/lib/enums';
import { Icon } from '@/components/shell/Icon';

export const dynamic = 'force-dynamic';

export default async function HeuresPage() {
  const user = await requireUser();
  const isManager = ['ADMIN', 'CONDUCTEUR', 'COMPTABILITE'].includes(user.role);
  const now = new Date();
  const startMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [chantiers, openEntry, myEntries] = await Promise.all([
    prisma.chantier.findMany({ where: { companyId: user.companyId, status: { in: ['EN_COURS', 'PLANIFIE'] } }, orderBy: { name: 'asc' } }),
    prisma.timeEntry.findFirst({ where: { userId: user.id, endTime: null }, include: { chantier: true } }),
    prisma.timeEntry.findMany({ where: { userId: user.id }, include: { chantier: true }, orderBy: { date: 'desc' }, take: 20 }),
  ]);

  const myMonthHours = (await prisma.timeEntry.aggregate({ where: { userId: user.id, date: { gte: startMonth } }, _sum: { hours: true } }))._sum.hours ?? 0;

  let byUser: { name: string; total: number; overtime: boolean }[] = [];
  let byChantier: { name: string; total: number }[] = [];
  if (isManager) {
    const all = await prisma.timeEntry.findMany({ where: { user: { companyId: user.companyId }, date: { gte: startMonth } }, include: { user: true, chantier: true } });
    const userMap = new Map<string, number>();
    const chantierMap = new Map<string, number>();
    for (const e of all) {
      userMap.set(e.user.name, (userMap.get(e.user.name) ?? 0) + e.hours);
      if (e.chantier) chantierMap.set(e.chantier.name, (chantierMap.get(e.chantier.name) ?? 0) + e.hours);
    }
    byUser = Array.from(userMap.entries()).map(([name, total]) => ({ name, total, overtime: total > 151.67 })).sort((a, b) => b.total - a.total);
    byChantier = Array.from(chantierMap.entries()).map(([name, total]) => ({ name, total })).sort((a, b) => b.total - a.total);
  }

  const manualAction = addManualEntry;

  return (
    <div>
      <PageHeader title="Heures" description="Pointage et suivi du temps de travail." />

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="space-y-6">
          <ClockWidget
            chantiers={chantiers.map((c) => ({ id: c.id, name: c.name }))}
            openEntry={openEntry ? { id: openEntry.id, startTime: openEntry.startTime!.toISOString(), chantierName: openEntry.chantier?.name } : null}
          />
          <div className="card p-5">
            <p className="text-xs text-ink-400 mb-1">Total ce mois-ci</p>
            <p className="text-2xl font-bold text-ink-800">{myMonthHours}h</p>
          </div>
          <div className="card p-5">
            <p className="font-semibold text-ink-800 mb-3 text-sm">Saisie manuelle</p>
            <form action={manualAction} className="space-y-2">
              <select name="chantierId" className="select !text-sm">
                <option value="">Sans chantier</option>
                {chantiers.map((c) => (<option key={c.id} value={c.id}>{c.name}</option>))}
              </select>
              <div className="grid grid-cols-2 gap-2">
                <input type="date" name="date" defaultValue={new Date().toISOString().slice(0, 10)} className="input !text-sm" />
                <input type="number" step="0.25" name="hours" placeholder="Heures" required className="input !text-sm" />
              </div>
              <input name="note" placeholder="Note" className="input !text-sm" />
              <button className="btn-secondary btn-sm w-full">Ajouter</button>
            </form>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-6">
          <div className="card p-5">
            <h3 className="font-semibold text-ink-800 mb-3">Mes heures récentes</h3>
            <div className="space-y-1.5">
              {myEntries.map((e) => (
                <div key={e.id} className="flex items-center justify-between text-sm rounded-lg bg-ink-50 px-3 py-2">
                  <span>{fmtDate(e.date)}{e.chantier ? ` · ${e.chantier.name}` : ''}{e.note ? ` · ${e.note}` : ''}</span>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{e.hours}h</span>
                    <form action={deleteTimeEntry.bind(null, e.id)}>
                      <button className="text-rose-400 hover:text-rose-600"><Icon name="X" size={13} /></button>
                    </form>
                  </div>
                </div>
              ))}
              {myEntries.length === 0 && <p className="text-sm text-ink-400 text-center py-4">Aucune heure enregistrée</p>}
            </div>
          </div>

          {isManager && (
            <div className="grid sm:grid-cols-2 gap-6">
              <div className="card p-5">
                <h3 className="font-semibold text-ink-800 mb-3">Heures par salarié (ce mois)</h3>
                <div className="space-y-1.5">
                  {byUser.map((u) => (
                    <div key={u.name} className="flex items-center justify-between text-sm">
                      <span className={u.overtime ? 'text-amber-700 font-medium' : ''}>{u.name}</span>
                      <span className="font-semibold">{u.total}h {u.overtime && <span className="text-[10px] text-amber-600">(sup.)</span>}</span>
                    </div>
                  ))}
                  {byUser.length === 0 && <p className="text-sm text-ink-400">Aucune donnée</p>}
                </div>
              </div>
              <div className="card p-5">
                <h3 className="font-semibold text-ink-800 mb-3">Heures par chantier (ce mois)</h3>
                <div className="space-y-1.5">
                  {byChantier.map((c) => (
                    <div key={c.name} className="flex items-center justify-between text-sm">
                      <span>{c.name}</span><span className="font-semibold">{c.total}h</span>
                    </div>
                  ))}
                  {byChantier.length === 0 && <p className="text-sm text-ink-400">Aucune donnée</p>}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

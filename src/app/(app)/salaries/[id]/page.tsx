import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { requireUser } from '@/lib/session';
import { PageHeader } from '@/components/ui/PageHeader';
import { Icon } from '@/components/shell/Icon';
import { ROLES, ABSENCE_TYPES, fmtDate } from '@/lib/enums';
import { updateEmployeeProfile, addAbsence, deleteAbsence } from '../actions';

export default async function SalarieDetailPage({ params }: { params: { id: string } }) {
  const user = await requireUser();
  const employee = await prisma.user.findFirst({
    where: { id: params.id, companyId: user.companyId },
    include: {
      chantierMemberships: { include: { chantier: true } },
      timeEntries: { include: { chantier: true }, orderBy: { date: 'desc' }, take: 15 },
      absences: { orderBy: { startDate: 'desc' } },
      employeeDocuments: { orderBy: { createdAt: 'desc' } },
    },
  });
  if (!employee) notFound();

  const isAdmin = ['ADMIN', 'CONDUCTEUR'].includes(user.role);
  const now = new Date();
  const startMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthEntries = await prisma.timeEntry.findMany({ where: { userId: employee.id, date: { gte: startMonth } } });
  const monthHours = monthEntries.reduce((s, t) => s + t.hours, 0);

  const updateAction = updateEmployeeProfile.bind(null, employee.id);
  const absenceAction = addAbsence.bind(null, employee.id);

  return (
    <div className="max-w-5xl">
      <PageHeader title={employee.name} description={`${employee.position || (ROLES as any)[employee.role]?.label} · ${employee.email}`} />

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="card p-5">
            <h3 className="font-semibold text-ink-800 mb-3">Profil</h3>
            <form action={updateAction} className="grid sm:grid-cols-2 gap-3">
              <fieldset disabled={!isAdmin} className="contents">
                <div><label className="label">Téléphone</label><input name="phone" defaultValue={employee.phone ?? ''} className="input" /></div>
                <div><label className="label">Poste</label><input name="position" defaultValue={employee.position ?? ''} className="input" /></div>
                <div><label className="label">Équipe</label><input name="team" defaultValue={employee.team ?? ''} className="input" /></div>
                <div><label className="label">Compétences</label><input name="skills" defaultValue={employee.skills ?? ''} className="input" /></div>
                {isAdmin && <button type="submit" className="btn-primary sm:col-span-2">Enregistrer</button>}
              </fieldset>
            </form>
          </div>

          <div className="card p-5">
            <h3 className="font-semibold text-ink-800 mb-3">Chantiers affectés</h3>
            <div className="space-y-2">
              {employee.chantierMemberships.map((m) => (
                <a key={m.id} href={`/chantiers/${m.chantierId}`} className="flex items-center justify-between rounded-xl border border-ink-100 px-3 py-2.5 hover:bg-ink-50">
                  <span className="text-sm font-medium">{m.chantier.name}</span>
                  <span className="text-xs text-ink-400">{m.roleOnSite ?? ''}</span>
                </a>
              ))}
              {employee.chantierMemberships.length === 0 && <p className="text-sm text-ink-400 text-center py-4">Aucune affectation</p>}
            </div>
          </div>

          <div className="card p-5">
            <h3 className="font-semibold text-ink-800 mb-3">Heures récentes ({monthHours}h ce mois-ci)</h3>
            <div className="space-y-1.5">
              {employee.timeEntries.map((t) => (
                <div key={t.id} className="flex items-center justify-between text-sm rounded-lg bg-ink-50 px-3 py-2">
                  <span>{fmtDate(t.date)} {t.chantier ? `· ${t.chantier.name}` : ''}</span>
                  <span className="font-medium">{t.hours}h</span>
                </div>
              ))}
              {employee.timeEntries.length === 0 && <p className="text-sm text-ink-400 text-center py-4">Aucune heure enregistrée</p>}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="card p-5">
            <h3 className="font-semibold text-ink-800 mb-3 flex items-center gap-2"><Icon name="Plane" size={16} /> Absences & congés</h3>
            {isAdmin && (
              <form action={absenceAction} className="space-y-2 mb-3">
                <select name="type" className="select">
                  {Object.entries(ABSENCE_TYPES).map(([k, v]) => (<option key={k} value={k}>{v}</option>))}
                </select>
                <div className="grid grid-cols-2 gap-2">
                  <input type="date" name="startDate" required className="input !text-xs" />
                  <input type="date" name="endDate" required className="input !text-xs" />
                </div>
                <input name="note" placeholder="Note" className="input !text-xs" />
                <button className="btn-secondary btn-sm w-full">Ajouter</button>
              </form>
            )}
            <div className="space-y-1.5">
              {employee.absences.map((a) => (
                <div key={a.id} className="flex items-center justify-between text-xs rounded-lg bg-ink-50 px-2.5 py-1.5">
                  <span>{ABSENCE_TYPES[a.type as keyof typeof ABSENCE_TYPES]} · {fmtDate(a.startDate)} → {fmtDate(a.endDate)}</span>
                  {isAdmin && (
                    <form action={deleteAbsence.bind(null, employee.id, a.id)}>
                      <button className="text-rose-400 hover:text-rose-600"><Icon name="X" size={12} /></button>
                    </form>
                  )}
                </div>
              ))}
              {employee.absences.length === 0 && <p className="text-xs text-ink-400 text-center py-2">Aucune absence</p>}
            </div>
          </div>

          <div className="card p-5">
            <h3 className="font-semibold text-ink-800 mb-3 flex items-center gap-2"><Icon name="FileText" size={16} /> Documents administratifs</h3>
            <div className="space-y-1.5">
              {employee.employeeDocuments.map((d) => (
                <a key={d.id} href={`/api/files/${d.filePath}`} target="_blank" className="block text-xs text-brand-700 hover:underline truncate">{d.name}</a>
              ))}
              {employee.employeeDocuments.length === 0 && <p className="text-xs text-ink-400 text-center py-2">Aucun document</p>}
            </div>
            <a href={`/documents?employeeId=${employee.id}`} className="btn-secondary btn-sm inline-flex mt-2">Ajouter un document</a>
          </div>
        </div>
      </div>
    </div>
  );
}

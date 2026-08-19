import { notFound } from 'next/navigation';
import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { requireUser } from '@/lib/session';
import { PageHeader } from '@/components/ui/PageHeader';
import { Tabs } from '@/components/ui/Tabs';
import { Icon } from '@/components/shell/Icon';
import { StatusBadge } from '@/components/ui/Badge';
import { ConfirmSubmitButton } from '@/components/ui/ConfirmSubmit';
import { CHANTIER_STATUSES, DEVIS_STATUSES, FACTURE_STATUSES, TASK_STATUSES, PHOTO_CATEGORIES, fmtDate, fmtEUR } from '@/lib/enums';
import { deleteChantier, addExpense, deleteExpense, assignMember, removeMember, uploadChantierPhoto, deletePhoto } from '../actions';
import { ChantierStatusSelect, ChantierProgressSlider } from './ChantierControls';

export const dynamic = 'force-dynamic';

export default async function ChantierDetailPage({ params }: { params: { id: string } }) {
  const user = await requireUser();
  const chantier = await prisma.chantier.findFirst({
    where: { id: params.id, companyId: user.companyId },
    include: {
      client: true, manager: true,
      members: { include: { user: true } },
      devis: { orderBy: { createdAt: 'desc' } },
      factures: { orderBy: { createdAt: 'desc' } },
      documents: { orderBy: { createdAt: 'desc' } },
      photos: { orderBy: { takenAt: 'desc' } },
      tasks: { orderBy: { createdAt: 'desc' } },
      timeEntries: { include: { user: true }, orderBy: { date: 'desc' }, take: 30 },
      stockMoves: { include: { material: true }, orderBy: { date: 'desc' } },
      expenses: { orderBy: { date: 'desc' } },
    },
  });
  if (!chantier) notFound();

  const allUsers = await prisma.user.findMany({ where: { companyId: user.companyId, active: true }, orderBy: { name: 'asc' } });
  const memberIds = new Set(chantier.members.map((m) => m.userId));
  const availableUsers = allUsers.filter((u) => !memberIds.has(u.id));

  const revenueActual = chantier.factures.filter((f) => f.status === 'PAYEE').reduce((s, f) => s + f.totalTTC, 0);
  const margin = revenueActual - chantier.costActual;
  const marginPct = revenueActual > 0 ? (margin / revenueActual) * 100 : 0;
  const totalHours = chantier.timeEntries.reduce((s, t) => s + t.hours, 0);

  const addExpenseAction = addExpense.bind(null, chantier.id);
  const uploadPhotoAction = uploadChantierPhoto.bind(null, chantier.id);

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-3 mb-1">
        <PageHeader title={chantier.name} description={`${chantier.client.firstName} ${chantier.client.lastName} · ${chantier.address ?? 'Adresse non renseignée'}`} />
        <div className="flex gap-2">
          <Link href={`/chantiers/${chantier.id}/modifier`} className="btn-secondary btn-sm"><Icon name="Pencil" size={14} /> Modifier</Link>
          <form action={deleteChantier.bind(null, chantier.id)}>
            <ConfirmSubmitButton message="Supprimer ce chantier ?"><Icon name="Trash2" size={14} /> Supprimer</ConfirmSubmitButton>
          </form>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-6">
        <Link href={`/devis/nouveau?clientId=${chantier.clientId}&chantierId=${chantier.id}`} className="btn-secondary btn-sm"><Icon name="FileText" size={14} /> Nouveau devis</Link>
        <Link href={`/factures/nouveau?clientId=${chantier.clientId}&chantierId=${chantier.id}`} className="btn-secondary btn-sm"><Icon name="Receipt" size={14} /> Nouvelle facture</Link>
        <Link href={`/taches/nouveau?chantierId=${chantier.id}`} className="btn-secondary btn-sm"><Icon name="ListChecks" size={14} /> Nouvelle tâche</Link>
        <Link href={`/planning?chantierId=${chantier.id}`} className="btn-secondary btn-sm"><Icon name="CalendarClock" size={14} /> Planifier</Link>
      </div>

      <div className="grid lg:grid-cols-4 gap-6 mb-6">
        <div className="lg:col-span-3 card p-5">
          <ChantierProgressSlider chantierId={chantier.id} currentProgress={chantier.progress} />
        </div>
        <div className="card p-5 flex items-center">
          <ChantierStatusSelect chantierId={chantier.id} currentStatus={chantier.status} />
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <div className="card p-4"><p className="text-xs text-ink-400 mb-1">Budget prévu</p><p className="font-bold text-ink-800">{fmtEUR(chantier.budgetPlanned)}</p></div>
        <div className="card p-4"><p className="text-xs text-ink-400 mb-1">Coût réel</p><p className="font-bold text-ink-800">{fmtEUR(chantier.costActual)}</p></div>
        <div className="card p-4"><p className="text-xs text-ink-400 mb-1">CA encaissé</p><p className="font-bold text-ink-800">{fmtEUR(revenueActual)}</p></div>
        <div className="card p-4">
          <p className="text-xs text-ink-400 mb-1">Marge</p>
          <p className={`font-bold ${margin >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>{fmtEUR(margin)} <span className="text-xs font-normal">({marginPct.toFixed(0)}%)</span></p>
        </div>
      </div>

      <Tabs
        tabs={[
          {
            label: 'Aperçu',
            content: (
              <div className="grid lg:grid-cols-3 gap-5">
                <div className="lg:col-span-2 card p-5">
                  <h3 className="font-semibold text-ink-800 mb-2">Description</h3>
                  <p className="text-sm text-ink-700 whitespace-pre-wrap mb-4">{chantier.description || 'Aucune description.'}</p>
                  <div className="grid sm:grid-cols-2 gap-3 text-sm pt-3 border-t border-ink-100">
                    <div><p className="text-ink-400 text-xs">Début</p><p>{fmtDate(chantier.startDate)}</p></div>
                    <div><p className="text-ink-400 text-xs">Fin prévue</p><p>{fmtDate(chantier.endDatePlanned)}</p></div>
                    <div><p className="text-ink-400 text-xs">Fin réelle</p><p>{fmtDate(chantier.endDateActual)}</p></div>
                    <div><p className="text-ink-400 text-xs">Responsable</p><p>{chantier.manager?.name ?? '—'}</p></div>
                  </div>
                </div>
                <div className="card p-5">
                  <h3 className="font-semibold text-ink-800 mb-3">Dépenses</h3>
                  <form action={addExpenseAction} className="space-y-2 mb-3">
                    <input name="label" placeholder="Intitulé" required className="input !py-2 !text-sm" />
                    <div className="grid grid-cols-2 gap-2">
                      <input type="number" step="0.01" name="amount" placeholder="Montant €" required className="input !py-2 !text-sm" />
                      <input name="category" placeholder="Catégorie" className="input !py-2 !text-sm" />
                    </div>
                    <button className="btn-secondary btn-sm w-full">Ajouter une dépense</button>
                  </form>
                  <div className="space-y-1.5 max-h-64 overflow-y-auto">
                    {chantier.expenses.map((e) => (
                      <div key={e.id} className="flex items-center justify-between text-xs rounded-lg bg-ink-50 px-2.5 py-1.5">
                        <div><p className="font-medium text-ink-700">{e.label}</p><p className="text-ink-400">{e.category} · {fmtDate(e.date)}</p></div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">{fmtEUR(e.amount)}</span>
                          <form action={deleteExpense.bind(null, chantier.id, e.id)}>
                            <button className="text-rose-400 hover:text-rose-600"><Icon name="X" size={13} /></button>
                          </form>
                        </div>
                      </div>
                    ))}
                    {chantier.expenses.length === 0 && <p className="text-xs text-ink-400 text-center py-3">Aucune dépense</p>}
                  </div>
                </div>
              </div>
            ),
          },
          {
            label: 'Équipe', count: chantier.members.length,
            content: (
              <div className="grid sm:grid-cols-2 gap-5">
                <div className="space-y-2">
                  {chantier.members.map((m) => (
                    <div key={m.id} className="flex items-center justify-between rounded-xl border border-ink-100 px-4 py-3">
                      <div>
                        <p className="font-medium text-ink-800">{m.user.name}</p>
                        <p className="text-xs text-ink-400">{m.roleOnSite || m.user.position || m.user.role}</p>
                      </div>
                      <form action={removeMember.bind(null, chantier.id, m.userId)}>
                        <button className="text-rose-500 hover:text-rose-700 text-xs font-medium">Retirer</button>
                      </form>
                    </div>
                  ))}
                  {chantier.members.length === 0 && <p className="text-sm text-ink-400 text-center py-4">Aucun membre affecté</p>}
                </div>
                <form action={async (formData: FormData) => { 'use server'; await assignMember(chantier.id, String(formData.get('userId')), String(formData.get('roleOnSite') ?? '')); }} className="card p-4 space-y-2 h-fit">
                  <p className="text-sm font-semibold text-ink-800 mb-1">Affecter un salarié</p>
                  <select name="userId" required defaultValue="" className="select">
                    <option value="" disabled>Sélectionner…</option>
                    {availableUsers.map((u) => (
                      <option key={u.id} value={u.id}>{u.name}</option>
                    ))}
                  </select>
                  <input name="roleOnSite" placeholder="Rôle sur le chantier" className="input" />
                  <button className="btn-primary w-full">Affecter</button>
                </form>
              </div>
            ),
          },
          {
            label: 'Devis & Factures', count: chantier.devis.length + chantier.factures.length,
            content: (
              <div className="grid sm:grid-cols-2 gap-5">
                <div>
                  <p className="text-sm font-semibold text-ink-800 mb-2">Devis</p>
                  <div className="space-y-2">
                    {chantier.devis.map((d) => (
                      <Link key={d.id} href={`/devis/${d.id}`} className="flex items-center justify-between rounded-xl border border-ink-100 px-3 py-2.5 hover:bg-ink-50">
                        <span className="text-sm font-medium">{d.number}</span>
                        <StatusBadge map={DEVIS_STATUSES} value={d.status} />
                      </Link>
                    ))}
                    {chantier.devis.length === 0 && <p className="text-sm text-ink-400">Aucun devis</p>}
                  </div>
                </div>
                <div>
                  <p className="text-sm font-semibold text-ink-800 mb-2">Factures</p>
                  <div className="space-y-2">
                    {chantier.factures.map((f) => (
                      <Link key={f.id} href={`/factures/${f.id}`} className="flex items-center justify-between rounded-xl border border-ink-100 px-3 py-2.5 hover:bg-ink-50">
                        <span className="text-sm font-medium">{f.number}</span>
                        <StatusBadge map={FACTURE_STATUSES} value={f.status} />
                      </Link>
                    ))}
                    {chantier.factures.length === 0 && <p className="text-sm text-ink-400">Aucune facture</p>}
                  </div>
                </div>
              </div>
            ),
          },
          {
            label: 'Tâches', count: chantier.tasks.length,
            content: (
              <div className="space-y-2">
                {chantier.tasks.map((t) => (
                  <div key={t.id} className="flex items-center justify-between rounded-xl border border-ink-100 px-4 py-2.5">
                    <span className="text-sm font-medium text-ink-800">{t.title}</span>
                    <StatusBadge map={TASK_STATUSES} value={t.status} />
                  </div>
                ))}
                {chantier.tasks.length === 0 && <p className="text-sm text-ink-400 text-center py-4">Aucune tâche</p>}
                <Link href={`/taches/nouveau?chantierId=${chantier.id}`} className="btn-secondary btn-sm inline-flex mt-2">Ajouter une tâche</Link>
              </div>
            ),
          },
          {
            label: 'Documents', count: chantier.documents.length,
            content: (
              <div className="space-y-2">
                {chantier.documents.map((d) => (
                  <a key={d.id} href={`/api/files/${d.filePath}`} target="_blank" className="flex items-center gap-3 rounded-xl border border-ink-100 px-4 py-2.5 hover:bg-ink-50">
                    <Icon name="FileText" size={16} className="text-ink-400" />
                    <span className="text-sm">{d.name}</span>
                  </a>
                ))}
                {chantier.documents.length === 0 && <p className="text-sm text-ink-400 text-center py-4">Aucun document</p>}
                <Link href={`/documents?chantierId=${chantier.id}`} className="btn-secondary btn-sm inline-flex mt-2">Gérer les documents</Link>
              </div>
            ),
          },
          {
            label: 'Photos', count: chantier.photos.length,
            content: (
              <div>
                <form action={uploadPhotoAction} encType="multipart/form-data" className="flex flex-wrap gap-2 mb-4 items-end">
                  <input type="file" name="photo" accept="image/*" required className="input !py-2 !text-sm flex-1 min-w-[180px]" />
                  <select name="category" defaultValue="EN_COURS" className="select !py-2 !text-sm w-auto">
                    {Object.entries(PHOTO_CATEGORIES).map(([k, v]) => (
                      <option key={k} value={k}>{v}</option>
                    ))}
                  </select>
                  <input name="caption" placeholder="Légende" className="input !py-2 !text-sm w-auto" />
                  <button className="btn-primary btn-sm">Ajouter</button>
                </form>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {chantier.photos.map((p) => (
                    <div key={p.id} className="relative group">
                      <a href={`/api/files/${p.filePath}`} target="_blank">
                        <img src={`/api/files/${p.filePath}`} alt={p.caption ?? ''} className="rounded-xl aspect-square object-cover border border-ink-100" />
                      </a>
                      <span className="absolute top-1.5 left-1.5 badge bg-black/60 text-white border-0 !py-0.5 !px-1.5 text-[10px]">{PHOTO_CATEGORIES[p.category as keyof typeof PHOTO_CATEGORIES]}</span>
                      <form action={deletePhoto.bind(null, chantier.id, p.id)} className="absolute top-1.5 right-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button className="bg-black/60 text-white rounded-full p-1"><Icon name="X" size={12} /></button>
                      </form>
                      {p.caption && <p className="text-xs text-ink-500 mt-1 truncate">{p.caption}</p>}
                    </div>
                  ))}
                </div>
                {chantier.photos.length === 0 && <p className="text-sm text-ink-400 text-center py-4">Aucune photo</p>}
              </div>
            ),
          },
          {
            label: 'Matériaux & Heures',
            content: (
              <div className="grid sm:grid-cols-2 gap-5">
                <div>
                  <p className="text-sm font-semibold text-ink-800 mb-2">Matériaux utilisés</p>
                  <div className="space-y-1.5">
                    {chantier.stockMoves.map((m) => (
                      <div key={m.id} className="flex items-center justify-between text-sm rounded-lg bg-ink-50 px-3 py-2">
                        <span>{m.material.name}</span>
                        <span className="font-medium">{m.quantity} {m.material.unit}</span>
                      </div>
                    ))}
                    {chantier.stockMoves.length === 0 && <p className="text-sm text-ink-400">Aucun matériau enregistré</p>}
                  </div>
                </div>
                <div>
                  <p className="text-sm font-semibold text-ink-800 mb-2">Heures travaillées ({totalHours}h)</p>
                  <div className="space-y-1.5 max-h-72 overflow-y-auto">
                    {chantier.timeEntries.map((t) => (
                      <div key={t.id} className="flex items-center justify-between text-sm rounded-lg bg-ink-50 px-3 py-2">
                        <span>{t.user.name} · {fmtDate(t.date)}</span>
                        <span className="font-medium">{t.hours}h</span>
                      </div>
                    ))}
                    {chantier.timeEntries.length === 0 && <p className="text-sm text-ink-400">Aucune heure enregistrée</p>}
                  </div>
                </div>
              </div>
            ),
          },
        ]}
      />
    </div>
  );
}

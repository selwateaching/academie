import { prisma } from '@/lib/prisma';
import { requireUser } from '@/lib/session';
import { PageHeader } from '@/components/ui/PageHeader';
import { ROLES } from '@/lib/enums';
import { createUserAccount, updateCompany, toggleUserActive } from './actions';
import { Icon } from '@/components/shell/Icon';
import { RoleSelect } from './RoleSelect';

export default async function ParametresPage() {
  const user = await requireUser();
  const isAdmin = user.role === 'ADMIN';
  const [company, users, auditLogs] = await Promise.all([
    prisma.company.findUnique({ where: { id: user.companyId } }),
    prisma.user.findMany({ where: { companyId: user.companyId }, orderBy: { createdAt: 'asc' } }),
    isAdmin
      ? prisma.auditLog.findMany({ where: { companyId: user.companyId }, include: { user: true }, orderBy: { createdAt: 'desc' }, take: 30 })
      : Promise.resolve([]),
  ]);

  return (
    <div>
      <PageHeader title="Paramètres" description="Informations de l'entreprise, utilisateurs et permissions." />

      <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
        <div className="xl:col-span-3 card p-5 sm:p-6">
          <h2 className="font-semibold text-ink-800 mb-4 flex items-center gap-2"><Icon name="Building2" size={18} /> Entreprise</h2>
          <form action={updateCompany} className="space-y-4" encType="multipart/form-data">
            <fieldset disabled={!isAdmin} className="space-y-4 disabled:opacity-60">
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="label">Nom de l'entreprise</label>
                  <input name="name" defaultValue={company?.name ?? ''} className="input" required />
                </div>
                <div className="sm:col-span-2">
                  <label className="label">Logo</label>
                  <div className="flex items-center gap-3">
                    {company?.logo && <img src={company.logo} alt="logo" className="h-12 w-12 rounded-lg object-cover border border-ink-200" />}
                    <input type="file" name="logo" accept="image/*" className="input" />
                  </div>
                </div>
                <div className="sm:col-span-2">
                  <label className="label">Adresse</label>
                  <input name="address" defaultValue={company?.address ?? ''} className="input" />
                </div>
                <div>
                  <label className="label">Code postal</label>
                  <input name="zip" defaultValue={company?.zip ?? ''} className="input" />
                </div>
                <div>
                  <label className="label">Ville</label>
                  <input name="city" defaultValue={company?.city ?? ''} className="input" />
                </div>
                <div>
                  <label className="label">Téléphone</label>
                  <input name="phone" defaultValue={company?.phone ?? ''} className="input" />
                </div>
                <div>
                  <label className="label">Email</label>
                  <input type="email" name="email" defaultValue={company?.email ?? ''} className="input" />
                </div>
                <div>
                  <label className="label">SIRET</label>
                  <input name="siret" defaultValue={company?.siret ?? ''} className="input" />
                </div>
                <div>
                  <label className="label">N° TVA intracommunautaire</label>
                  <input name="vatNumber" defaultValue={company?.vatNumber ?? ''} className="input" />
                </div>
                <div>
                  <label className="label">IBAN</label>
                  <input name="iban" defaultValue={company?.iban ?? ''} className="input" />
                </div>
                <div>
                  <label className="label">BIC</label>
                  <input name="bic" defaultValue={company?.bic ?? ''} className="input" />
                </div>
                <div>
                  <label className="label">TVA par défaut (%)</label>
                  <input type="number" step="0.1" name="defaultVatRate" defaultValue={company?.defaultVatRate ?? 20} className="input" />
                </div>
                <div>
                  <label className="label">Validité devis (jours)</label>
                  <input type="number" name="quoteValidityDays" defaultValue={company?.quoteValidityDays ?? 30} className="input" />
                </div>
                <div className="sm:col-span-2">
                  <label className="label">Conditions de paiement</label>
                  <input name="paymentTerms" defaultValue={company?.paymentTerms ?? ''} className="input" />
                </div>
                <div className="sm:col-span-2">
                  <label className="label">Mentions légales (devis/factures)</label>
                  <textarea name="legalMentions" defaultValue={company?.legalMentions ?? ''} className="input min-h-24" />
                </div>
              </div>
              {isAdmin && <button type="submit" className="btn-primary">Enregistrer</button>}
            </fieldset>
          </form>
        </div>

        <div className="xl:col-span-2 space-y-6">
          <div className="card p-5 sm:p-6">
            <h2 className="font-semibold text-ink-800 mb-4 flex items-center gap-2"><Icon name="Users" size={18} /> Utilisateurs ({users.length})</h2>
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {users.map((u) => (
                <div key={u.id} className="flex items-center justify-between gap-2 rounded-xl border border-ink-100 px-3 py-2.5">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-ink-800 truncate">{u.name}</p>
                    <p className="text-xs text-ink-400 truncate">{u.email}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {isAdmin ? (
                      <RoleSelect userId={u.id} currentRole={u.role} />
                    ) : (
                      <span className="badge bg-ink-100 text-ink-600 border-ink-200">{(ROLES as any)[u.role]?.label ?? u.role}</span>
                    )}
                    {isAdmin && u.id !== user.id && (
                      <form action={async () => { 'use server'; await toggleUserActive(u.id); }}>
                        <button className={`btn-sm ${u.active ? 'btn-secondary' : 'btn-primary'}`}>{u.active ? 'Actif' : 'Inactif'}</button>
                      </form>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {isAdmin && (
            <div className="card p-5 sm:p-6">
              <h2 className="font-semibold text-ink-800 mb-4 flex items-center gap-2"><Icon name="UserPlus" size={18} /> Ajouter un utilisateur</h2>
              <form action={createUserAccount} className="space-y-3">
                <div>
                  <label className="label">Nom complet</label>
                  <input name="name" required className="input" />
                </div>
                <div>
                  <label className="label">Email</label>
                  <input type="email" name="email" required className="input" />
                </div>
                <div>
                  <label className="label">Mot de passe temporaire</label>
                  <input type="password" name="password" required minLength={6} className="input" />
                </div>
                <div>
                  <label className="label">Rôle</label>
                  <select name="role" className="select" defaultValue="SALARIE">
                    {Object.entries(ROLES).map(([k, v]) => (
                      <option key={k} value={k}>{v.label}</option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="label">Poste</label>
                    <input name="position" className="input" />
                  </div>
                  <div>
                    <label className="label">Téléphone</label>
                    <input name="phone" className="input" />
                  </div>
                </div>
                <button type="submit" className="btn-primary w-full">Créer le compte</button>
              </form>
            </div>
          )}
        </div>
      </div>

      {isAdmin && auditLogs.length > 0 && (
        <div className="card p-5 sm:p-6 mt-6">
          <h2 className="font-semibold text-ink-800 mb-4 flex items-center gap-2"><Icon name="ScrollText" size={18} /> Journal d'activité</h2>
          <div className="space-y-1.5 max-h-80 overflow-y-auto">
            {auditLogs.map((log) => (
              <div key={log.id} className="flex items-center justify-between text-xs rounded-lg bg-ink-50 px-3 py-2">
                <span className="text-ink-600">
                  <strong>{log.user?.name ?? 'Système'}</strong> — {log.action} {log.entityType}
                  {log.details ? ` (${log.details})` : ''}
                </span>
                <span className="text-ink-400 shrink-0 ml-2">{new Intl.DateTimeFormat('fr-FR', { dateStyle: 'short', timeStyle: 'short' }).format(log.createdAt)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

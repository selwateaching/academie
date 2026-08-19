import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { requireUser } from '@/lib/session';
import { PageHeader } from '@/components/ui/PageHeader';
import { Icon } from '@/components/shell/Icon';
import { StatusBadge } from '@/components/ui/Badge';
import { ConfirmSubmitButton } from '@/components/ui/ConfirmSubmit';
import { PROSPECT_STATUSES, fmtEUR, fmtDate, fmtDateTime } from '@/lib/enums';
import { convertProspectToClient, deleteProspect, addProspectContact } from '../actions';
import { ProspectStatusSelect } from '../ProspectStatusSelect';

export default async function ProspectDetailPage({ params }: { params: { id: string } }) {
  const user = await requireUser();
  const prospect = await prisma.prospect.findFirst({
    where: { id: params.id, companyId: user.companyId },
    include: { contacts: { orderBy: { date: 'desc' } }, convertedClient: true },
  });
  if (!prospect) notFound();

  const addContact = addProspectContact.bind(null, prospect.id);

  return (
    <div className="max-w-4xl">
      <div className="flex items-start justify-between gap-3">
        <PageHeader title={`${prospect.firstName} ${prospect.lastName}`} description={prospect.companyName ?? undefined} />
        <div className="flex gap-2 shrink-0">
          {!prospect.convertedClient && (
            <form action={convertProspectToClient.bind(null, prospect.id)}>
              <button className="btn-primary btn-sm"><Icon name="UserCheck" size={14} /> Transformer en client</button>
            </form>
          )}
          <form action={deleteProspect.bind(null, prospect.id)}>
            <ConfirmSubmitButton message="Supprimer ce prospect ?"><Icon name="Trash2" size={14} /> Supprimer</ConfirmSubmitButton>
          </form>
        </div>
      </div>

      {prospect.convertedClient && (
        <a href={`/clients/${prospect.convertedClient.id}`} className="flex items-center gap-2 rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-3 text-sm text-emerald-800 mb-6 hover:bg-emerald-100">
          <Icon name="CheckCircle2" size={16} /> Converti en client — voir la fiche client
        </a>
      )}

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-5">
          <div className="card p-5">
            <h3 className="font-semibold text-ink-800 mb-3 text-sm">Détails de la demande</h3>
            <dl className="grid sm:grid-cols-2 gap-3 text-sm">
              <div><dt className="text-ink-400 text-xs">Origine</dt><dd className="text-ink-800">{prospect.origin ?? '—'}</dd></div>
              <div><dt className="text-ink-400 text-xs">Montant estimé</dt><dd className="text-ink-800">{prospect.estimatedAmount ? fmtEUR(prospect.estimatedAmount) : '—'}</dd></div>
              <div className="sm:col-span-2"><dt className="text-ink-400 text-xs">Demande</dt><dd className="text-ink-800">{prospect.request ?? '—'}</dd></div>
              <div><dt className="text-ink-400 text-xs">Prochaine action</dt><dd className="text-ink-800">{prospect.nextAction ?? '—'}</dd></div>
              <div><dt className="text-ink-400 text-xs">Date prévue</dt><dd className="text-ink-800">{fmtDate(prospect.nextActionDate)}</dd></div>
              <div className="sm:col-span-2"><dt className="text-ink-400 text-xs">Notes</dt><dd className="text-ink-800 whitespace-pre-wrap">{prospect.notes ?? '—'}</dd></div>
            </dl>
          </div>

          <div className="card p-5">
            <h3 className="font-semibold text-ink-800 mb-3 text-sm">Historique des contacts</h3>
            <form action={addContact} className="flex gap-2 mb-4">
              <input name="note" placeholder="Ajouter une note de contact…" className="input" required />
              <button className="btn-primary shrink-0">Ajouter</button>
            </form>
            <div className="space-y-2">
              {prospect.contacts.length === 0 && <p className="text-sm text-ink-400 text-center py-4">Aucun contact enregistré</p>}
              {prospect.contacts.map((c) => (
                <div key={c.id} className="rounded-xl border border-ink-100 px-3 py-2.5">
                  <p className="text-sm text-ink-700">{c.note}</p>
                  <p className="text-xs text-ink-400 mt-1">{fmtDateTime(c.date)}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-5">
          <div className="card p-5">
            <h3 className="font-semibold text-ink-800 mb-3 text-sm">Statut</h3>
            <ProspectStatusSelect prospectId={prospect.id} currentStatus={prospect.status} />
          </div>
          <div className="card p-5">
            <h3 className="font-semibold text-ink-800 mb-3 text-sm">Coordonnées</h3>
            <dl className="space-y-2 text-sm">
              <div><dt className="text-ink-400 text-xs">Téléphone</dt><dd className="text-ink-800">{prospect.phone ?? '—'}</dd></div>
              <div><dt className="text-ink-400 text-xs">Email</dt><dd className="text-ink-800">{prospect.email ?? '—'}</dd></div>
            </dl>
            <div className="flex gap-2 mt-3">
              {prospect.phone && <a href={`tel:${prospect.phone}`} className="btn-secondary btn-sm flex-1"><Icon name="Phone" size={14} /> Appeler</a>}
              {prospect.email && <a href={`mailto:${prospect.email}`} className="btn-secondary btn-sm flex-1"><Icon name="Mail" size={14} /> Email</a>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

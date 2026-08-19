import Link from 'next/link';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { requireUser } from '@/lib/session';
import { PageHeader } from '@/components/ui/PageHeader';
import { Tabs } from '@/components/ui/Tabs';
import { Icon } from '@/components/shell/Icon';
import { StatusBadge } from '@/components/ui/Badge';
import { ConfirmSubmitButton } from '@/components/ui/ConfirmSubmit';
import { fmtDate, fmtEUR, DEVIS_STATUSES, FACTURE_STATUSES, CHANTIER_STATUSES, CLIENT_TYPES } from '@/lib/enums';
import { deleteClient } from '../actions';
import { PortalAccessBox } from './PortalAccessBox';

export const dynamic = 'force-dynamic';

export default async function ClientDetailPage({ params }: { params: { id: string } }) {
  const user = await requireUser();
  const client = await prisma.client.findFirst({
    where: { id: params.id, companyId: user.companyId },
    include: {
      chantiers: { orderBy: { createdAt: 'desc' } },
      devis: { orderBy: { createdAt: 'desc' } },
      factures: { orderBy: { createdAt: 'desc' } },
      documents: { orderBy: { createdAt: 'desc' } },
      tasks: { orderBy: { createdAt: 'desc' } },
    },
  });
  if (!client) notFound();

  const conversation = await prisma.conversation.findFirst({ where: { companyId: user.companyId, clientId: client.id, type: 'CLIENT' } });

  return (
    <div>
      <div className="flex items-start justify-between gap-3 mb-1">
        <PageHeader
          title={`${client.firstName} ${client.lastName}`}
          description={client.companyName ?? CLIENT_TYPES[client.type as keyof typeof CLIENT_TYPES]}
        />
        <div className="flex gap-2 shrink-0">
          <Link href={`/clients/${client.id}/modifier`} className="btn-secondary btn-sm"><Icon name="Pencil" size={14} /> Modifier</Link>
          <form action={deleteClient.bind(null, client.id)}>
            <ConfirmSubmitButton message="Supprimer définitivement ce client et toutes ses données associées ?">
              <Icon name="Trash2" size={14} /> Supprimer
            </ConfirmSubmitButton>
          </form>
        </div>
      </div>

      {/* Actions rapides */}
      <div className="flex flex-wrap gap-2 mb-6">
        <Link href={`/devis/nouveau?clientId=${client.id}`} className="btn-primary btn-sm"><Icon name="FileText" size={14} /> Nouveau devis</Link>
        <Link href={`/factures/nouveau?clientId=${client.id}`} className="btn-secondary btn-sm"><Icon name="Receipt" size={14} /> Nouvelle facture</Link>
        <Link href={`/chantiers/nouveau?clientId=${client.id}`} className="btn-secondary btn-sm"><Icon name="Building2" size={14} /> Nouveau chantier</Link>
        <Link href={`/messagerie?clientId=${client.id}`} className="btn-secondary btn-sm"><Icon name="MessageSquare" size={14} /> Envoyer un message</Link>
        {client.phone && <a href={`tel:${client.phone}`} className="btn-secondary btn-sm"><Icon name="Phone" size={14} /> Appeler</a>}
        {client.email && <a href={`mailto:${client.email}`} className="btn-secondary btn-sm"><Icon name="Mail" size={14} /> Email</a>}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3">
          <Tabs
            tabs={[
              {
                label: 'Chantiers', count: client.chantiers.length,
                content: (
                  <div className="space-y-2">
                    {client.chantiers.length === 0 && <p className="text-sm text-ink-400 py-6 text-center">Aucun chantier</p>}
                    {client.chantiers.map((c) => (
                      <Link key={c.id} href={`/chantiers/${c.id}`} className="flex items-center justify-between rounded-xl border border-ink-100 px-4 py-3 hover:bg-ink-50">
                        <div>
                          <p className="font-medium text-ink-800">{c.name}</p>
                          <p className="text-xs text-ink-400">{c.address}</p>
                        </div>
                        <StatusBadge map={CHANTIER_STATUSES} value={c.status} />
                      </Link>
                    ))}
                  </div>
                ),
              },
              {
                label: 'Devis', count: client.devis.length,
                content: (
                  <div className="space-y-2">
                    {client.devis.length === 0 && <p className="text-sm text-ink-400 py-6 text-center">Aucun devis</p>}
                    {client.devis.map((d) => (
                      <Link key={d.id} href={`/devis/${d.id}`} className="flex items-center justify-between rounded-xl border border-ink-100 px-4 py-3 hover:bg-ink-50">
                        <div>
                          <p className="font-medium text-ink-800">{d.number}</p>
                          <p className="text-xs text-ink-400">{fmtDate(d.date)} · {fmtEUR(d.totalTTC)}</p>
                        </div>
                        <StatusBadge map={DEVIS_STATUSES} value={d.status} />
                      </Link>
                    ))}
                  </div>
                ),
              },
              {
                label: 'Factures', count: client.factures.length,
                content: (
                  <div className="space-y-2">
                    {client.factures.length === 0 && <p className="text-sm text-ink-400 py-6 text-center">Aucune facture</p>}
                    {client.factures.map((f) => (
                      <Link key={f.id} href={`/factures/${f.id}`} className="flex items-center justify-between rounded-xl border border-ink-100 px-4 py-3 hover:bg-ink-50">
                        <div>
                          <p className="font-medium text-ink-800">{f.number}</p>
                          <p className="text-xs text-ink-400">{fmtDate(f.date)} · {fmtEUR(f.totalTTC)}</p>
                        </div>
                        <StatusBadge map={FACTURE_STATUSES} value={f.status} />
                      </Link>
                    ))}
                  </div>
                ),
              },
              {
                label: 'Documents', count: client.documents.length,
                content: (
                  <div className="space-y-2">
                    {client.documents.length === 0 && <p className="text-sm text-ink-400 py-6 text-center">Aucun document</p>}
                    {client.documents.map((d) => (
                      <a key={d.id} href={`/api/files/${d.filePath}`} target="_blank" className="flex items-center gap-3 rounded-xl border border-ink-100 px-4 py-3 hover:bg-ink-50">
                        <Icon name="FileText" size={18} className="text-ink-400" />
                        <div>
                          <p className="font-medium text-ink-800">{d.name}</p>
                          <p className="text-xs text-ink-400">{fmtDate(d.createdAt)}</p>
                        </div>
                      </a>
                    ))}
                    <Link href={`/documents?clientId=${client.id}`} className="btn-secondary btn-sm inline-flex mt-2">Gérer les documents</Link>
                  </div>
                ),
              },
              {
                label: 'Notes',
                content: <p className="text-sm text-ink-700 whitespace-pre-wrap">{client.notes || 'Aucune note.'}</p>,
              },
            ]}
          />
        </div>

        <div className="space-y-5">
          <div className="card p-5">
            <h3 className="font-semibold text-ink-800 mb-3 text-sm">Coordonnées</h3>
            <dl className="space-y-2 text-sm">
              <div><dt className="text-ink-400 text-xs">Téléphone</dt><dd className="text-ink-800">{client.phone ?? '—'}</dd></div>
              <div><dt className="text-ink-400 text-xs">Email</dt><dd className="text-ink-800">{client.email ?? '—'}</dd></div>
              <div><dt className="text-ink-400 text-xs">Adresse</dt><dd className="text-ink-800">{client.address ?? '—'}</dd></div>
              <div><dt className="text-ink-400 text-xs">Adresse chantier</dt><dd className="text-ink-800">{client.siteAddress ?? '—'}</dd></div>
            </dl>
          </div>

          <PortalAccessBox clientId={client.id} enabled={client.portalEnabled} email={client.email} />
        </div>
      </div>
    </div>
  );
}

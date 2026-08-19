import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { requireUser } from '@/lib/session';
import { PageHeader } from '@/components/ui/PageHeader';
import { Icon } from '@/components/shell/Icon';
import { ConfirmSubmitButton } from '@/components/ui/ConfirmSubmit';
import { fmtDate, fmtEUR } from '@/lib/enums';
import { updateSupplier, deleteSupplier, createOrder } from '../actions';

export default async function FournisseurDetailPage({ params }: { params: { id: string } }) {
  const user = await requireUser();
  const supplier = await prisma.supplier.findFirst({
    where: { id: params.id, companyId: user.companyId },
    include: { materials: true, orders: { include: { chantier: true }, orderBy: { date: 'desc' } }, documents: true },
  });
  if (!supplier) notFound();
  const chantiers = await prisma.chantier.findMany({ where: { companyId: user.companyId }, orderBy: { name: 'asc' } });

  const updateAction = updateSupplier.bind(null, supplier.id);
  const orderAction = createOrder.bind(null, supplier.id);

  return (
    <div className="max-w-4xl">
      <div className="flex items-start justify-between gap-3">
        <PageHeader title={supplier.name} />
        <form action={deleteSupplier.bind(null, supplier.id)}>
          <ConfirmSubmitButton message="Supprimer ce fournisseur ?"><Icon name="Trash2" size={14} /> Supprimer</ConfirmSubmitButton>
        </form>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="space-y-6">
          <div className="card p-5">
            <h3 className="font-semibold text-ink-800 mb-3 text-sm">Coordonnées</h3>
            <form action={updateAction} className="space-y-2">
              <input name="name" defaultValue={supplier.name} required className="input" />
              <input name="contactName" defaultValue={supplier.contactName ?? ''} placeholder="Contact" className="input" />
              <input name="phone" defaultValue={supplier.phone ?? ''} placeholder="Téléphone" className="input" />
              <input name="email" defaultValue={supplier.email ?? ''} placeholder="Email" className="input" />
              <input name="address" defaultValue={supplier.address ?? ''} placeholder="Adresse" className="input" />
              <textarea name="notes" defaultValue={supplier.notes ?? ''} placeholder="Notes" className="input min-h-16" />
              <button className="btn-primary btn-sm">Enregistrer</button>
            </form>
          </div>

          <div className="card p-5">
            <h3 className="font-semibold text-ink-800 mb-3 text-sm">Matériaux fournis</h3>
            <div className="space-y-1.5">
              {supplier.materials.map((m) => (
                <div key={m.id} className="flex items-center justify-between text-sm rounded-lg bg-ink-50 px-3 py-2">
                  <span>{m.name}</span><span className="text-ink-500">{fmtEUR(m.purchasePrice)}/{m.unit}</span>
                </div>
              ))}
              {supplier.materials.length === 0 && <p className="text-sm text-ink-400">Aucun matériau</p>}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="card p-5">
            <h3 className="font-semibold text-ink-800 mb-3 text-sm">Nouvelle commande</h3>
            <form action={orderAction} className="space-y-2">
              <select name="chantierId" className="select">
                <option value="">Sans chantier</option>
                {chantiers.map((c) => (<option key={c.id} value={c.id}>{c.name}</option>))}
              </select>
              <input type="number" step="0.01" name="total" placeholder="Montant €" className="input" />
              <input name="notes" placeholder="Détails de la commande" className="input" />
              <button className="btn-primary btn-sm w-full">Enregistrer la commande</button>
            </form>
          </div>
          <div className="card p-5">
            <h3 className="font-semibold text-ink-800 mb-3 text-sm">Historique des commandes</h3>
            <div className="space-y-1.5">
              {supplier.orders.map((o) => (
                <div key={o.id} className="flex items-center justify-between text-sm rounded-lg bg-ink-50 px-3 py-2">
                  <span>{fmtDate(o.date)} {o.chantier ? `· ${o.chantier.name}` : ''}</span>
                  <span className="font-medium">{fmtEUR(o.total)}</span>
                </div>
              ))}
              {supplier.orders.length === 0 && <p className="text-sm text-ink-400">Aucune commande</p>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

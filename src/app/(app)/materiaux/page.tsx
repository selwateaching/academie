import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { requireUser } from '@/lib/session';
import { PageHeader, EmptyState } from '@/components/ui/PageHeader';
import { Icon } from '@/components/shell/Icon';
import { fmtEUR } from '@/lib/enums';
import { deleteMaterial } from './actions';
import { StockMoveForm } from './StockMoveForm';
import { ConfirmSubmitButton } from '@/components/ui/ConfirmSubmit';

export const dynamic = 'force-dynamic';

export default async function MateriauxPage() {
  const user = await requireUser();
  const [materials, chantiers] = await Promise.all([
    prisma.material.findMany({ where: { companyId: user.companyId }, include: { supplier: true }, orderBy: { name: 'asc' } }),
    prisma.chantier.findMany({ where: { companyId: user.companyId }, orderBy: { name: 'asc' } }),
  ]);
  const lowStock = materials.filter((m) => m.quantityAvailable <= m.stockMin);

  return (
    <div>
      <PageHeader
        title="Matériaux / Stock"
        description={`${materials.length} référence${materials.length > 1 ? 's' : ''}${lowStock.length > 0 ? ` · ${lowStock.length} en stock faible` : ''}`}
        actions={<Link href="/materiaux/nouveau" className="btn-primary"><Icon name="Plus" size={16} /> Nouveau matériau</Link>}
      />

      {materials.length === 0 ? (
        <EmptyState title="Aucun matériau" action={<Link href="/materiaux/nouveau" className="btn-primary">Nouveau matériau</Link>} />
      ) : (
        <div className="table-wrap">
          <table className="data">
            <thead>
              <tr><th>Référence</th><th>Nom</th><th>Fournisseur</th><th>Prix achat</th><th>Stock</th><th>Emplacement</th><th></th></tr>
            </thead>
            <tbody>
              {materials.map((m) => {
                const low = m.quantityAvailable <= m.stockMin;
                return (
                  <tr key={m.id} className={low ? 'bg-rose-50/50' : ''}>
                    <td className="text-ink-500 text-xs">{m.reference ?? '—'}</td>
                    <td className="font-medium text-ink-800">{m.name}</td>
                    <td className="text-ink-500">{m.supplier?.name ?? '—'}</td>
                    <td>{fmtEUR(m.purchasePrice)}/{m.unit}</td>
                    <td>
                      <span className={`font-semibold ${low ? 'text-rose-600' : 'text-ink-800'}`}>{m.quantityAvailable} {m.unit}</span>
                      {low && <span className="badge bg-rose-100 text-rose-600 border-rose-200 ml-2">Stock faible</span>}
                      <p className="text-xs text-ink-400">Seuil : {m.stockMin} {m.unit}</p>
                    </td>
                    <td className="text-ink-500 text-xs">{m.location ?? '—'}</td>
                    <td>
                      <div className="flex items-center gap-1.5">
                        <StockMoveForm materialId={m.id} chantiers={chantiers.map((c) => ({ id: c.id, name: c.name }))} />
                        <form action={deleteMaterial.bind(null, m.id)}>
                          <ConfirmSubmitButton message="Supprimer ce matériau ?" className="btn-danger btn-sm !px-2"><Icon name="Trash2" size={13} /></ConfirmSubmitButton>
                        </form>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

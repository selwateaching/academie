import * as Icons from 'lucide-react';
import { prisma } from '@/lib/prisma';
import { requireUser } from '@/lib/session';
import { PageHeader } from '@/components/ui/PageHeader';
import { StatCard } from '@/components/ui/StatCard';
import { Icon } from '@/components/shell/Icon';
import { fmtEUR, fmtDate } from '@/lib/enums';
import { syncFactureStatuses } from '@/lib/factureStatus';
import { ExportButtons } from './ExportButtons';

export const dynamic = 'force-dynamic';

export default async function FinancesPage() {
  const user = await requireUser();
  await syncFactureStatuses(user.companyId);

  const now = new Date();
  const startYear = new Date(now.getFullYear(), 0, 1);

  const [factures, supplierOrders, chantiers] = await Promise.all([
    prisma.facture.findMany({ where: { companyId: user.companyId }, include: { client: true } }),
    prisma.supplierOrder.findMany({ where: { supplier: { companyId: user.companyId } }, include: { supplier: true } }),
    prisma.chantier.findMany({ where: { companyId: user.companyId }, include: { factures: true } }),
  ]);

  const caAnnee = factures.filter((f) => f.status === 'PAYEE' && f.date >= startYear).reduce((s, f) => s + f.totalTTC, 0);
  const encaissements = factures.reduce((s, f) => s + f.paidAmount, 0);
  const impayes = factures.filter((f) => ['IMPAYEE', 'EN_RETARD', 'PARTIELLEMENT_PAYEE', 'ENVOYEE'].includes(f.status)).reduce((s, f) => s + (f.totalTTC - f.paidAmount), 0);
  const depensesFournisseurs = supplierOrders.reduce((s, o) => s + o.total, 0);
  const depensesChantiers = chantiers.reduce((s, c) => s + c.costActual, 0);
  const tva = factures.filter((f) => f.status === 'PAYEE').reduce((s, f) => s + (f.totalTTC - f.totalHT), 0);
  const tresorerie = encaissements - depensesFournisseurs - depensesChantiers;

  const totalRevenueActual = chantiers.reduce((s, c) => s + c.factures.filter((f) => f.status === 'PAYEE').reduce((s2, f) => s2 + f.totalTTC, 0), 0);
  const totalMargin = totalRevenueActual - depensesChantiers;

  return (
    <div>
      <PageHeader
        title="Finances"
        description="Suivi financier de l'entreprise. Export possible pour votre expert-comptable."
        actions={<ExportButtons />}
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
        <StatCard label="CA encaissé (année)" value={fmtEUR(caAnnee)} icon={Icons.TrendingUp} tone="brand" />
        <StatCard label="Encaissements totaux" value={fmtEUR(encaissements)} icon={Icons.Wallet} tone="success" />
        <StatCard label="Impayés" value={fmtEUR(impayes)} icon={Icons.AlertTriangle} tone="danger" />
        <StatCard label="Trésorerie estimée" value={fmtEUR(tresorerie)} icon={Icons.PiggyBank} tone={tresorerie >= 0 ? 'success' : 'danger'} />
        <StatCard label="Dépenses chantiers" value={fmtEUR(depensesChantiers)} icon={Icons.HardHat} />
        <StatCard label="Achats fournisseurs" value={fmtEUR(depensesFournisseurs)} icon={Icons.Truck} />
        <StatCard label="TVA collectée (estimée)" value={fmtEUR(tva)} icon={Icons.Receipt} />
        <StatCard label="Marge globale" value={fmtEUR(totalMargin)} icon={Icons.LineChart} tone={totalMargin >= 0 ? 'success' : 'danger'} />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="card p-5">
          <h3 className="font-semibold text-ink-800 mb-3">Factures clients récentes</h3>
          <div className="space-y-1.5 max-h-80 overflow-y-auto">
            {factures.slice(0, 15).map((f) => (
              <div key={f.id} className="flex items-center justify-between text-sm rounded-lg bg-ink-50 px-3 py-2">
                <span>{f.number} · {f.client.firstName} {f.client.lastName}</span>
                <span className="font-medium">{fmtEUR(f.totalTTC)}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="card p-5">
          <h3 className="font-semibold text-ink-800 mb-3">Commandes fournisseurs récentes</h3>
          <div className="space-y-1.5 max-h-80 overflow-y-auto">
            {supplierOrders.slice(0, 15).map((o) => (
              <div key={o.id} className="flex items-center justify-between text-sm rounded-lg bg-ink-50 px-3 py-2">
                <span>{o.supplier.name} · {fmtDate(o.date)}</span>
                <span className="font-medium">{fmtEUR(o.total)}</span>
              </div>
            ))}
            {supplierOrders.length === 0 && <p className="text-sm text-ink-400 text-center py-4">Aucune commande</p>}
          </div>
        </div>
      </div>

      <p className="text-xs text-ink-400 mt-6">
        Ces chiffres sont une aide au pilotage et ne remplacent pas la tenue d'une comptabilité officielle. Exportez vos données pour les transmettre à votre expert-comptable.
      </p>
    </div>
  );
}

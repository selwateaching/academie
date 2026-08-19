import { prisma } from '@/lib/prisma';
import { requireUser } from '@/lib/session';
import { PageHeader } from '@/components/ui/PageHeader';
import { fmtEUR, fmtDate, LINE_TYPES } from '@/lib/enums';
import { YearlyRevenueChart, WinLossPie, TypeRevenueChart } from './RapportsCharts';
import { ExportButtons } from '../finances/ExportButtons';

export const dynamic = 'force-dynamic';

export default async function RapportsPage() {
  const user = await requireUser();
  const now = new Date();

  const [factures, devis, chantiers, timeEntries] = await Promise.all([
    prisma.facture.findMany({ where: { companyId: user.companyId }, include: { lines: true } }),
    prisma.devis.findMany({ where: { companyId: user.companyId } }),
    prisma.chantier.findMany({ where: { companyId: user.companyId }, include: { factures: true } }),
    prisma.timeEntry.findMany({ where: { user: { companyId: user.companyId } }, include: { chantier: true } }),
  ]);

  const monthlyData: { month: string; ca: number }[] = [];
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const dEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
    const ca = factures.filter((f) => f.status === 'PAYEE' && f.date >= d && f.date < dEnd).reduce((s, f) => s + f.totalTTC, 0);
    monthlyData.push({ month: new Intl.DateTimeFormat('fr-FR', { month: 'short', year: '2-digit' }).format(d), ca });
  }

  const devisGagnes = devis.filter((d) => d.status === 'ACCEPTE').length;
  const devisPerdus = devis.filter((d) => d.status === 'REFUSE').length;

  const facturesImpayees = factures.filter((f) => ['IMPAYEE', 'EN_RETARD'].includes(f.status));

  const typeMap = new Map<string, number>();
  for (const f of factures.filter((f) => f.status === 'PAYEE')) {
    for (const l of f.lines) {
      typeMap.set(l.type, (typeMap.get(l.type) ?? 0) + l.quantity * l.unitPrice);
    }
  }
  const typeData = Array.from(typeMap.entries()).map(([type, value]) => ({ name: LINE_TYPES[type as keyof typeof LINE_TYPES] ?? type, value }));

  const profitability = chantiers.map((c) => {
    const revenueActual = c.factures.filter((f) => f.status === 'PAYEE').reduce((s, f) => s + f.totalTTC, 0);
    return { name: c.name, revenueActual, cost: c.costActual, margin: revenueActual - c.costActual };
  }).sort((a, b) => b.margin - a.margin);

  const hoursByChantier = new Map<string, number>();
  for (const t of timeEntries) {
    if (t.chantier) hoursByChantier.set(t.chantier.name, (hoursByChantier.get(t.chantier.name) ?? 0) + t.hours);
  }

  return (
    <div>
      <PageHeader title="Rapports" description="Analyses et exports pour piloter votre activité." actions={<ExportButtons />} />

      <div className="grid lg:grid-cols-3 gap-5 mb-5">
        <div className="lg:col-span-2 card p-5">
          <h3 className="font-semibold text-ink-800 mb-1">Chiffre d'affaires (12 mois)</h3>
          <YearlyRevenueChart data={monthlyData} />
        </div>
        <div className="card p-5">
          <h3 className="font-semibold text-ink-800 mb-1">Devis gagnés / perdus</h3>
          <WinLossPie won={devisGagnes} lost={devisPerdus} />
          <div className="flex justify-between text-sm mt-2">
            <span className="text-emerald-600 font-medium">{devisGagnes} gagnés</span>
            <span className="text-rose-600 font-medium">{devisPerdus} perdus</span>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-5 mb-5">
        <div className="card p-5">
          <h3 className="font-semibold text-ink-800 mb-1">CA par type de travaux</h3>
          <TypeRevenueChart data={typeData} />
        </div>
        <div className="card p-5">
          <h3 className="font-semibold text-ink-800 mb-3">Rentabilité par chantier</h3>
          <div className="table-wrap !shadow-none !border-ink-100 max-h-72 overflow-y-auto">
            <table className="data">
              <thead><tr><th>Chantier</th><th>CA encaissé</th><th>Coût</th><th>Marge</th></tr></thead>
              <tbody>
                {profitability.map((p) => (
                  <tr key={p.name}>
                    <td>{p.name}</td><td>{fmtEUR(p.revenueActual)}</td><td>{fmtEUR(p.cost)}</td>
                    <td className={p.margin >= 0 ? 'text-emerald-600 font-medium' : 'text-rose-600 font-medium'}>{fmtEUR(p.margin)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-5">
        <div className="card p-5">
          <h3 className="font-semibold text-ink-800 mb-3">Factures impayées ({facturesImpayees.length})</h3>
          <div className="space-y-1.5 max-h-64 overflow-y-auto">
            {facturesImpayees.map((f) => (
              <div key={f.id} className="flex items-center justify-between text-sm rounded-lg bg-rose-50 px-3 py-2">
                <span>{f.number} · échéance {fmtDate(f.dueDate)}</span>
                <span className="font-medium text-rose-700">{fmtEUR(f.totalTTC - f.paidAmount)}</span>
              </div>
            ))}
            {facturesImpayees.length === 0 && <p className="text-sm text-ink-400 text-center py-4">Aucune facture impayée 🎉</p>}
          </div>
        </div>
        <div className="card p-5">
          <h3 className="font-semibold text-ink-800 mb-3">Heures par chantier</h3>
          <div className="space-y-1.5 max-h-64 overflow-y-auto">
            {Array.from(hoursByChantier.entries()).map(([name, hours]) => (
              <div key={name} className="flex items-center justify-between text-sm rounded-lg bg-ink-50 px-3 py-2">
                <span>{name}</span><span className="font-medium">{hours}h</span>
              </div>
            ))}
            {hoursByChantier.size === 0 && <p className="text-sm text-ink-400 text-center py-4">Aucune donnée</p>}
          </div>
        </div>
      </div>
    </div>
  );
}

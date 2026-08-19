import * as Icons from 'lucide-react';
import { prisma } from '@/lib/prisma';
import { requireUser } from '@/lib/session';
import { PageHeader } from '@/components/ui/PageHeader';
import { StatCard } from '@/components/ui/StatCard';
import { StatusBadge } from '@/components/ui/Badge';
import { Icon } from '@/components/shell/Icon';
import { RevenueChart, DevisPie, ProfitabilityChart } from './DashboardCharts';
import {
  fmtEUR, fmtDate, fmtDateTime,
  DEVIS_STATUSES, FACTURE_STATUSES, CHANTIER_STATUSES, TASK_PRIORITIES, EVENT_TYPES,
} from '@/lib/enums';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const user = await requireUser();
  const companyId = user.companyId;

  const now = new Date();
  const startToday = new Date(now); startToday.setHours(0, 0, 0, 0);
  const endToday = new Date(now); endToday.setHours(23, 59, 59, 999);
  const endWeek = new Date(now); endWeek.setDate(endWeek.getDate() + 7);
  const startYear = new Date(now.getFullYear(), 0, 1);
  const startMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [
    devisAll, facturesAll, chantiers, eventsToday, eventsWeek, urgentTasks,
    recentDocs, recentMessages, recentNotifs, materialsLow,
  ] = await Promise.all([
    prisma.devis.findMany({ where: { companyId }, include: { client: true } }),
    prisma.facture.findMany({ where: { companyId }, include: { client: true, chantier: true } }),
    prisma.chantier.findMany({ where: { companyId }, include: { client: true, factures: true } }),
    prisma.calendarEvent.findMany({ where: { companyId, start: { gte: startToday, lte: endToday } }, include: { chantier: true, client: true }, orderBy: { start: 'asc' } }),
    prisma.calendarEvent.count({ where: { companyId, start: { gte: startToday, lte: endWeek } } }),
    prisma.task.findMany({ where: { companyId, priority: 'URGENTE', status: { not: 'TERMINEE' } }, include: { chantier: true, client: true }, orderBy: { dueDate: 'asc' }, take: 5 }),
    prisma.document.findMany({ where: { companyId }, orderBy: { createdAt: 'desc' }, take: 5 }),
    prisma.message.findMany({ where: { conversation: { companyId } }, include: { senderUser: true, senderClient: true, conversation: true }, orderBy: { createdAt: 'desc' }, take: 5 }),
    prisma.notification.findMany({ where: { userId: user.id }, orderBy: { createdAt: 'desc' }, take: 5 }),
    prisma.material.findMany({ where: { companyId }, take: 100 }),
  ]);

  // ─── Devis stats ───
  const devisEnAttente = devisAll.filter((d) => ['ENVOYE', 'CONSULTE'].includes(d.status));
  const devisAcceptes = devisAll.filter((d) => d.status === 'ACCEPTE');
  const devisRefuses = devisAll.filter((d) => d.status === 'REFUSE');
  const devisExpirantBientot = devisAll.filter((d) => d.validUntil && d.validUntil > now && d.validUntil < endWeek && ['ENVOYE', 'CONSULTE'].includes(d.status));

  // ─── Factures stats ───
  const facturesAPayer = facturesAll.filter((f) => ['ENVOYEE'].includes(f.status));
  const facturesImpayees = facturesAll.filter((f) => ['IMPAYEE', 'EN_RETARD'].includes(f.status));
  const facturesPayees = facturesAll.filter((f) => f.status === 'PAYEE');
  const facturesEnRetard = facturesAll.filter((f) => f.dueDate && f.dueDate < now && f.status !== 'PAYEE');
  const facturesEcheanceProche = facturesAll.filter((f) => f.dueDate && f.dueDate >= now && f.dueDate < endWeek && f.status !== 'PAYEE');

  const caAnnee = facturesAll.filter((f) => f.status === 'PAYEE' && f.date >= startYear).reduce((s, f) => s + f.totalTTC, 0);
  const caMois = facturesAll.filter((f) => f.status === 'PAYEE' && f.date >= startMonth).reduce((s, f) => s + f.totalTTC, 0);

  // ─── Chantiers ───
  const chantiersEnCours = chantiers.filter((c) => c.status === 'EN_COURS');
  const chantiersAVenir = chantiers.filter((c) => ['PLANIFIE', 'A_PREPARER'].includes(c.status));

  // ─── Rentabilité (top 5 par marge) ───
  const profitability = chantiers
    .filter((c) => c.status !== 'ARCHIVE')
    .map((c) => {
      const revenueActual = c.factures.filter((f) => f.status === 'PAYEE').reduce((s, f) => s + f.totalTTC, 0);
      const marge = revenueActual - c.costActual;
      return { name: c.name.length > 22 ? c.name.slice(0, 20) + '…' : c.name, marge, id: c.id };
    })
    .sort((a, b) => Math.abs(b.marge) - Math.abs(a.marge))
    .slice(0, 5);

  // ─── Graphique CA mensuel (6 derniers mois) ───
  const revenueChartData: { month: string; ca: number }[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const dEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
    const label = new Intl.DateTimeFormat('fr-FR', { month: 'short' }).format(d);
    const ca = facturesAll.filter((f) => f.status === 'PAYEE' && f.date >= d && f.date < dEnd).reduce((s, f) => s + f.totalTTC, 0);
    revenueChartData.push({ month: label, ca });
  }

  const devisPieData = [
    { name: 'Brouillon', value: devisAll.filter((d) => d.status === 'BROUILLON').length },
    { name: 'Envoyé', value: devisAll.filter((d) => d.status === 'ENVOYE').length },
    { name: 'Consulté', value: devisAll.filter((d) => d.status === 'CONSULTE').length },
    { name: 'Accepté', value: devisAcceptes.length },
    { name: 'Refusé', value: devisRefuses.length },
  ];

  const lowStock = materialsLow.filter((m) => m.quantityAvailable <= m.stockMin);

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Bonjour ${user.name.split(' ')[0]} 👋`}
        description={new Intl.DateTimeFormat('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(now)}
      />

      {/* Alertes */}
      {(facturesEnRetard.length > 0 || lowStock.length > 0 || devisExpirantBientot.length > 0) && (
        <div className="grid gap-3 sm:grid-cols-3">
          {facturesEnRetard.length > 0 && (
            <Link href="/factures" className="flex items-center gap-3 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 hover:bg-rose-100 transition-colors">
              <Icon name="AlertTriangle" className="text-rose-600 shrink-0" size={20} />
              <p className="text-sm text-rose-800"><strong>{facturesEnRetard.length}</strong> facture{facturesEnRetard.length > 1 ? 's' : ''} en retard de paiement</p>
            </Link>
          )}
          {devisExpirantBientot.length > 0 && (
            <Link href="/devis" className="flex items-center gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 hover:bg-amber-100 transition-colors">
              <Icon name="Clock" className="text-amber-600 shrink-0" size={20} />
              <p className="text-sm text-amber-800"><strong>{devisExpirantBientot.length}</strong> devis expire{devisExpirantBientot.length > 1 ? 'nt' : ''} bientôt</p>
            </Link>
          )}
          {lowStock.length > 0 && (
            <Link href="/materiaux" className="flex items-center gap-3 rounded-2xl border border-orange-200 bg-orange-50 px-4 py-3 hover:bg-orange-100 transition-colors">
              <Icon name="PackageX" className="text-orange-600 shrink-0" size={20} />
              <p className="text-sm text-orange-800"><strong>{lowStock.length}</strong> matériau{lowStock.length > 1 ? 'x' : ''} en stock faible</p>
            </Link>
          )}
        </div>
      )}

      {/* Stats principales */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard label="CA cette année" value={fmtEUR(caAnnee)} icon={Icons.TrendingUp} tone="brand" href="/finances" hint={`${fmtEUR(caMois)} ce mois-ci`} />
        <StatCard label="Devis en attente" value={devisEnAttente.length} icon={Icons.FileClock} tone="warning" href="/devis" />
        <StatCard label="Devis acceptés" value={devisAcceptes.length} icon={Icons.FileCheck} tone="success" href="/devis?status=ACCEPTE" />
        <StatCard label="Devis refusés" value={devisRefuses.length} icon={Icons.FileX} tone="danger" href="/devis?status=REFUSE" />
        <StatCard label="Factures à payer" value={facturesAPayer.length} icon={Icons.Receipt} tone="warning" href="/factures?status=ENVOYEE" />
        <StatCard label="Factures impayées" value={fmtEUR(facturesImpayees.reduce((s, f) => s + (f.totalTTC - f.paidAmount), 0))} icon={Icons.CircleAlert} tone="danger" href="/factures?status=IMPAYEE" />
        <StatCard label="Factures payées" value={facturesPayees.length} icon={Icons.CircleCheck} tone="success" href="/factures?status=PAYEE" />
        <StatCard label="Chantiers en cours" value={chantiersEnCours.length} icon={Icons.HardHat} tone="brand" href="/chantiers?status=EN_COURS" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        {/* Chiffre d'affaires */}
        <div className="xl:col-span-2 card p-5">
          <h3 className="font-semibold text-ink-800 mb-1">Chiffre d'affaires (6 derniers mois)</h3>
          <p className="text-xs text-ink-400 mb-2">Factures encaissées</p>
          <RevenueChart data={revenueChartData} />
        </div>
        <div className="card p-5">
          <h3 className="font-semibold text-ink-800 mb-1">Répartition des devis</h3>
          <p className="text-xs text-ink-400 mb-2">Par statut</p>
          <DevisPie data={devisPieData} />
          <div className="grid grid-cols-2 gap-2 mt-2 text-xs">
            {devisPieData.map((d) => (
              <div key={d.name} className="flex items-center justify-between text-ink-600">
                <span>{d.name}</span><span className="font-semibold">{d.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        {/* Planning du jour */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-ink-800">Planning du jour</h3>
            <Link href="/planning" className="text-xs text-brand-600 font-medium hover:underline">Voir tout ({eventsWeek} cette semaine)</Link>
          </div>
          <div className="space-y-2">
            {eventsToday.length === 0 && <p className="text-sm text-ink-400 py-4 text-center">Aucun événement aujourd'hui</p>}
            {eventsToday.map((e) => (
              <div key={e.id} className="flex items-start gap-2.5 rounded-xl border border-ink-100 px-3 py-2.5">
                <span className="h-2.5 w-2.5 rounded-full mt-1.5 shrink-0" style={{ backgroundColor: (EVENT_TYPES as any)[e.type]?.color ?? '#64748b' }} />
                <div className="min-w-0">
                  <p className="text-sm font-medium text-ink-800 truncate">{e.title}</p>
                  <p className="text-xs text-ink-400">
                    {new Intl.DateTimeFormat('fr-FR', { hour: '2-digit', minute: '2-digit' }).format(e.start)}
                    {e.chantier ? ` · ${e.chantier.name}` : e.client ? ` · ${e.client.firstName} ${e.client.lastName}` : ''}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Tâches urgentes */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-ink-800">Tâches urgentes</h3>
            <Link href="/taches" className="text-xs text-brand-600 font-medium hover:underline">Voir tout</Link>
          </div>
          <div className="space-y-2">
            {urgentTasks.length === 0 && <p className="text-sm text-ink-400 py-4 text-center">Aucune tâche urgente 🎉</p>}
            {urgentTasks.map((t) => (
              <div key={t.id} className="flex items-start gap-2.5 rounded-xl border border-rose-100 bg-rose-50/50 px-3 py-2.5">
                <Icon name="AlertCircle" size={16} className="text-rose-500 mt-0.5 shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm font-medium text-ink-800 truncate">{t.title}</p>
                  <p className="text-xs text-ink-400">{t.dueDate ? fmtDate(t.dueDate) : ''}{t.chantier ? ` · ${t.chantier.name}` : ''}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Rentabilité */}
        <div className="card p-5">
          <h3 className="font-semibold text-ink-800 mb-1">Rentabilité des chantiers</h3>
          <p className="text-xs text-ink-400 mb-2">Marge estimée (CA encaissé - coûts)</p>
          {profitability.length === 0 ? <p className="text-sm text-ink-400 py-8 text-center">Pas encore de données</p> : <ProfitabilityChart data={profitability} />}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Chantiers en cours / à venir */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-ink-800">Chantiers</h3>
            <Link href="/chantiers" className="text-xs text-brand-600 font-medium hover:underline">Voir tout</Link>
          </div>
          <div className="space-y-2">
            {[...chantiersEnCours, ...chantiersAVenir].slice(0, 5).map((c) => (
              <Link key={c.id} href={`/chantiers/${c.id}`} className="block rounded-xl border border-ink-100 px-3 py-2.5 hover:bg-ink-50">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-medium text-ink-800 truncate">{c.name}</p>
                  <StatusBadge map={CHANTIER_STATUSES} value={c.status} />
                </div>
                <div className="mt-1.5 h-1.5 rounded-full bg-ink-100 overflow-hidden">
                  <div className="h-full bg-brand-600 rounded-full" style={{ width: `${c.progress}%` }} />
                </div>
              </Link>
            ))}
            {chantiersEnCours.length + chantiersAVenir.length === 0 && <p className="text-sm text-ink-400 py-4 text-center">Aucun chantier actif</p>}
          </div>
        </div>

        {/* Documents récents */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-ink-800">Documents récents</h3>
            <Link href="/documents" className="text-xs text-brand-600 font-medium hover:underline">Voir tout</Link>
          </div>
          <div className="space-y-2">
            {recentDocs.length === 0 && <p className="text-sm text-ink-400 py-4 text-center">Aucun document</p>}
            {recentDocs.map((d) => (
              <div key={d.id} className="flex items-center gap-2.5 rounded-xl border border-ink-100 px-3 py-2.5">
                <Icon name="FileText" size={16} className="text-ink-400 shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm font-medium text-ink-800 truncate">{d.name}</p>
                  <p className="text-xs text-ink-400">{fmtDate(d.createdAt)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Messages récents */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-ink-800">Messages récents</h3>
            <Link href="/messagerie" className="text-xs text-brand-600 font-medium hover:underline">Voir tout</Link>
          </div>
          <div className="space-y-2">
            {recentMessages.length === 0 && <p className="text-sm text-ink-400 py-4 text-center">Aucun message</p>}
            {recentMessages.map((m) => (
              <div key={m.id} className="rounded-xl border border-ink-100 px-3 py-2.5">
                <p className="text-xs font-semibold text-ink-600">{m.senderUser?.name ?? m.senderClient?.firstName ?? 'Inconnu'}</p>
                <p className="text-sm text-ink-700 truncate">{m.body}</p>
                <p className="text-xs text-ink-400 mt-0.5">{fmtDateTime(m.createdAt)}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

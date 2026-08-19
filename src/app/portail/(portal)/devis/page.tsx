import Link from 'next/link';
import { requireClientSession } from '@/lib/clientAuth';
import { prisma } from '@/lib/prisma';
import { DEVIS_STATUSES, fmtDate, fmtEUR } from '@/lib/enums';
import { StatusBadge } from '@/components/ui/Badge';

export const dynamic = 'force-dynamic';

export default async function PortalDevisPage() {
  const session = await requireClientSession();
  const devisList = await prisma.devis.findMany({ where: { clientId: session.clientId, status: { not: 'BROUILLON' } }, orderBy: { createdAt: 'desc' } });

  return (
    <div>
      <h1 className="text-xl font-bold text-ink-900 mb-5">Mes devis</h1>
      <div className="space-y-2">
        {devisList.map((d) => (
          <Link key={d.id} href={`/portail/devis/${d.id}`} className="card p-4 flex items-center justify-between hover:shadow-pop">
            <div>
              <p className="font-semibold text-ink-800">{d.number}</p>
              <p className="text-xs text-ink-400">{fmtDate(d.date)} · {fmtEUR(d.totalTTC)}</p>
            </div>
            <StatusBadge map={DEVIS_STATUSES} value={d.status} />
          </Link>
        ))}
        {devisList.length === 0 && <p className="text-sm text-ink-400 text-center py-10">Aucun devis</p>}
      </div>
    </div>
  );
}

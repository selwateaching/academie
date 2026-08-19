import Link from 'next/link';
import { requireClientSession } from '@/lib/clientAuth';
import { prisma } from '@/lib/prisma';
import { FACTURE_STATUSES, fmtDate, fmtEUR } from '@/lib/enums';
import { StatusBadge } from '@/components/ui/Badge';

export const dynamic = 'force-dynamic';

export default async function PortalFacturesPage() {
  const session = await requireClientSession();
  const factures = await prisma.facture.findMany({ where: { clientId: session.clientId, status: { not: 'BROUILLON' } }, orderBy: { createdAt: 'desc' } });

  return (
    <div>
      <h1 className="text-xl font-bold text-ink-900 mb-5">Mes factures</h1>
      <div className="space-y-2">
        {factures.map((f) => (
          <Link key={f.id} href={`/portail/factures/${f.id}`} className="card p-4 flex items-center justify-between hover:shadow-pop">
            <div>
              <p className="font-semibold text-ink-800">{f.number}</p>
              <p className="text-xs text-ink-400">{fmtDate(f.date)} · {fmtEUR(f.totalTTC)}</p>
            </div>
            <StatusBadge map={FACTURE_STATUSES} value={f.status} />
          </Link>
        ))}
        {factures.length === 0 && <p className="text-sm text-ink-400 text-center py-10">Aucune facture</p>}
      </div>
    </div>
  );
}

import { prisma } from '@/lib/prisma';
import { requireUser } from '@/lib/session';
import { PageHeader } from '@/components/ui/PageHeader';
import { ChantiersMap } from './ChantiersMap';
import { CHANTIER_STATUSES, fmtDate } from '@/lib/enums';
import { StatusBadge } from '@/components/ui/Badge';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function CartePage() {
  const user = await requireUser();
  const chantiers = await prisma.chantier.findMany({
    where: { companyId: user.companyId, status: { not: 'ARCHIVE' } },
    include: { client: true, manager: true },
    orderBy: { createdAt: 'desc' },
  });

  const points = chantiers
    .filter((c) => c.lat != null && c.lng != null)
    .map((c) => ({
      id: c.id, name: c.name, address: c.address, lat: c.lat as number, lng: c.lng as number,
      status: c.status, clientName: `${c.client.firstName} ${c.client.lastName}`,
      managerName: c.manager?.name, startDate: c.startDate ? c.startDate.toISOString() : null,
    }));

  const withoutCoords = chantiers.filter((c) => c.lat == null || c.lng == null);

  return (
    <div>
      <PageHeader title="Carte des chantiers" description={`${points.length} chantier(s) localisé(s) sur ${chantiers.length}`} />
      <ChantiersMap chantiers={points} />
      {withoutCoords.length > 0 && (
        <div className="card p-4 mt-4">
          <p className="text-xs font-semibold text-ink-500 mb-2">Chantiers sans coordonnées (ajoutez latitude/longitude pour les localiser)</p>
          <div className="flex flex-wrap gap-2">
            {withoutCoords.map((c) => (
              <Link key={c.id} href={`/chantiers/${c.id}/modifier`} className="badge bg-ink-100 text-ink-600 border-ink-200 hover:bg-ink-200">
                {c.name}
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

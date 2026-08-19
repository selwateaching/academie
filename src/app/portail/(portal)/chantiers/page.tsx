import { requireClientSession } from '@/lib/clientAuth';
import { prisma } from '@/lib/prisma';
import { CHANTIER_STATUSES, PHOTO_CATEGORIES, fmtDate } from '@/lib/enums';
import { StatusBadge } from '@/components/ui/Badge';

export const dynamic = 'force-dynamic';

export default async function PortalChantiersPage() {
  const session = await requireClientSession();
  const chantiers = await prisma.chantier.findMany({
    where: { clientId: session.clientId },
    include: { photos: { orderBy: { takenAt: 'desc' }, take: 8 } },
    orderBy: { createdAt: 'desc' },
  });

  return (
    <div>
      <h1 className="text-xl font-bold text-ink-900 mb-5">Mes chantiers</h1>
      <div className="space-y-6">
        {chantiers.map((c) => (
          <div key={c.id} className="card p-5">
            <div className="flex items-center justify-between gap-2 mb-2">
              <p className="font-semibold text-ink-800">{c.name}</p>
              <StatusBadge map={CHANTIER_STATUSES} value={c.status} />
            </div>
            <p className="text-xs text-ink-400 mb-3">{c.address}</p>
            <div className="h-2.5 rounded-full bg-ink-100 overflow-hidden mb-1">
              <div className="h-full bg-emerald-600 rounded-full" style={{ width: `${c.progress}%` }} />
            </div>
            <p className="text-xs text-ink-500 mb-4">{c.progress}% terminé{c.endDatePlanned ? ` · Fin prévue le ${fmtDate(c.endDatePlanned)}` : ''}</p>
            {c.photos.length > 0 && (
              <div className="grid grid-cols-4 gap-2">
                {c.photos.map((p) => (
                  <a key={p.id} href={`/api/files/${p.filePath}`} target="_blank" className="relative">
                    <img src={`/api/files/${p.filePath}`} className="rounded-lg aspect-square object-cover" alt="" />
                    <span className="absolute bottom-1 left-1 badge bg-black/60 text-white border-0 !py-0 !px-1 text-[9px]">{PHOTO_CATEGORIES[p.category as keyof typeof PHOTO_CATEGORIES]}</span>
                  </a>
                ))}
              </div>
            )}
          </div>
        ))}
        {chantiers.length === 0 && <p className="text-sm text-ink-400 text-center py-10">Aucun chantier pour le moment</p>}
      </div>
    </div>
  );
}

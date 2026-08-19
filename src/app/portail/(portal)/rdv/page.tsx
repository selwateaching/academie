import { requireClientSession } from '@/lib/clientAuth';
import { prisma } from '@/lib/prisma';
import { EVENT_TYPES, fmtDateTime } from '@/lib/enums';

export const dynamic = 'force-dynamic';

export default async function PortalRdvPage() {
  const session = await requireClientSession();
  const events = await prisma.calendarEvent.findMany({ where: { clientId: session.clientId }, orderBy: { start: 'asc' } });
  const now = new Date();
  const upcoming = events.filter((e) => e.start >= now);
  const past = events.filter((e) => e.start < now);

  return (
    <div>
      <h1 className="text-xl font-bold text-ink-900 mb-5">Mes rendez-vous</h1>
      <div className="space-y-2 mb-8">
        {upcoming.map((e) => (
          <div key={e.id} className="card p-4 flex items-center gap-3">
            <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: (EVENT_TYPES as any)[e.type]?.color }} />
            <div>
              <p className="font-medium text-ink-800">{e.title}</p>
              <p className="text-xs text-ink-400">{fmtDateTime(e.start)} {e.location ? `· ${e.location}` : ''}</p>
            </div>
          </div>
        ))}
        {upcoming.length === 0 && <p className="text-sm text-ink-400 text-center py-6">Aucun rendez-vous à venir</p>}
      </div>
      {past.length > 0 && (
        <>
          <p className="text-xs font-bold uppercase text-ink-400 mb-2">Historique</p>
          <div className="space-y-2 opacity-60">
            {past.map((e) => (
              <div key={e.id} className="card p-3 flex items-center gap-3">
                <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: (EVENT_TYPES as any)[e.type]?.color }} />
                <p className="text-sm text-ink-700">{e.title} · {fmtDateTime(e.start)}</p>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

import { prisma } from '@/lib/prisma';
import { requireUser } from '@/lib/session';
import { PageHeader } from '@/components/ui/PageHeader';
import { MonthCalendar } from './MonthCalendar';
import { EVENT_TYPES } from '@/lib/enums';

export const dynamic = 'force-dynamic';

export default async function CalendrierPage({ searchParams }: { searchParams: { year?: string; month?: string } }) {
  const user = await requireUser();
  const now = new Date();
  const year = searchParams.year ? Number(searchParams.year) : now.getFullYear();
  const month = searchParams.month ? Number(searchParams.month) : now.getMonth();

  const rangeStart = new Date(year, month - 1, 25);
  const rangeEnd = new Date(year, month + 2, 5);

  const events = await prisma.calendarEvent.findMany({
    where: { companyId: user.companyId, start: { gte: rangeStart, lte: rangeEnd } },
    include: { chantier: true, client: true },
    orderBy: { start: 'asc' },
  });

  const eventsForClient = events.map((e) => ({
    id: e.id, title: e.title, type: e.type, start: e.start.toISOString(), end: e.end.toISOString(),
    chantierName: e.chantier?.name, clientName: e.client ? `${e.client.firstName} ${e.client.lastName}` : null,
  }));

  return (
    <div>
      <PageHeader title="Calendrier" description="Rendez-vous, livraisons, interventions et réunions. Glissez un événement pour le replanifier." />
      <div className="flex flex-wrap gap-3 mb-4">
        {Object.entries(EVENT_TYPES).map(([k, v]) => (
          <div key={k} className="flex items-center gap-1.5 text-xs text-ink-500">
            <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: v.color }} /> {v.label}
          </div>
        ))}
      </div>
      <div className="card p-4 sm:p-5">
        <MonthCalendar year={year} month={month} events={eventsForClient} />
      </div>
    </div>
  );
}

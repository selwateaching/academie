import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { requireUser } from '@/lib/session';
import { PageHeader } from '@/components/ui/PageHeader';
import { Icon } from '@/components/shell/Icon';
import { EVENT_TYPES } from '@/lib/enums';

export const dynamic = 'force-dynamic';

function startOfWeek(d: Date) {
  const date = new Date(d);
  const day = (date.getDay() + 6) % 7;
  date.setDate(date.getDate() - day);
  date.setHours(0, 0, 0, 0);
  return date;
}

export default async function PlanningPage({ searchParams }: { searchParams: { week?: string } }) {
  const user = await requireUser();
  const base = searchParams.week ? new Date(searchParams.week) : new Date();
  const weekStart = startOfWeek(base);
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + i);
    return d;
  });
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 7);

  const [chantiers, events] = await Promise.all([
    prisma.chantier.findMany({
      where: { companyId: user.companyId, status: { in: ['EN_COURS', 'PLANIFIE'] } },
      include: { members: { include: { user: true } }, client: true },
    }),
    prisma.calendarEvent.findMany({
      where: { companyId: user.companyId, start: { gte: weekStart, lt: weekEnd } },
      include: { chantier: true, client: true, attendees: { include: { user: true } } },
      orderBy: { start: 'asc' },
    }),
  ]);

  function chantiersForDay(day: Date) {
    return chantiers.filter((c) => {
      const start = c.startDate ?? new Date(0);
      const end = c.endDatePlanned ?? new Date(8640000000000000);
      return start <= day && end >= day;
    });
  }
  function eventsForDay(day: Date) {
    return events.filter((e) => e.start.toDateString() === day.toDateString());
  }

  const prevWeek = new Date(weekStart); prevWeek.setDate(prevWeek.getDate() - 7);
  const nextWeek = new Date(weekStart); nextWeek.setDate(nextWeek.getDate() + 7);
  const todayStr = new Date().toDateString();

  return (
    <div>
      <PageHeader
        title="Planning"
        description="Qui travaille où cette semaine — chantiers, équipes et rendez-vous."
        actions={
          <>
            <Link href={`/planning?week=${prevWeek.toISOString()}`} className="btn-secondary btn-sm"><Icon name="ChevronLeft" size={16} /></Link>
            <Link href={`/planning?week=${new Date().toISOString()}`} className="btn-secondary btn-sm">Aujourd'hui</Link>
            <Link href={`/planning?week=${nextWeek.toISOString()}`} className="btn-secondary btn-sm"><Icon name="ChevronRight" size={16} /></Link>
            <Link href="/calendrier" className="btn-primary btn-sm"><Icon name="Calendar" size={16} /> Vue calendrier</Link>
          </>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-3">
        {days.map((day) => {
          const isToday = day.toDateString() === todayStr;
          const dayChantiers = chantiersForDay(day);
          const dayEvents = eventsForDay(day);
          return (
            <div key={day.toISOString()} className={`card p-3 ${isToday ? 'ring-2 ring-brand-500' : ''}`}>
              <p className={`text-xs font-bold uppercase mb-2 ${isToday ? 'text-brand-600' : 'text-ink-500'}`}>
                {new Intl.DateTimeFormat('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' }).format(day)}
              </p>
              <div className="space-y-2 mb-3">
                {dayChantiers.length === 0 && <p className="text-xs text-ink-300">Aucun chantier</p>}
                {dayChantiers.map((c) => (
                  <Link key={c.id} href={`/chantiers/${c.id}`} className="block rounded-lg bg-brand-50 border border-brand-100 px-2 py-1.5 hover:bg-brand-100">
                    <p className="text-xs font-semibold text-brand-800 truncate">{c.name}</p>
                    <p className="text-[10px] text-brand-600 truncate">
                      {c.members.length > 0 ? c.members.map((m) => m.user.name.split(' ')[0]).join(', ') : 'Équipe non assignée'}
                    </p>
                  </Link>
                ))}
              </div>
              <div className="space-y-1.5">
                {dayEvents.map((e) => (
                  <div key={e.id} className="flex items-center gap-1.5 text-[11px] text-ink-600">
                    <span className="h-1.5 w-1.5 rounded-full shrink-0" style={{ backgroundColor: (EVENT_TYPES as any)[e.type]?.color }} />
                    <span className="truncate">{new Intl.DateTimeFormat('fr-FR', { hour: '2-digit', minute: '2-digit' }).format(e.start)} {e.title}</span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

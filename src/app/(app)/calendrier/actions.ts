'use server';

import { prisma } from '@/lib/prisma';
import { requireUser } from '@/lib/session';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { sendMail, EMAIL_TEMPLATES } from '@/lib/mail';

export async function createEvent(formData: FormData) {
  const user = await requireUser();
  const start = new Date(String(formData.get('start')));
  const end = formData.get('end') ? new Date(String(formData.get('end'))) : new Date(start.getTime() + 3600000);
  const attendeeIds = formData.getAll('attendees').map(String);

  const event = await prisma.calendarEvent.create({
    data: {
      companyId: user.companyId,
      title: String(formData.get('title') ?? ''),
      type: String(formData.get('type') ?? 'RDV'),
      start, end,
      chantierId: String(formData.get('chantierId') ?? '') || null,
      clientId: String(formData.get('clientId') ?? '') || null,
      location: String(formData.get('location') ?? '') || null,
      notes: String(formData.get('notes') ?? '') || null,
      attendees: { create: attendeeIds.map((userId) => ({ userId })) },
    },
    include: { client: true, company: true },
  });

  if (event.clientId && event.client?.email && event.type === 'RDV') {
    const tpl = EMAIL_TEMPLATES.confirmationRdv(event.company.name, `${event.client.firstName} ${event.client.lastName}`, new Intl.DateTimeFormat('fr-FR', { dateStyle: 'long', timeStyle: 'short' }).format(start));
    await sendMail({ to: event.client.email, subject: tpl.subject, html: tpl.html });
  }

  revalidatePath('/calendrier');
  revalidatePath('/planning');
  redirect('/calendrier');
}

export async function deleteEvent(eventId: string) {
  const user = await requireUser();
  await prisma.calendarEvent.delete({ where: { id: eventId, companyId: user.companyId } });
  revalidatePath('/calendrier');
  revalidatePath('/planning');
}

export async function rescheduleEvent(eventId: string, newStartIso: string) {
  const user = await requireUser();
  const event = await prisma.calendarEvent.findFirst({ where: { id: eventId, companyId: user.companyId } });
  if (!event) return;
  const duration = event.end.getTime() - event.start.getTime();
  const newStart = new Date(newStartIso);
  const newEnd = new Date(newStart.getTime() + duration);
  await prisma.calendarEvent.update({ where: { id: eventId }, data: { start: newStart, end: newEnd } });
  revalidatePath('/calendrier');
  revalidatePath('/planning');
}

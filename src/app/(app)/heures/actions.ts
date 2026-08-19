'use server';

import { prisma } from '@/lib/prisma';
import { requireUser } from '@/lib/session';
import { revalidatePath } from 'next/cache';

export async function clockIn(chantierId: string) {
  const user = await requireUser();
  const open = await prisma.timeEntry.findFirst({ where: { userId: user.id, endTime: null } });
  if (open) return;
  await prisma.timeEntry.create({
    data: { userId: user.id, chantierId: chantierId || null, date: new Date(), startTime: new Date() },
  });
  revalidatePath('/heures');
}

export async function clockOut(note?: string) {
  const user = await requireUser();
  const open = await prisma.timeEntry.findFirst({ where: { userId: user.id, endTime: null } });
  if (!open || !open.startTime) return;
  const endTime = new Date();
  const hours = Math.round(((endTime.getTime() - open.startTime.getTime()) / 3600000) * 100) / 100;
  await prisma.timeEntry.update({ where: { id: open.id }, data: { endTime, hours, note: note || open.note } });
  revalidatePath('/heures');
}

export async function addManualEntry(formData: FormData) {
  const user = await requireUser();
  const hours = Number(formData.get('hours') ?? 0);
  if (hours <= 0) return;
  await prisma.timeEntry.create({
    data: {
      userId: user.id,
      chantierId: String(formData.get('chantierId') ?? '') || null,
      date: new Date(String(formData.get('date'))),
      hours,
      note: String(formData.get('note') ?? '') || null,
    },
  });
  revalidatePath('/heures');
}

export async function deleteTimeEntry(entryId: string) {
  const user = await requireUser();
  await prisma.timeEntry.deleteMany({ where: { id: entryId, userId: user.id } });
  revalidatePath('/heures');
}

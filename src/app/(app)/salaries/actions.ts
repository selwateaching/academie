'use server';

import { prisma } from '@/lib/prisma';
import { requireUser } from '@/lib/session';
import { revalidatePath } from 'next/cache';

async function requireAdmin() {
  const user = await requireUser();
  if (!['ADMIN', 'CONDUCTEUR'].includes(user.role)) throw new Error('Action non autorisée.');
  return user;
}

export async function updateEmployeeProfile(userId: string, formData: FormData) {
  const user = await requireAdmin();
  await prisma.user.update({
    where: { id: userId, companyId: user.companyId },
    data: {
      phone: String(formData.get('phone') ?? '') || null,
      position: String(formData.get('position') ?? '') || null,
      skills: String(formData.get('skills') ?? '') || null,
      team: String(formData.get('team') ?? '') || null,
    },
  });
  revalidatePath(`/salaries/${userId}`);
}

export async function addAbsence(userId: string, formData: FormData) {
  await requireAdmin();
  await prisma.absence.create({
    data: {
      userId,
      type: String(formData.get('type') ?? 'CONGE'),
      startDate: new Date(String(formData.get('startDate'))),
      endDate: new Date(String(formData.get('endDate'))),
      note: String(formData.get('note') ?? '') || null,
    },
  });
  revalidatePath(`/salaries/${userId}`);
}

export async function deleteAbsence(userId: string, absenceId: string) {
  await requireAdmin();
  await prisma.absence.delete({ where: { id: absenceId } });
  revalidatePath(`/salaries/${userId}`);
}

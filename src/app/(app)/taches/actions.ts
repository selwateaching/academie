'use server';

import { prisma } from '@/lib/prisma';
import { requireUser } from '@/lib/session';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

export async function createTask(formData: FormData) {
  const user = await requireUser();
  await prisma.task.create({
    data: {
      companyId: user.companyId,
      title: String(formData.get('title') ?? ''),
      description: String(formData.get('description') ?? '') || null,
      priority: String(formData.get('priority') ?? 'NORMALE'),
      dueDate: formData.get('dueDate') ? new Date(String(formData.get('dueDate'))) : null,
      clientId: String(formData.get('clientId') ?? '') || null,
      chantierId: String(formData.get('chantierId') ?? '') || null,
      assignedToId: String(formData.get('assignedToId') ?? '') || null,
      createdById: user.id,
    },
  });
  revalidatePath('/taches');
  redirect('/taches');
}

export async function updateTaskStatus(taskId: string, status: string) {
  const user = await requireUser();
  await prisma.task.update({ where: { id: taskId, companyId: user.companyId }, data: { status } });
  revalidatePath('/taches');
}

export async function deleteTask(taskId: string) {
  const user = await requireUser();
  await prisma.task.delete({ where: { id: taskId, companyId: user.companyId } });
  revalidatePath('/taches');
}

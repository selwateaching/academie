'use server';

import { prisma } from '@/lib/prisma';
import { requireUser } from '@/lib/session';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { logAudit } from '@/lib/notify';

export async function createProspect(formData: FormData) {
  const user = await requireUser();
  const prospect = await prisma.prospect.create({
    data: {
      companyId: user.companyId,
      firstName: String(formData.get('firstName') ?? ''),
      lastName: String(formData.get('lastName') ?? ''),
      companyName: String(formData.get('companyName') ?? '') || null,
      email: String(formData.get('email') ?? '') || null,
      phone: String(formData.get('phone') ?? '') || null,
      origin: String(formData.get('origin') ?? '') || null,
      request: String(formData.get('request') ?? '') || null,
      estimatedAmount: formData.get('estimatedAmount') ? Number(formData.get('estimatedAmount')) : null,
      status: String(formData.get('status') ?? 'NOUVEAU'),
      nextAction: String(formData.get('nextAction') ?? '') || null,
      nextActionDate: formData.get('nextActionDate') ? new Date(String(formData.get('nextActionDate'))) : null,
      notes: String(formData.get('notes') ?? '') || null,
    },
  });
  revalidatePath('/prospects');
  redirect(`/prospects/${prospect.id}`);
}

export async function updateProspectStatus(prospectId: string, status: string) {
  const user = await requireUser();
  await prisma.prospect.update({ where: { id: prospectId, companyId: user.companyId }, data: { status } });
  revalidatePath('/prospects');
  revalidatePath(`/prospects/${prospectId}`);
}

export async function addProspectContact(prospectId: string, formData: FormData) {
  const user = await requireUser();
  const note = String(formData.get('note') ?? '').trim();
  if (!note) return;
  await prisma.prospectContact.create({ data: { prospectId, note } });
  revalidatePath(`/prospects/${prospectId}`);
}

export async function convertProspectToClient(prospectId: string) {
  const user = await requireUser();
  const prospect = await prisma.prospect.findFirst({ where: { id: prospectId, companyId: user.companyId } });
  if (!prospect) throw new Error('Prospect introuvable');

  const client = await prisma.client.create({
    data: {
      companyId: user.companyId,
      type: prospect.companyName ? 'ENTREPRISE' : 'PARTICULIER',
      firstName: prospect.firstName,
      lastName: prospect.lastName,
      companyName: prospect.companyName,
      email: prospect.email,
      phone: prospect.phone,
      notes: prospect.notes,
    },
  });
  await prisma.prospect.update({ where: { id: prospectId }, data: { status: 'GAGNE', convertedClientId: client.id } });
  await logAudit(user.companyId, user.id, 'convert', 'Prospect->Client', prospectId, client.id);
  revalidatePath('/prospects');
  redirect(`/clients/${client.id}`);
}

export async function deleteProspect(prospectId: string) {
  const user = await requireUser();
  await prisma.prospect.delete({ where: { id: prospectId, companyId: user.companyId } });
  revalidatePath('/prospects');
  redirect('/prospects');
}

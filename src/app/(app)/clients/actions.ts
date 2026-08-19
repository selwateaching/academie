'use server';

import { prisma } from '@/lib/prisma';
import { requireUser } from '@/lib/session';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { logAudit } from '@/lib/notify';
import bcrypt from 'bcryptjs';

export async function createClient(formData: FormData) {
  const user = await requireUser();
  const client = await prisma.client.create({
    data: {
      companyId: user.companyId,
      type: String(formData.get('type') ?? 'PARTICULIER'),
      firstName: String(formData.get('firstName') ?? ''),
      lastName: String(formData.get('lastName') ?? ''),
      companyName: String(formData.get('companyName') ?? '') || null,
      email: String(formData.get('email') ?? '') || null,
      phone: String(formData.get('phone') ?? '') || null,
      address: String(formData.get('address') ?? '') || null,
      siteAddress: String(formData.get('siteAddress') ?? '') || null,
      notes: String(formData.get('notes') ?? '') || null,
    },
  });
  await logAudit(user.companyId, user.id, 'create', 'Client', client.id);
  revalidatePath('/clients');
  redirect(`/clients/${client.id}`);
}

export async function updateClient(clientId: string, formData: FormData) {
  const user = await requireUser();
  await prisma.client.update({
    where: { id: clientId, companyId: user.companyId },
    data: {
      type: String(formData.get('type') ?? 'PARTICULIER'),
      firstName: String(formData.get('firstName') ?? ''),
      lastName: String(formData.get('lastName') ?? ''),
      companyName: String(formData.get('companyName') ?? '') || null,
      email: String(formData.get('email') ?? '') || null,
      phone: String(formData.get('phone') ?? '') || null,
      address: String(formData.get('address') ?? '') || null,
      siteAddress: String(formData.get('siteAddress') ?? '') || null,
      notes: String(formData.get('notes') ?? '') || null,
    },
  });
  await logAudit(user.companyId, user.id, 'update', 'Client', clientId);
  revalidatePath('/clients');
  revalidatePath(`/clients/${clientId}`);
  redirect(`/clients/${clientId}`);
}

export async function deleteClient(clientId: string) {
  const user = await requireUser();
  await prisma.client.delete({ where: { id: clientId, companyId: user.companyId } });
  await logAudit(user.companyId, user.id, 'delete', 'Client', clientId);
  revalidatePath('/clients');
  redirect('/clients');
}

export async function togglePortalAccess(clientId: string, enable: boolean) {
  const user = await requireUser();
  const data: any = { portalEnabled: enable };
  if (enable) {
    const client = await prisma.client.findUnique({ where: { id: clientId } });
    if (!client?.passwordHash) {
      data.passwordHash = await bcrypt.hash(Math.random().toString(36).slice(2) + 'Btp!', 10);
    }
  }
  await prisma.client.update({ where: { id: clientId, companyId: user.companyId }, data });
  revalidatePath(`/clients/${clientId}`);
}

export async function resetClientPortalPassword(clientId: string, newPassword: string) {
  const user = await requireUser();
  const passwordHash = await bcrypt.hash(newPassword, 10);
  await prisma.client.update({ where: { id: clientId, companyId: user.companyId }, data: { passwordHash, portalEnabled: true } });
  revalidatePath(`/clients/${clientId}`);
}

'use server';

import { prisma } from '@/lib/prisma';
import { requireUser } from '@/lib/session';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

export async function createSupplier(formData: FormData) {
  const user = await requireUser();
  const supplier = await prisma.supplier.create({
    data: {
      companyId: user.companyId,
      name: String(formData.get('name') ?? ''),
      contactName: String(formData.get('contactName') ?? '') || null,
      email: String(formData.get('email') ?? '') || null,
      phone: String(formData.get('phone') ?? '') || null,
      address: String(formData.get('address') ?? '') || null,
      notes: String(formData.get('notes') ?? '') || null,
    },
  });
  revalidatePath('/fournisseurs');
  redirect(`/fournisseurs/${supplier.id}`);
}

export async function updateSupplier(supplierId: string, formData: FormData) {
  const user = await requireUser();
  await prisma.supplier.update({
    where: { id: supplierId, companyId: user.companyId },
    data: {
      name: String(formData.get('name') ?? ''),
      contactName: String(formData.get('contactName') ?? '') || null,
      email: String(formData.get('email') ?? '') || null,
      phone: String(formData.get('phone') ?? '') || null,
      address: String(formData.get('address') ?? '') || null,
      notes: String(formData.get('notes') ?? '') || null,
    },
  });
  revalidatePath('/fournisseurs');
  revalidatePath(`/fournisseurs/${supplierId}`);
}

export async function deleteSupplier(supplierId: string) {
  const user = await requireUser();
  await prisma.supplier.delete({ where: { id: supplierId, companyId: user.companyId } });
  revalidatePath('/fournisseurs');
  redirect('/fournisseurs');
}

export async function createOrder(supplierId: string, formData: FormData) {
  await requireUser();
  await prisma.supplierOrder.create({
    data: {
      supplierId,
      chantierId: String(formData.get('chantierId') ?? '') || null,
      total: Number(formData.get('total') ?? 0),
      status: String(formData.get('status') ?? 'En cours'),
      notes: String(formData.get('notes') ?? '') || null,
    },
  });
  revalidatePath(`/fournisseurs/${supplierId}`);
}

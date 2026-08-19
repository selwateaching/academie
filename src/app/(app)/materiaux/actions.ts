'use server';

import { prisma } from '@/lib/prisma';
import { requireUser } from '@/lib/session';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

export async function createMaterial(formData: FormData) {
  const user = await requireUser();
  await prisma.material.create({
    data: {
      companyId: user.companyId,
      reference: String(formData.get('reference') ?? '') || null,
      name: String(formData.get('name') ?? ''),
      supplierId: String(formData.get('supplierId') ?? '') || null,
      purchasePrice: Number(formData.get('purchasePrice') ?? 0),
      unit: String(formData.get('unit') ?? 'u'),
      quantityAvailable: Number(formData.get('quantityAvailable') ?? 0),
      stockMin: Number(formData.get('stockMin') ?? 0),
      location: String(formData.get('location') ?? '') || null,
    },
  });
  revalidatePath('/materiaux');
  redirect('/materiaux');
}

export async function updateMaterial(materialId: string, formData: FormData) {
  const user = await requireUser();
  await prisma.material.update({
    where: { id: materialId, companyId: user.companyId },
    data: {
      reference: String(formData.get('reference') ?? '') || null,
      name: String(formData.get('name') ?? ''),
      supplierId: String(formData.get('supplierId') ?? '') || null,
      purchasePrice: Number(formData.get('purchasePrice') ?? 0),
      unit: String(formData.get('unit') ?? 'u'),
      stockMin: Number(formData.get('stockMin') ?? 0),
      location: String(formData.get('location') ?? '') || null,
    },
  });
  revalidatePath('/materiaux');
}

export async function deleteMaterial(materialId: string) {
  const user = await requireUser();
  await prisma.material.delete({ where: { id: materialId, companyId: user.companyId } });
  revalidatePath('/materiaux');
}

export async function addStockMovement(materialId: string, formData: FormData) {
  const user = await requireUser();
  const quantity = Number(formData.get('quantity') ?? 0);
  const type = String(formData.get('type') ?? 'ENTREE');
  if (quantity <= 0) return;
  const chantierId = String(formData.get('chantierId') ?? '') || null;

  await prisma.stockMovement.create({ data: { materialId, chantierId, quantity, type, note: String(formData.get('note') ?? '') || null } });

  const material = await prisma.material.findUnique({ where: { id: materialId } });
  if (material) {
    const newQty = type === 'ENTREE' ? material.quantityAvailable + quantity : material.quantityAvailable - quantity;
    await prisma.material.update({ where: { id: materialId }, data: { quantityAvailable: Math.max(0, newQty) } });
  }
  revalidatePath('/materiaux');
}

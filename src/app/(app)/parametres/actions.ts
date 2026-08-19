'use server';

import { prisma } from '@/lib/prisma';
import { requireUser } from '@/lib/session';
import { revalidatePath } from 'next/cache';
import bcrypt from 'bcryptjs';
import { logAudit } from '@/lib/notify';
import { saveUploadedFile } from '@/lib/storage';

async function requireAdmin() {
  const user = await requireUser();
  if (user.role !== 'ADMIN') throw new Error("Action réservée à l'administrateur.");
  return user;
}

export async function updateCompany(formData: FormData) {
  const user = await requireAdmin();

  const logo = formData.get('logo') as File | null;
  let logoPath: string | undefined;
  if (logo && logo.size > 0) {
    const saved = await saveUploadedFile(logo, 'logo');
    logoPath = `/api/files/${saved.filePath}`;
  }

  await prisma.company.update({
    where: { id: user.companyId },
    data: {
      name: String(formData.get('name') ?? ''),
      address: String(formData.get('address') ?? ''),
      zip: String(formData.get('zip') ?? ''),
      city: String(formData.get('city') ?? ''),
      phone: String(formData.get('phone') ?? ''),
      email: String(formData.get('email') ?? ''),
      siret: String(formData.get('siret') ?? ''),
      vatNumber: String(formData.get('vatNumber') ?? ''),
      iban: String(formData.get('iban') ?? ''),
      bic: String(formData.get('bic') ?? ''),
      defaultVatRate: Number(formData.get('defaultVatRate') ?? 20),
      paymentTerms: String(formData.get('paymentTerms') ?? ''),
      quoteValidityDays: Number(formData.get('quoteValidityDays') ?? 30),
      legalMentions: String(formData.get('legalMentions') ?? ''),
      ...(logoPath ? { logo: logoPath } : {}),
    },
  });
  await logAudit(user.companyId, user.id, 'update', 'Company', user.companyId);
  revalidatePath('/parametres');
}

export async function createUserAccount(formData: FormData) {
  const user = await requireAdmin();
  const email = String(formData.get('email') ?? '').toLowerCase().trim();
  const password = String(formData.get('password') ?? '');
  if (!email || password.length < 6) throw new Error('Email invalide ou mot de passe trop court (min. 6 caractères).');

  const passwordHash = await bcrypt.hash(password, 10);
  await prisma.user.create({
    data: {
      companyId: user.companyId,
      name: String(formData.get('name') ?? ''),
      email,
      passwordHash,
      role: String(formData.get('role') ?? 'SALARIE'),
      phone: String(formData.get('phone') ?? '') || null,
      position: String(formData.get('position') ?? '') || null,
      team: String(formData.get('team') ?? '') || null,
    },
  });
  await logAudit(user.companyId, user.id, 'create', 'User', undefined, email);
  revalidatePath('/parametres');
}

export async function toggleUserActive(userId: string) {
  const user = await requireAdmin();
  const target = await prisma.user.findFirst({ where: { id: userId, companyId: user.companyId } });
  if (!target) return;
  await prisma.user.update({ where: { id: userId }, data: { active: !target.active } });
  revalidatePath('/parametres');
}

export async function updateUserRole(userId: string, role: string) {
  const user = await requireAdmin();
  await prisma.user.update({ where: { id: userId, companyId: user.companyId }, data: { role } });
  revalidatePath('/parametres');
}

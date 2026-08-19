'use server';

import { prisma } from '@/lib/prisma';
import { requireUser } from '@/lib/session';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { logAudit, notifyCompanyAdmins } from '@/lib/notify';
import { saveUploadedFile } from '@/lib/storage';
import { sendMail, EMAIL_TEMPLATES } from '@/lib/mail';

export async function createChantier(formData: FormData) {
  const user = await requireUser();
  const chantier = await prisma.chantier.create({
    data: {
      companyId: user.companyId,
      name: String(formData.get('name') ?? ''),
      clientId: String(formData.get('clientId')),
      address: String(formData.get('address') ?? '') || null,
      lat: formData.get('lat') ? Number(formData.get('lat')) : null,
      lng: formData.get('lng') ? Number(formData.get('lng')) : null,
      startDate: formData.get('startDate') ? new Date(String(formData.get('startDate'))) : null,
      endDatePlanned: formData.get('endDatePlanned') ? new Date(String(formData.get('endDatePlanned'))) : null,
      managerId: String(formData.get('managerId') ?? '') || null,
      budgetPlanned: Number(formData.get('budgetPlanned') ?? 0),
      revenuePlanned: Number(formData.get('revenuePlanned') ?? 0),
      status: String(formData.get('status') ?? 'A_PREPARER'),
      description: String(formData.get('description') ?? '') || null,
    },
  });
  await logAudit(user.companyId, user.id, 'create', 'Chantier', chantier.id, chantier.name);
  revalidatePath('/chantiers');
  redirect(`/chantiers/${chantier.id}`);
}

export async function updateChantier(chantierId: string, formData: FormData) {
  const user = await requireUser();
  await prisma.chantier.update({
    where: { id: chantierId, companyId: user.companyId },
    data: {
      name: String(formData.get('name') ?? ''),
      clientId: String(formData.get('clientId')),
      address: String(formData.get('address') ?? '') || null,
      lat: formData.get('lat') ? Number(formData.get('lat')) : null,
      lng: formData.get('lng') ? Number(formData.get('lng')) : null,
      startDate: formData.get('startDate') ? new Date(String(formData.get('startDate'))) : null,
      endDatePlanned: formData.get('endDatePlanned') ? new Date(String(formData.get('endDatePlanned'))) : null,
      endDateActual: formData.get('endDateActual') ? new Date(String(formData.get('endDateActual'))) : null,
      managerId: String(formData.get('managerId') ?? '') || null,
      budgetPlanned: Number(formData.get('budgetPlanned') ?? 0),
      revenuePlanned: Number(formData.get('revenuePlanned') ?? 0),
      status: String(formData.get('status') ?? 'A_PREPARER'),
      progress: Number(formData.get('progress') ?? 0),
      description: String(formData.get('description') ?? '') || null,
    },
  });
  revalidatePath('/chantiers');
  revalidatePath(`/chantiers/${chantierId}`);
  redirect(`/chantiers/${chantierId}`);
}

export async function deleteChantier(chantierId: string) {
  const user = await requireUser();
  await prisma.chantier.delete({ where: { id: chantierId, companyId: user.companyId } });
  revalidatePath('/chantiers');
  redirect('/chantiers');
}

export async function updateChantierProgress(chantierId: string, progress: number) {
  const user = await requireUser();
  await prisma.chantier.update({ where: { id: chantierId, companyId: user.companyId }, data: { progress } });
  revalidatePath(`/chantiers/${chantierId}`);
}

export async function updateChantierStatus(chantierId: string, status: string) {
  const user = await requireUser();
  const data: any = { status };
  if (status === 'TERMINE') data.endDateActual = new Date();
  await prisma.chantier.update({ where: { id: chantierId, companyId: user.companyId }, data });

  if (status === 'TERMINE') {
    const chantier = await prisma.chantier.findUnique({ where: { id: chantierId }, include: { client: true, company: true } });
    if (chantier) {
      await prisma.task.create({ data: { companyId: user.companyId, title: `Créer la facture finale — ${chantier.name}`, chantierId, priority: 'URGENTE', createdById: user.id, dueDate: new Date(Date.now() + 3 * 86400000) } });
      await prisma.task.create({ data: { companyId: user.companyId, title: `Prendre les photos finales — ${chantier.name}`, chantierId, priority: 'NORMALE', createdById: user.id } });
      await notifyCompanyAdmins(user.companyId, { type: 'chantier_termine', title: 'Chantier terminé', body: `${chantier.name} est marqué terminé. Pensez à la facture finale et aux photos.`, link: `/chantiers/${chantierId}` });
      if (chantier.client.email) {
        const tpl = EMAIL_TEMPLATES.finChantier(chantier.company.name, `${chantier.client.firstName} ${chantier.client.lastName}`, chantier.name);
        await sendMail({ to: chantier.client.email, subject: tpl.subject, html: tpl.html });
      }
    }
  }
  revalidatePath(`/chantiers/${chantierId}`);
  revalidatePath('/chantiers');
}

export async function addExpense(chantierId: string, formData: FormData) {
  const user = await requireUser();
  const amount = Number(formData.get('amount') ?? 0);
  if (amount <= 0) return;
  await prisma.expense.create({
    data: {
      chantierId,
      category: String(formData.get('category') ?? 'Autre'),
      label: String(formData.get('label') ?? ''),
      amount,
      date: formData.get('date') ? new Date(String(formData.get('date'))) : new Date(),
      note: String(formData.get('note') ?? '') || null,
    },
  });
  const total = await prisma.expense.aggregate({ where: { chantierId }, _sum: { amount: true } });
  await prisma.chantier.update({ where: { id: chantierId }, data: { costActual: total._sum.amount ?? 0 } });
  revalidatePath(`/chantiers/${chantierId}`);
}

export async function deleteExpense(chantierId: string, expenseId: string) {
  await prisma.expense.delete({ where: { id: expenseId } });
  const total = await prisma.expense.aggregate({ where: { chantierId }, _sum: { amount: true } });
  await prisma.chantier.update({ where: { id: chantierId }, data: { costActual: total._sum.amount ?? 0 } });
  revalidatePath(`/chantiers/${chantierId}`);
}

export async function assignMember(chantierId: string, userId: string, roleOnSite?: string) {
  const user = await requireUser();
  await prisma.chantierMember.upsert({
    where: { chantierId_userId: { chantierId, userId } },
    update: { roleOnSite },
    create: { chantierId, userId, roleOnSite },
  });
  revalidatePath(`/chantiers/${chantierId}`);
}

export async function removeMember(chantierId: string, userId: string) {
  await prisma.chantierMember.deleteMany({ where: { chantierId, userId } });
  revalidatePath(`/chantiers/${chantierId}`);
}

export async function uploadChantierPhoto(chantierId: string, formData: FormData) {
  const user = await requireUser();
  const file = formData.get('photo') as File | null;
  if (!file || file.size === 0) return;
  const saved = await saveUploadedFile(file, `chantiers/${chantierId}/photos`);
  await prisma.photo.create({
    data: {
      chantierId,
      filePath: saved.filePath,
      caption: String(formData.get('caption') ?? '') || null,
      category: String(formData.get('category') ?? 'EN_COURS'),
      uploadedById: user.id,
    },
  });
  revalidatePath(`/chantiers/${chantierId}`);
}

export async function deletePhoto(chantierId: string, photoId: string) {
  await prisma.photo.delete({ where: { id: photoId } });
  revalidatePath(`/chantiers/${chantierId}`);
}

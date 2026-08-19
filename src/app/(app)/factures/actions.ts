'use server';

import { prisma } from '@/lib/prisma';
import { requireUser } from '@/lib/session';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { computeTotals, parseLinesFromFormData, nextNumber } from '@/lib/calc';
import { logAudit, notifyCompanyAdmins } from '@/lib/notify';
import { sendMail, EMAIL_TEMPLATES } from '@/lib/mail';

export async function createFacture(formData: FormData) {
  const user = await requireUser();
  const lines = parseLinesFromFormData(formData);
  const discountPct = Number(formData.get('discountPct') ?? 0);
  const totals = computeTotals(lines, discountPct);
  const number = await nextNumber(prisma, 'facture', 'FAC');

  const facture = await prisma.facture.create({
    data: {
      companyId: user.companyId,
      number,
      clientId: String(formData.get('clientId')),
      chantierId: String(formData.get('chantierId') ?? '') || null,
      type: String(formData.get('type') ?? 'STANDARD'),
      status: 'BROUILLON',
      dueDate: formData.get('dueDate') ? new Date(String(formData.get('dueDate'))) : null,
      discountPct,
      paymentTerms: String(formData.get('paymentTerms') ?? '') || null,
      notes: String(formData.get('notes') ?? '') || null,
      totalHT: totals.netHT,
      totalTTC: totals.totalTTC,
      createdById: user.id,
      lines: { create: lines },
    },
  });
  await logAudit(user.companyId, user.id, 'create', 'Facture', facture.id, number);
  revalidatePath('/factures');
  redirect(`/factures/${facture.id}`);
}

export async function updateFacture(factureId: string, formData: FormData) {
  const user = await requireUser();
  const lines = parseLinesFromFormData(formData);
  const discountPct = Number(formData.get('discountPct') ?? 0);
  const totals = computeTotals(lines, discountPct);

  await prisma.factureLine.deleteMany({ where: { factureId } });
  await prisma.facture.update({
    where: { id: factureId, companyId: user.companyId },
    data: {
      clientId: String(formData.get('clientId')),
      chantierId: String(formData.get('chantierId') ?? '') || null,
      type: String(formData.get('type') ?? 'STANDARD'),
      dueDate: formData.get('dueDate') ? new Date(String(formData.get('dueDate'))) : null,
      discountPct,
      paymentTerms: String(formData.get('paymentTerms') ?? '') || null,
      notes: String(formData.get('notes') ?? '') || null,
      totalHT: totals.netHT,
      totalTTC: totals.totalTTC,
      lines: { create: lines },
    },
  });
  revalidatePath('/factures');
  revalidatePath(`/factures/${factureId}`);
  redirect(`/factures/${factureId}`);
}

export async function deleteFacture(factureId: string) {
  const user = await requireUser();
  await prisma.facture.delete({ where: { id: factureId, companyId: user.companyId } });
  revalidatePath('/factures');
  redirect('/factures');
}

export async function sendFacture(factureId: string) {
  const user = await requireUser();
  const facture = await prisma.facture.findFirst({ where: { id: factureId, companyId: user.companyId }, include: { client: true, company: true } });
  if (!facture) return;
  if (facture.client.email) {
    const tpl = EMAIL_TEMPLATES.factureEnvoi(facture.company.name, `${facture.client.firstName} ${facture.client.lastName}`, facture.number);
    await sendMail({ to: facture.client.email, subject: tpl.subject, html: tpl.html });
  }
  await prisma.facture.update({ where: { id: factureId }, data: { status: 'ENVOYEE', sentAt: new Date() } });
  revalidatePath(`/factures/${factureId}`);
}

export async function sendReminder(factureId: string) {
  const user = await requireUser();
  const facture = await prisma.facture.findFirst({ where: { id: factureId, companyId: user.companyId }, include: { client: true, company: true } });
  if (!facture) return;
  if (facture.client.email) {
    const tpl = EMAIL_TEMPLATES.factureRelance(facture.company.name, `${facture.client.firstName} ${facture.client.lastName}`, facture.number, facture.dueDate ? new Intl.DateTimeFormat('fr-FR').format(facture.dueDate) : '—');
    await sendMail({ to: facture.client.email, subject: tpl.subject, html: tpl.html });
  }
  await prisma.facture.update({ where: { id: factureId }, data: { lastReminderAt: new Date() } });
  revalidatePath(`/factures/${factureId}`);
}

export async function recordPayment(factureId: string, formData: FormData) {
  const user = await requireUser();
  const amount = Number(formData.get('amount') ?? 0);
  if (amount <= 0) return;
  const facture = await prisma.facture.findFirst({ where: { id: factureId, companyId: user.companyId }, include: { payments: true } });
  if (!facture) return;

  await prisma.paiement.create({
    data: { factureId, amount, method: String(formData.get('method') ?? 'VIREMENT'), date: formData.get('date') ? new Date(String(formData.get('date'))) : new Date(), note: String(formData.get('note') ?? '') || null },
  });

  const totalPaid = facture.payments.reduce((s, p) => s + p.amount, 0) + amount;
  const status = totalPaid >= facture.totalTTC ? 'PAYEE' : 'PARTIELLEMENT_PAYEE';
  await prisma.facture.update({ where: { id: factureId }, data: { paidAmount: totalPaid, status } });

  if (status === 'PAYEE') {
    await notifyCompanyAdmins(user.companyId, { type: 'facture_payee', title: 'Facture payée', body: `${facture.number} a été intégralement réglée.`, link: `/factures/${factureId}` });
  }
  revalidatePath(`/factures/${factureId}`);
  revalidatePath('/factures');
}

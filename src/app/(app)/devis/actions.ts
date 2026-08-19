'use server';

import { prisma } from '@/lib/prisma';
import { requireUser } from '@/lib/session';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { computeTotals, parseLinesFromFormData, nextNumber } from '@/lib/calc';
import { notifyCompanyAdmins, logAudit } from '@/lib/notify';
import { sendMail, EMAIL_TEMPLATES } from '@/lib/mail';

export async function createDevis(formData: FormData) {
  const user = await requireUser();
  const lines = parseLinesFromFormData(formData);
  const discountPct = Number(formData.get('discountPct') ?? 0);
  const totals = computeTotals(lines, discountPct);
  const number = await nextNumber(prisma, 'devis', 'DEV');

  const devis = await prisma.devis.create({
    data: {
      companyId: user.companyId,
      number,
      clientId: String(formData.get('clientId')),
      chantierId: String(formData.get('chantierId') ?? '') || null,
      status: 'BROUILLON',
      validUntil: formData.get('validUntil') ? new Date(String(formData.get('validUntil'))) : null,
      discountPct,
      depositPct: Number(formData.get('depositPct') ?? 0),
      paymentTerms: String(formData.get('paymentTerms') ?? '') || null,
      notes: String(formData.get('notes') ?? '') || null,
      totalHT: totals.netHT,
      totalTTC: totals.totalTTC,
      createdById: user.id,
      lines: { create: lines },
    },
  });
  await logAudit(user.companyId, user.id, 'create', 'Devis', devis.id, number);
  revalidatePath('/devis');
  redirect(`/devis/${devis.id}`);
}

export async function updateDevis(devisId: string, formData: FormData) {
  const user = await requireUser();
  const lines = parseLinesFromFormData(formData);
  const discountPct = Number(formData.get('discountPct') ?? 0);
  const totals = computeTotals(lines, discountPct);

  await prisma.devisLine.deleteMany({ where: { devisId } });
  await prisma.devis.update({
    where: { id: devisId, companyId: user.companyId },
    data: {
      clientId: String(formData.get('clientId')),
      chantierId: String(formData.get('chantierId') ?? '') || null,
      validUntil: formData.get('validUntil') ? new Date(String(formData.get('validUntil'))) : null,
      discountPct,
      depositPct: Number(formData.get('depositPct') ?? 0),
      paymentTerms: String(formData.get('paymentTerms') ?? '') || null,
      notes: String(formData.get('notes') ?? '') || null,
      totalHT: totals.netHT,
      totalTTC: totals.totalTTC,
      lines: { create: lines },
    },
  });
  revalidatePath('/devis');
  revalidatePath(`/devis/${devisId}`);
  redirect(`/devis/${devisId}`);
}

export async function deleteDevis(devisId: string) {
  const user = await requireUser();
  await prisma.devis.delete({ where: { id: devisId, companyId: user.companyId } });
  revalidatePath('/devis');
  redirect('/devis');
}

export async function duplicateDevis(devisId: string) {
  const user = await requireUser();
  const original = await prisma.devis.findFirst({ where: { id: devisId, companyId: user.companyId }, include: { lines: true } });
  if (!original) return;
  const number = await nextNumber(prisma, 'devis', 'DEV');
  const copy = await prisma.devis.create({
    data: {
      companyId: user.companyId, number, clientId: original.clientId, chantierId: original.chantierId,
      status: 'BROUILLON', discountPct: original.discountPct, depositPct: original.depositPct,
      paymentTerms: original.paymentTerms, notes: original.notes, totalHT: original.totalHT, totalTTC: original.totalTTC,
      createdById: user.id,
      lines: { create: original.lines.map((l) => ({ type: l.type, description: l.description, quantity: l.quantity, unit: l.unit, unitPrice: l.unitPrice, vatRate: l.vatRate, order: l.order })) },
    },
  });
  revalidatePath('/devis');
  redirect(`/devis/${copy.id}`);
}

export async function sendDevis(devisId: string) {
  const user = await requireUser();
  const devis = await prisma.devis.findFirst({ where: { id: devisId, companyId: user.companyId }, include: { client: true, company: true } });
  if (!devis) return;
  if (devis.client.email) {
    const tpl = EMAIL_TEMPLATES.devisEnvoi(devis.company.name, `${devis.client.firstName} ${devis.client.lastName}`, devis.number);
    await sendMail({ to: devis.client.email, subject: tpl.subject, html: tpl.html });
  }
  await prisma.devis.update({ where: { id: devisId }, data: { status: 'ENVOYE', sentAt: new Date() } });
  revalidatePath(`/devis/${devisId}`);
}

export async function markDevisViewed(devisId: string) {
  await prisma.devis.updateMany({ where: { id: devisId, status: 'ENVOYE' }, data: { status: 'CONSULTE', viewedAt: new Date() } });
  revalidatePath(`/devis/${devisId}`);
}

export async function respondDevis(devisId: string, accepted: boolean) {
  const user = await requireUser();
  const devis = await prisma.devis.findFirst({ where: { id: devisId, companyId: user.companyId }, include: { client: true, lines: true } });
  if (!devis) return;

  await prisma.devis.update({ where: { id: devisId }, data: { status: accepted ? 'ACCEPTE' : 'REFUSE', respondedAt: new Date() } });

  if (accepted) {
    let chantierId = devis.chantierId;
    if (!chantierId) {
      const chantier = await prisma.chantier.create({
        data: {
          companyId: user.companyId,
          name: `Chantier — ${devis.client.firstName} ${devis.client.lastName}`,
          clientId: devis.clientId,
          address: devis.client.siteAddress ?? devis.client.address,
          startDate: new Date(Date.now() + 7 * 86400000),
          budgetPlanned: devis.totalHT,
          revenuePlanned: devis.totalTTC,
          status: 'A_PREPARER',
        },
      });
      chantierId = chantier.id;
      await prisma.devis.update({ where: { id: devisId }, data: { chantierId } });
      await prisma.task.create({
        data: { companyId: user.companyId, title: `Préparer le démarrage du chantier`, chantierId, priority: 'NORMALE', createdById: user.id, dueDate: new Date(Date.now() + 5 * 86400000) },
      });
    }

    if (devis.depositPct > 0) {
      const number = await nextNumber(prisma, 'facture', 'FAC');
      const depositAmount = (devis.totalTTC * devis.depositPct) / 100;
      await prisma.facture.create({
        data: {
          companyId: user.companyId, number, clientId: devis.clientId, chantierId, devisId: devis.id,
          type: 'ACOMPTE', status: 'BROUILLON', dueDate: new Date(Date.now() + 15 * 86400000),
          totalHT: depositAmount / 1.2, totalTTC: depositAmount,
          paymentTerms: devis.paymentTerms, createdById: user.id,
          lines: { create: [{ type: 'PRESTATION', description: `Acompte ${devis.depositPct}% - Devis ${devis.number}`, quantity: 1, unit: 'forfait', unitPrice: depositAmount / 1.2, vatRate: 20, order: 0 }] },
        },
      });
    }

    await notifyCompanyAdmins(user.companyId, { type: 'devis_accepte', title: 'Devis accepté', body: `${devis.number} accepté par ${devis.client.firstName} ${devis.client.lastName}. Chantier créé automatiquement.`, link: `/devis/${devisId}` });
  }

  revalidatePath(`/devis/${devisId}`);
  revalidatePath('/chantiers');
  revalidatePath('/factures');
}

export async function convertDevisToFacture(devisId: string, type: string) {
  const user = await requireUser();
  const devis = await prisma.devis.findFirst({ where: { id: devisId, companyId: user.companyId }, include: { lines: true } });
  if (!devis) return;
  const number = await nextNumber(prisma, 'facture', 'FAC');
  const facture = await prisma.facture.create({
    data: {
      companyId: user.companyId, number, clientId: devis.clientId, chantierId: devis.chantierId, devisId: devis.id,
      type, status: 'BROUILLON', dueDate: new Date(Date.now() + 30 * 86400000),
      discountPct: devis.discountPct, totalHT: devis.totalHT, totalTTC: devis.totalTTC,
      paymentTerms: devis.paymentTerms, createdById: user.id,
      lines: { create: devis.lines.map((l) => ({ type: l.type, description: l.description, quantity: l.quantity, unit: l.unit, unitPrice: l.unitPrice, vatRate: l.vatRate, order: l.order })) },
    },
  });
  revalidatePath('/factures');
  redirect(`/factures/${facture.id}`);
}

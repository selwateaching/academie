'use server';

import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { createClientSession, requireClientSession, clearClientSession } from '@/lib/clientAuth';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { saveUploadedFile } from '@/lib/storage';
import { notifyCompanyAdmins } from '@/lib/notify';

export async function portalLogin(formData: FormData) {
  const email = String(formData.get('email') ?? '').toLowerCase().trim();
  const password = String(formData.get('password') ?? '');
  const client = await prisma.client.findFirst({ where: { email, portalEnabled: true } });
  if (!client || !client.passwordHash) return { error: 'Identifiants incorrects ou accès non activé.' };
  const valid = await bcrypt.compare(password, client.passwordHash);
  if (!valid) return { error: 'Identifiants incorrects.' };
  await createClientSession(client.id, client.companyId);
  redirect('/portail');
}

export async function portalLogout() {
  clearClientSession();
  redirect('/portail/login');
}

export async function acceptDevisAsClient(devisId: string, signatureImage: string, signerName: string) {
  const session = await requireClientSession();
  const devis = await prisma.devis.findFirst({ where: { id: devisId, clientId: session.clientId }, include: { client: true } });
  if (!devis) return;

  await prisma.signature.create({
    data: { docType: 'DEVIS', devisId, signerName, signerEmail: devis.client.email, signatureImage },
  });
  await prisma.devis.update({ where: { id: devisId }, data: { status: 'ACCEPTE', respondedAt: new Date() } });

  let chantierId = devis.chantierId;
  if (!chantierId) {
    const chantier = await prisma.chantier.create({
      data: {
        companyId: devis.companyId, name: `Chantier — ${devis.client.firstName} ${devis.client.lastName}`,
        clientId: devis.clientId, address: devis.client.siteAddress ?? devis.client.address,
        startDate: new Date(Date.now() + 7 * 86400000), budgetPlanned: devis.totalHT, revenuePlanned: devis.totalTTC, status: 'A_PREPARER',
      },
    });
    chantierId = chantier.id;
    await prisma.devis.update({ where: { id: devisId }, data: { chantierId } });
  }

  await notifyCompanyAdmins(devis.companyId, { type: 'devis_accepte', title: 'Devis signé et accepté', body: `${devis.number} a été signé électroniquement par ${devis.client.firstName} ${devis.client.lastName}.`, link: `/devis/${devisId}` });
  revalidatePath(`/portail/devis/${devisId}`);
}

export async function refuseDevisAsClient(devisId: string) {
  const session = await requireClientSession();
  const devis = await prisma.devis.findFirst({ where: { id: devisId, clientId: session.clientId }, include: { client: true } });
  if (!devis) return;
  await prisma.devis.update({ where: { id: devisId }, data: { status: 'REFUSE', respondedAt: new Date() } });
  await notifyCompanyAdmins(devis.companyId, { type: 'devis_refuse', title: 'Devis refusé', body: `${devis.number} a été refusé par ${devis.client.firstName} ${devis.client.lastName}.`, link: `/devis/${devisId}` });
  revalidatePath(`/portail/devis/${devisId}`);
}

export async function uploadClientDocument(formData: FormData) {
  const session = await requireClientSession();
  const file = formData.get('file') as File | null;
  if (!file || file.size === 0) return;
  const saved = await saveUploadedFile(file, `documents/clients/${session.clientId}`);
  await prisma.document.create({
    data: { companyId: session.companyId, folder: 'CLIENTS', name: saved.name, filePath: saved.filePath, mimeType: saved.mimeType, size: saved.size, clientId: session.clientId },
  });
  const client = await prisma.client.findUnique({ where: { id: session.clientId } });
  await notifyCompanyAdmins(session.companyId, { type: 'document_recu', title: 'Document reçu du client', body: `${client?.firstName} ${client?.lastName} a déposé un document.`, link: '/documents' });
  revalidatePath('/portail/documents');
}

export async function sendClientMessage(conversationId: string, formData: FormData) {
  const session = await requireClientSession();
  const body = String(formData.get('body') ?? '').trim();
  if (!body) return;
  const conv = await prisma.conversation.findFirst({ where: { id: conversationId, clientId: session.clientId } });
  if (!conv) return;
  await prisma.message.create({ data: { conversationId, senderClientId: session.clientId, body } });

  const participants = await prisma.conversationParticipant.findMany({ where: { conversationId } });
  const client = await prisma.client.findUnique({ where: { id: session.clientId } });
  await Promise.all(participants.map((p) =>
    prisma.notification.create({ data: { companyId: session.companyId, userId: p.userId, type: 'nouveau_message', title: `Message de ${client?.firstName} ${client?.lastName}`, body: body.slice(0, 100), link: `/messagerie?c=${conversationId}` } })
  ));
  revalidatePath('/portail/messages');
}

export async function getOrCreatePortalConversation() {
  const session = await requireClientSession();
  let conv = await prisma.conversation.findFirst({ where: { companyId: session.companyId, clientId: session.clientId, type: 'CLIENT' } });
  if (!conv) {
    const admin = await prisma.user.findFirst({ where: { companyId: session.companyId, role: 'ADMIN' } });
    conv = await prisma.conversation.create({
      data: { companyId: session.companyId, type: 'CLIENT', clientId: session.clientId, participants: admin ? { create: [{ userId: admin.id }] } : undefined },
    });
  }
  return conv.id;
}

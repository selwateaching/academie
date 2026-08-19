'use server';

import { prisma } from '@/lib/prisma';
import { requireUser } from '@/lib/session';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { saveUploadedFile } from '@/lib/storage';
import { notifyUser } from '@/lib/notify';

export async function createConversation(formData: FormData) {
  const user = await requireUser();
  const type = String(formData.get('type') ?? 'INTERNAL');
  const participantIds = formData.getAll('participants').map(String);
  const clientId = String(formData.get('clientId') ?? '') || null;
  const chantierId = String(formData.get('chantierId') ?? '') || null;
  const name = String(formData.get('name') ?? '') || null;

  const conv = await prisma.conversation.create({
    data: {
      companyId: user.companyId,
      type,
      name,
      clientId: type === 'CLIENT' ? clientId : null,
      chantierId: chantierId || null,
      participants: { create: [user.id, ...participantIds.filter((id) => id !== user.id)].map((userId) => ({ userId })) },
    },
  });
  revalidatePath('/messagerie');
  redirect(`/messagerie?c=${conv.id}`);
}

export async function getOrCreateClientConversation(clientId: string) {
  const user = await requireUser();
  let conv = await prisma.conversation.findFirst({ where: { companyId: user.companyId, clientId, type: 'CLIENT' } });
  if (!conv) {
    conv = await prisma.conversation.create({
      data: { companyId: user.companyId, type: 'CLIENT', clientId, participants: { create: [{ userId: user.id }] } },
    });
  }
  redirect(`/messagerie?c=${conv.id}`);
}

export async function sendMessage(conversationId: string, formData: FormData) {
  const user = await requireUser();
  const body = String(formData.get('body') ?? '').trim();
  const file = formData.get('attachment') as File | null;
  if (!body && (!file || file.size === 0)) return;

  let attachmentPath: string | undefined;
  let attachmentName: string | undefined;
  if (file && file.size > 0) {
    const saved = await saveUploadedFile(file, `messages/${conversationId}`);
    attachmentPath = saved.filePath;
    attachmentName = saved.name;
  }

  await prisma.message.create({
    data: { conversationId, senderUserId: user.id, body: body || `📎 ${attachmentName}`, attachmentPath, attachmentName },
  });

  const participants = await prisma.conversationParticipant.findMany({ where: { conversationId, userId: { not: user.id } } });
  await Promise.all(participants.map((p) => notifyUser(p.userId, user.companyId, { type: 'nouveau_message', title: `Nouveau message de ${user.name}`, body: body.slice(0, 100), link: `/messagerie?c=${conversationId}` })));

  revalidatePath('/messagerie');
}

export async function shareDocumentToConversation(conversationId: string, documentId: string) {
  const user = await requireUser();
  const doc = await prisma.document.findFirst({ where: { id: documentId, companyId: user.companyId } });
  if (!doc) return;
  await prisma.message.create({
    data: { conversationId, senderUserId: user.id, body: `📎 ${doc.name}`, attachmentPath: doc.filePath, attachmentName: doc.name },
  });
  revalidatePath('/messagerie');
}

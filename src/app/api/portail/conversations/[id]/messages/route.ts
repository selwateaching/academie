import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireClientSession } from '@/lib/clientAuth';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await requireClientSession();
  const conversation = await prisma.conversation.findFirst({ where: { id: params.id, clientId: session.clientId } });
  if (!conversation) return NextResponse.json({ error: 'Introuvable' }, { status: 404 });

  const messages = await prisma.message.findMany({ where: { conversationId: params.id }, include: { senderUser: true, senderClient: true }, orderBy: { createdAt: 'asc' } });

  return NextResponse.json({
    messages: messages.map((m) => ({
      id: m.id, body: m.body, attachmentPath: m.attachmentPath, attachmentName: m.attachmentName,
      createdAt: m.createdAt.toISOString(),
      senderName: m.senderUser?.name ?? (m.senderClient ? `${m.senderClient.firstName} ${m.senderClient.lastName}` : 'Inconnu'),
      isMe: m.senderClientId === session.clientId,
      isClient: !!m.senderClientId,
    })),
  });
}

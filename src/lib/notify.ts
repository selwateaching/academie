import { prisma } from '@/lib/prisma';

export async function notifyUser(userId: string, companyId: string, opts: { type: string; title: string; body?: string; link?: string }) {
  return prisma.notification.create({
    data: { userId, companyId, type: opts.type, title: opts.title, body: opts.body, link: opts.link },
  });
}

export async function notifyCompanyAdmins(companyId: string, opts: { type: string; title: string; body?: string; link?: string }) {
  const admins = await prisma.user.findMany({ where: { companyId, role: 'ADMIN', active: true } });
  await Promise.all(admins.map((a) => notifyUser(a.id, companyId, opts)));
}

export async function logAudit(companyId: string, userId: string | undefined, action: string, entityType: string, entityId?: string, details?: string) {
  await prisma.auditLog.create({ data: { companyId, userId, action, entityType, entityId, details } });
}

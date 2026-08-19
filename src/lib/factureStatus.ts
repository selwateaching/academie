import { prisma } from '@/lib/prisma';

export async function syncFactureStatuses(companyId: string) {
  const now = new Date();
  const factures = await prisma.facture.findMany({
    where: { companyId, status: { in: ['ENVOYEE', 'PARTIELLEMENT_PAYEE', 'EN_RETARD', 'IMPAYEE'] } },
    include: { payments: true },
  });
  for (const f of factures) {
    const paid = f.payments.reduce((s, p) => s + p.amount, 0);
    let status = f.status;
    if (paid >= f.totalTTC && f.totalTTC > 0) {
      status = 'PAYEE';
    } else if (paid > 0) {
      status = 'PARTIELLEMENT_PAYEE';
    } else if (f.dueDate && f.dueDate < now) {
      status = f.status === 'ENVOYEE' ? 'EN_RETARD' : status === 'BROUILLON' ? status : 'EN_RETARD';
    }
    if (status !== f.status || paid !== f.paidAmount) {
      await prisma.facture.update({ where: { id: f.id }, data: { status, paidAmount: paid } });
    }
  }
}

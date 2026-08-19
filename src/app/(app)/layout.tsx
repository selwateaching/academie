import { requireUser } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import { AppShell } from '@/components/shell/AppShell';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  const company = await prisma.company.findUnique({ where: { id: user.companyId } });

  return (
    <AppShell role={user.role} companyName={company?.name ?? 'Mon entreprise'} userName={user.name} avatarColor={user.avatarColor}>
      {children}
    </AppShell>
  );
}

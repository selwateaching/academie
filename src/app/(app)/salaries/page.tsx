import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { requireUser } from '@/lib/session';
import { PageHeader, EmptyState } from '@/components/ui/PageHeader';
import { ROLES } from '@/lib/enums';
import { Icon } from '@/components/shell/Icon';

export const dynamic = 'force-dynamic';

export default async function SalariesPage() {
  const user = await requireUser();
  const users = await prisma.user.findMany({
    where: { companyId: user.companyId },
    include: { chantierMemberships: { include: { chantier: true }, where: { chantier: { status: 'EN_COURS' } } } },
    orderBy: { name: 'asc' },
  });

  return (
    <div>
      <PageHeader title="Salariés" description={`${users.length} membre${users.length > 1 ? 's' : ''} de l'équipe`} actions={<Link href="/parametres" className="btn-secondary"><Icon name="UserPlus" size={16} /> Ajouter (Paramètres)</Link>} />

      {users.length === 0 ? (
        <EmptyState title="Aucun salarié" />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {users.map((u) => (
            <Link key={u.id} href={`/salaries/${u.id}`} className="card p-4 hover:shadow-pop flex items-start gap-3">
              <span className="h-11 w-11 rounded-full flex items-center justify-center text-white font-bold shrink-0" style={{ backgroundColor: u.avatarColor ?? '#2563eb' }}>
                {u.name[0]?.toUpperCase()}
              </span>
              <div className="min-w-0">
                <p className="font-semibold text-ink-800 truncate">{u.name}</p>
                <p className="text-xs text-ink-400">{u.position || (ROLES as any)[u.role]?.label}</p>
                <p className="text-xs text-ink-400 mt-1">{u.chantierMemberships[0]?.chantier.name ?? 'Non affecté'}</p>
                {!u.active && <span className="badge bg-rose-100 text-rose-600 border-rose-200 mt-1.5">Inactif</span>}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

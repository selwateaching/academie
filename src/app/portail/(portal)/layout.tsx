import { getClientSession } from '@/lib/clientAuth';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import { Icon } from '@/components/shell/Icon';
import { portalLogout } from '../actions';

const NAV = [
  { href: '/portail/chantiers', label: 'Mes chantiers', icon: 'Building2' },
  { href: '/portail/devis', label: 'Mes devis', icon: 'FileText' },
  { href: '/portail/factures', label: 'Mes factures', icon: 'Receipt' },
  { href: '/portail/documents', label: 'Documents', icon: 'FolderOpen' },
  { href: '/portail/rdv', label: 'Rendez-vous', icon: 'Calendar' },
  { href: '/portail/messages', label: 'Messages', icon: 'MessageSquare' },
];

export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const session = await getClientSession();
  if (!session) redirect('/portail/login');
  const [client, company] = await Promise.all([
    prisma.client.findUnique({ where: { id: session.clientId } }),
    prisma.company.findUnique({ where: { id: session.companyId } }),
  ]);
  if (!client) redirect('/portail/login');

  return (
    <div className="min-h-screen bg-ink-50">
      <header className="bg-white border-b border-ink-200 px-4 sm:px-6 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="h-9 w-9 rounded-lg bg-emerald-600 flex items-center justify-center">
            <Icon name="User" size={18} className="text-white" />
          </div>
          <div>
            <p className="font-bold text-ink-900 text-sm leading-tight">{company?.name}</p>
            <p className="text-[11px] text-ink-400">Espace client · {client.firstName} {client.lastName}</p>
          </div>
        </div>
        <form action={portalLogout}>
          <button className="btn-ghost btn-sm"><Icon name="LogOut" size={15} /> Déconnexion</button>
        </form>
      </header>
      <nav className="bg-white border-b border-ink-200 px-2 flex overflow-x-auto">
        {NAV.map((item) => (
          <a key={item.href} href={item.href} className="flex items-center gap-1.5 px-4 py-3 text-sm font-medium text-ink-600 hover:text-emerald-700 whitespace-nowrap border-b-2 border-transparent hover:border-emerald-500">
            <Icon name={item.icon} size={15} /> {item.label}
          </a>
        ))}
      </nav>
      <main className="p-4 sm:p-6 max-w-5xl mx-auto">{children}</main>
    </div>
  );
}

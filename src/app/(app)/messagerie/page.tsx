import Link from 'next/link';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { requireUser } from '@/lib/session';
import { PageHeader } from '@/components/ui/PageHeader';
import { Icon } from '@/components/shell/Icon';
import { ChatPanel } from './ChatPanel';
import { getOrCreateClientConversation } from './actions';
import { NewConversationForm } from './NewConversationForm';

export const dynamic = 'force-dynamic';

export default async function MessageriePage({ searchParams }: { searchParams: { c?: string; clientId?: string } }) {
  const user = await requireUser();

  if (searchParams.clientId && !searchParams.c) {
    await getOrCreateClientConversation(searchParams.clientId);
  }

  const conversations = await prisma.conversation.findMany({
    where: { companyId: user.companyId },
    include: { client: true, chantier: true, participants: { include: { user: true } }, messages: { orderBy: { createdAt: 'desc' }, take: 1 } },
    orderBy: { createdAt: 'desc' },
  });

  const activeId = searchParams.c ?? conversations[0]?.id;
  const active = conversations.find((c) => c.id === activeId);

  const [users, clients, chantiers] = await Promise.all([
    prisma.user.findMany({ where: { companyId: user.companyId, active: true }, orderBy: { name: 'asc' } }),
    prisma.client.findMany({ where: { companyId: user.companyId }, orderBy: { firstName: 'asc' } }),
    prisma.chantier.findMany({ where: { companyId: user.companyId }, orderBy: { name: 'asc' } }),
  ]);

  function convTitle(c: (typeof conversations)[number]) {
    if (c.type === 'CLIENT') return c.client ? `${c.client.firstName} ${c.client.lastName}` : 'Client';
    return c.name || c.chantier?.name || c.participants.map((p) => p.user.name.split(' ')[0]).join(', ');
  }

  return (
    <div>
      <PageHeader title="Messagerie" description="Conversations internes, chantiers et clients." />
      <div className="grid lg:grid-cols-3 gap-5">
        <div className="space-y-3">
          <NewConversationForm users={users} clients={clients} chantiers={chantiers} />
          <div className="card p-2 max-h-[calc(100vh-320px)] overflow-y-auto">
            {conversations.map((c) => (
              <Link
                key={c.id}
                href={`/messagerie?c=${c.id}`}
                className={`flex items-center gap-2.5 rounded-xl px-3 py-2.5 ${activeId === c.id ? 'bg-brand-50' : 'hover:bg-ink-50'}`}
              >
                <span className={`h-8 w-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0 ${c.type === 'CLIENT' ? 'bg-emerald-600' : 'bg-brand-600'}`}>
                  {c.type === 'CLIENT' ? <Icon name="User" size={14} /> : <Icon name="Users" size={14} />}
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-ink-800 truncate">{convTitle(c)}</p>
                  <p className="text-xs text-ink-400 truncate">{c.messages[0]?.body ?? 'Pas encore de message'}</p>
                </div>
              </Link>
            ))}
            {conversations.length === 0 && <p className="text-sm text-ink-400 text-center py-6">Aucune conversation</p>}
          </div>
        </div>
        <div className="lg:col-span-2">
          {active ? (
            <ChatPanel conversationId={active.id} title={convTitle(active)} subtitle={active.chantier?.name} />
          ) : (
            <div className="card p-10 text-center text-ink-400">Sélectionnez ou créez une conversation</div>
          )}
        </div>
      </div>
    </div>
  );
}

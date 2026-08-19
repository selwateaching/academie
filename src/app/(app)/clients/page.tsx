import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { requireUser } from '@/lib/session';
import { PageHeader, EmptyState } from '@/components/ui/PageHeader';
import { Icon } from '@/components/shell/Icon';
import { CLIENT_TYPES } from '@/lib/enums';

export const dynamic = 'force-dynamic';

export default async function ClientsPage({ searchParams }: { searchParams: { q?: string; type?: string } }) {
  const user = await requireUser();
  const q = searchParams.q?.trim() ?? '';
  const type = searchParams.type ?? '';

  const clients = await prisma.client.findMany({
    where: {
      companyId: user.companyId,
      ...(type ? { type } : {}),
      ...(q
        ? { OR: [{ firstName: { contains: q } }, { lastName: { contains: q } }, { companyName: { contains: q } }, { email: { contains: q } }, { phone: { contains: q } }] }
        : {}),
    },
    include: { _count: { select: { chantiers: true, devis: true, factures: true } } },
    orderBy: { createdAt: 'desc' },
  });

  return (
    <div>
      <PageHeader
        title="Clients"
        description={`${clients.length} client${clients.length > 1 ? 's' : ''}`}
        actions={<Link href="/clients/nouveau" className="btn-primary"><Icon name="Plus" size={16} /> Nouveau client</Link>}
      />

      <form className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1">
          <Icon name="Search" size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" />
          <input name="q" defaultValue={q} placeholder="Rechercher un client…" className="input !pl-9" />
        </div>
        <select name="type" defaultValue={type} className="select w-full sm:w-56">
          <option value="">Tous les types</option>
          {Object.entries(CLIENT_TYPES).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
        <button className="btn-secondary">Filtrer</button>
      </form>

      {clients.length === 0 ? (
        <EmptyState title="Aucun client trouvé" description="Ajoutez votre premier client pour commencer." action={<Link href="/clients/nouveau" className="btn-primary">Nouveau client</Link>} />
      ) : (
        <div className="table-wrap">
          <table className="data">
            <thead>
              <tr>
                <th>Nom</th>
                <th>Type</th>
                <th>Contact</th>
                <th>Chantiers</th>
                <th>Devis</th>
                <th>Factures</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {clients.map((c) => (
                <tr key={c.id}>
                  <td>
                    <Link href={`/clients/${c.id}`} className="font-semibold text-ink-800 hover:text-brand-600">
                      {c.firstName} {c.lastName}
                    </Link>
                    {c.companyName && <p className="text-xs text-ink-400">{c.companyName}</p>}
                  </td>
                  <td className="text-ink-500">{CLIENT_TYPES[c.type as keyof typeof CLIENT_TYPES] ?? c.type}</td>
                  <td className="text-ink-500">
                    <p>{c.phone ?? '—'}</p>
                    <p className="text-xs">{c.email ?? ''}</p>
                  </td>
                  <td>{c._count.chantiers}</td>
                  <td>{c._count.devis}</td>
                  <td>{c._count.factures}</td>
                  <td>
                    <Link href={`/clients/${c.id}`} className="btn-secondary btn-sm">Ouvrir</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

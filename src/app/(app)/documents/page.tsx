import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { requireUser } from '@/lib/session';
import { PageHeader, EmptyState } from '@/components/ui/PageHeader';
import { Icon } from '@/components/shell/Icon';
import { DOC_FOLDERS } from '@/lib/enums';
import { DropzoneUpload } from './DropzoneUpload';
import { DocumentRow } from './DocumentRow';

export const dynamic = 'force-dynamic';

export default async function DocumentsPage({ searchParams }: { searchParams: { folder?: string; q?: string; clientId?: string; chantierId?: string; employeeId?: string } }) {
  const user = await requireUser();
  const folder = searchParams.folder ?? '';
  const q = searchParams.q?.trim() ?? '';

  const documents = await prisma.document.findMany({
    where: {
      companyId: user.companyId,
      ...(folder ? { folder } : {}),
      ...(searchParams.clientId ? { clientId: searchParams.clientId } : {}),
      ...(searchParams.chantierId ? { chantierId: searchParams.chantierId } : {}),
      ...(searchParams.employeeId ? { employeeId: searchParams.employeeId } : {}),
      ...(q ? { name: { contains: q } } : {}),
    },
    include: { uploadedBy: true },
    orderBy: { createdAt: 'desc' },
  });

  const counts = await prisma.document.groupBy({ by: ['folder'], where: { companyId: user.companyId }, _count: true });
  const countMap = new Map(counts.map((c) => [c.folder, c._count]));

  return (
    <div>
      <PageHeader title="Documents" description={`${documents.length} document${documents.length > 1 ? 's' : ''} — GED de l'entreprise`} />

      <div className="grid lg:grid-cols-4 gap-6">
        <div className="space-y-1">
          <Link href="/documents" className={`flex items-center justify-between rounded-xl px-3 py-2.5 text-sm font-medium ${!folder ? 'bg-brand-600 text-white' : 'text-ink-600 hover:bg-ink-100'}`}>
            <span className="flex items-center gap-2"><Icon name="Folders" size={16} /> Tous les documents</span>
          </Link>
          {Object.entries(DOC_FOLDERS).map(([k, v]) => (
            <Link key={k} href={`/documents?folder=${k}`} className={`flex items-center justify-between rounded-xl px-3 py-2.5 text-sm font-medium ${folder === k ? 'bg-brand-600 text-white' : 'text-ink-600 hover:bg-ink-100'}`}>
              <span className="flex items-center gap-2"><Icon name="Folder" size={16} /> {v}</span>
              <span className={folder === k ? 'text-white/80' : 'text-ink-400'}>{countMap.get(k) ?? 0}</span>
            </Link>
          ))}
        </div>

        <div className="lg:col-span-3 space-y-5">
          <DropzoneUpload defaultFolder={folder || undefined} clientId={searchParams.clientId} chantierId={searchParams.chantierId} employeeId={searchParams.employeeId} />

          <form className="flex gap-3">
            <div className="relative flex-1">
              <Icon name="Search" size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" />
              <input name="q" defaultValue={q} placeholder="Rechercher un document…" className="input !pl-9" />
            </div>
            {folder && <input type="hidden" name="folder" value={folder} />}
            <button className="btn-secondary">Rechercher</button>
          </form>

          {documents.length === 0 ? (
            <EmptyState title="Aucun document" description="Importez vos premiers fichiers ci-dessus." />
          ) : (
            <div className="table-wrap">
              <table className="data">
                <thead><tr><th>Nom</th><th>Dossier</th><th>Taille</th><th>Ajouté le</th><th></th></tr></thead>
                <tbody>
                  {documents.map((d) => (
                    <DocumentRow
                      key={d.id}
                      doc={{ id: d.id, name: d.name, filePath: d.filePath, folder: d.folder, size: d.size, createdAt: d.createdAt.toISOString(), uploaderName: d.uploadedBy?.name }}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

import { requireClientSession } from '@/lib/clientAuth';
import { prisma } from '@/lib/prisma';
import { fmtDate } from '@/lib/enums';
import { Icon } from '@/components/shell/Icon';
import { uploadClientDocument } from '../../actions';

export const dynamic = 'force-dynamic';

export default async function PortalDocumentsPage() {
  const session = await requireClientSession();
  const documents = await prisma.document.findMany({ where: { clientId: session.clientId }, orderBy: { createdAt: 'desc' } });

  return (
    <div>
      <h1 className="text-xl font-bold text-ink-900 mb-5">Mes documents</h1>

      <form action={uploadClientDocument} className="card p-5 mb-5 flex flex-wrap items-center gap-3" encType="multipart/form-data">
        <Icon name="UploadCloud" size={22} className="text-ink-400" />
        <input type="file" name="file" required className="input flex-1 min-w-[200px]" />
        <button className="btn-primary !bg-emerald-600 hover:!bg-emerald-700">Déposer</button>
      </form>

      <div className="space-y-2">
        {documents.map((d) => (
          <a key={d.id} href={`/api/files/${d.filePath}`} target="_blank" className="card p-4 flex items-center gap-3 hover:shadow-pop">
            <Icon name="FileText" size={18} className="text-ink-400" />
            <div>
              <p className="font-medium text-ink-800">{d.name}</p>
              <p className="text-xs text-ink-400">{fmtDate(d.createdAt)}</p>
            </div>
          </a>
        ))}
        {documents.length === 0 && <p className="text-sm text-ink-400 text-center py-10">Aucun document</p>}
      </div>
    </div>
  );
}

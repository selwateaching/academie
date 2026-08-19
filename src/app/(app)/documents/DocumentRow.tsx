'use client';

import { useState, useTransition } from 'react';
import { renameDocument, moveDocument, deleteDocument } from './actions';
import { DOC_FOLDERS, fmtDate } from '@/lib/enums';
import { Icon } from '@/components/shell/Icon';

export function DocumentRow({ doc }: { doc: { id: string; name: string; filePath: string; folder: string; size: number | null; createdAt: string; uploaderName?: string } }) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(doc.name);
  const [pending, startTransition] = useTransition();

  const ext = doc.name.split('.').pop()?.toLowerCase() ?? '';
  const isImage = ['png', 'jpg', 'jpeg', 'gif', 'webp'].includes(ext);
  const icon = isImage ? 'Image' : ext === 'pdf' ? 'FileText' : 'File';

  return (
    <tr>
      <td>
        <a href={`/api/files/${doc.filePath}`} target="_blank" className="flex items-center gap-2.5 hover:text-brand-700">
          <Icon name={icon} size={16} className="text-ink-400 shrink-0" />
          {editing ? (
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              onClick={(e) => e.preventDefault()}
              onBlur={() => { setEditing(false); startTransition(() => renameDocument(doc.id, name)); }}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); setEditing(false); startTransition(() => renameDocument(doc.id, name)); } }}
              autoFocus
              className="input !py-1 !text-sm"
            />
          ) : (
            <span className="truncate">{doc.name}</span>
          )}
        </a>
      </td>
      <td>
        <select
          defaultValue={doc.folder}
          disabled={pending}
          onChange={(e) => startTransition(() => moveDocument(doc.id, e.target.value))}
          className="select !py-1 !text-xs w-auto"
        >
          {Object.entries(DOC_FOLDERS).map(([k, v]) => (<option key={k} value={k}>{v}</option>))}
        </select>
      </td>
      <td className="text-ink-400 text-xs">{doc.size ? `${(doc.size / 1024).toFixed(0)} Ko` : '—'}</td>
      <td className="text-ink-400 text-xs">{fmtDate(doc.createdAt)}</td>
      <td>
        <div className="flex items-center gap-1.5">
          <button onClick={() => setEditing(true)} className="btn-secondary btn-sm !px-2"><Icon name="Pencil" size={13} /></button>
          <a href={`/api/files/${doc.filePath}`} download target="_blank" className="btn-secondary btn-sm !px-2"><Icon name="Download" size={13} /></a>
          <button onClick={() => { if (confirm('Supprimer ce document ?')) startTransition(() => deleteDocument(doc.id)); }} className="btn-danger btn-sm !px-2"><Icon name="Trash2" size={13} /></button>
        </div>
      </td>
    </tr>
  );
}

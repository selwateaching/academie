'use client';

import { useRef, useState, useTransition } from 'react';
import { uploadDocument } from './actions';
import { DOC_FOLDERS } from '@/lib/enums';
import { Icon } from '@/components/shell/Icon';

export function DropzoneUpload({
  defaultFolder,
  clientId,
  chantierId,
  supplierId,
  employeeId,
}: {
  defaultFolder?: string;
  clientId?: string;
  chantierId?: string;
  supplierId?: string;
  employeeId?: string;
}) {
  const [dragging, setDragging] = useState(false);
  const [pending, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  function submitFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    const fd = new FormData(formRef.current!);
    fd.delete('files');
    Array.from(files).forEach((f) => fd.append('files', f));
    startTransition(() => uploadDocument(fd));
  }

  return (
    <form
      ref={formRef}
      onSubmit={(e) => e.preventDefault()}
      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => { e.preventDefault(); setDragging(false); submitFiles(e.dataTransfer.files); }}
      className={`rounded-2xl border-2 border-dashed p-6 text-center transition-colors ${dragging ? 'border-brand-500 bg-brand-50' : 'border-ink-200 bg-white'}`}
    >
      {defaultFolder && <input type="hidden" name="folder" value={defaultFolder} />}
      {clientId && <input type="hidden" name="clientId" value={clientId} />}
      {chantierId && <input type="hidden" name="chantierId" value={chantierId} />}
      {supplierId && <input type="hidden" name="supplierId" value={supplierId} />}
      {employeeId && <input type="hidden" name="employeeId" value={employeeId} />}
      <Icon name="UploadCloud" size={28} className="mx-auto text-ink-400 mb-2" />
      <p className="text-sm text-ink-600 mb-1">Glissez vos fichiers ici, ou</p>
      <button type="button" onClick={() => inputRef.current?.click()} className="btn-secondary btn-sm" disabled={pending}>
        {pending ? 'Envoi…' : 'Parcourir'}
      </button>
      <input ref={inputRef} type="file" name="files" multiple className="hidden" onChange={(e) => submitFiles(e.target.files)} />
      {!defaultFolder && (
        <div className="mt-3 max-w-xs mx-auto">
          <select name="folder" className="select !text-xs">
            {Object.entries(DOC_FOLDERS).map(([k, v]) => (<option key={k} value={k}>{v}</option>))}
          </select>
        </div>
      )}
    </form>
  );
}

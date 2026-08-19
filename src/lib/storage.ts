import { promises as fs } from 'fs';
import path from 'path';
import { randomUUID } from 'crypto';

const STORAGE_ROOT = process.env.STORAGE_DIR || path.join(process.cwd(), 'storage', 'uploads');
const useBlob = () => Boolean(process.env.BLOB_READ_WRITE_TOKEN);

export async function saveUploadedFile(file: File, subdir: string): Promise<{ filePath: string; name: string; size: number; mimeType: string }> {
  const ext = path.extname(file.name) || '';
  const buffer = Buffer.from(await file.arrayBuffer());
  const mimeType = file.type || 'application/octet-stream';

  if (useBlob()) {
    const { put } = await import('@vercel/blob');
    const key = `${subdir}/${randomUUID()}${ext}`;
    const blob = await put(key, buffer, { access: 'public', contentType: mimeType });
    return { filePath: blob.url, name: file.name, size: buffer.length, mimeType };
  }

  const dir = path.join(STORAGE_ROOT, subdir);
  await fs.mkdir(dir, { recursive: true });
  const safeName = `${randomUUID()}${ext}`;
  await fs.writeFile(path.join(dir, safeName), buffer);
  return {
    filePath: path.posix.join(subdir, safeName),
    name: file.name,
    size: buffer.length,
    mimeType,
  };
}

export async function readStoredFile(relPath: string) {
  if (relPath.startsWith('http://') || relPath.startsWith('https://')) {
    const res = await fetch(relPath);
    if (!res.ok) throw new Error('Fichier introuvable');
    return Buffer.from(await res.arrayBuffer());
  }

  const full = path.join(STORAGE_ROOT, relPath);
  if (!full.startsWith(STORAGE_ROOT)) throw new Error('Invalid path');
  return fs.readFile(full);
}

export async function deleteStoredFile(relPath: string) {
  if (relPath.startsWith('http://') || relPath.startsWith('https://')) {
    if (useBlob()) {
      const { del } = await import('@vercel/blob');
      await del(relPath).catch(() => {});
    }
    return;
  }

  const full = path.join(STORAGE_ROOT, relPath);
  if (!full.startsWith(STORAGE_ROOT)) throw new Error('Invalid path');
  await fs.unlink(full).catch(() => {});
}

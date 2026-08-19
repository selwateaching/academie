import { promises as fs } from 'fs';
import path from 'path';
import { randomUUID } from 'crypto';

const STORAGE_ROOT = path.join(process.cwd(), 'storage', 'uploads');

export async function saveUploadedFile(file: File, subdir: string): Promise<{ filePath: string; name: string; size: number; mimeType: string }> {
  const dir = path.join(STORAGE_ROOT, subdir);
  await fs.mkdir(dir, { recursive: true });
  const ext = path.extname(file.name) || '';
  const safeName = `${randomUUID()}${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  await fs.writeFile(path.join(dir, safeName), buffer);
  return {
    filePath: path.posix.join(subdir, safeName),
    name: file.name,
    size: buffer.length,
    mimeType: file.type || 'application/octet-stream',
  };
}

export async function readStoredFile(relPath: string) {
  const full = path.join(STORAGE_ROOT, relPath);
  if (!full.startsWith(STORAGE_ROOT)) throw new Error('Invalid path');
  return fs.readFile(full);
}

export async function deleteStoredFile(relPath: string) {
  const full = path.join(STORAGE_ROOT, relPath);
  if (!full.startsWith(STORAGE_ROOT)) throw new Error('Invalid path');
  await fs.unlink(full).catch(() => {});
}

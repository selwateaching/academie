import { NextRequest, NextResponse } from 'next/server';
import { readStoredFile } from '@/lib/storage';
import { requireUser } from '@/lib/session';
import path from 'path';

const MIME_BY_EXT: Record<string, string> = {
  '.pdf': 'application/pdf',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.doc': 'application/msword',
  '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  '.xls': 'application/vnd.ms-excel',
  '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  '.txt': 'text/plain',
  '.csv': 'text/csv',
};

export async function GET(req: NextRequest, { params }: { params: { path: string[] } }) {
  try {
    await requireUser();
  } catch {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
  }
  const relPath = params.path.join('/');
  try {
    const buffer = await readStoredFile(relPath);
    const ext = path.extname(relPath).toLowerCase();
    const mime = MIME_BY_EXT[ext] ?? 'application/octet-stream';
    return new NextResponse(buffer, { headers: { 'Content-Type': mime, 'Cache-Control': 'private, max-age=3600' } });
  } catch {
    return NextResponse.json({ error: 'Fichier introuvable' }, { status: 404 });
  }
}

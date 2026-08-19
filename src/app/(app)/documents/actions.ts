'use server';

import { prisma } from '@/lib/prisma';
import { requireUser } from '@/lib/session';
import { revalidatePath } from 'next/cache';
import { saveUploadedFile, deleteStoredFile } from '@/lib/storage';
import { logAudit, notifyCompanyAdmins } from '@/lib/notify';

export async function uploadDocument(formData: FormData) {
  const user = await requireUser();
  const files = formData.getAll('files') as File[];
  const folder = String(formData.get('folder') ?? 'ADMINISTRATIF');
  const clientId = String(formData.get('clientId') ?? '') || null;
  const chantierId = String(formData.get('chantierId') ?? '') || null;
  const supplierId = String(formData.get('supplierId') ?? '') || null;
  const employeeId = String(formData.get('employeeId') ?? '') || null;

  for (const file of files) {
    if (!file || file.size === 0) continue;
    const saved = await saveUploadedFile(file, `documents/${folder.toLowerCase()}`);
    await prisma.document.create({
      data: {
        companyId: user.companyId,
        folder,
        name: saved.name,
        filePath: saved.filePath,
        mimeType: saved.mimeType,
        size: saved.size,
        clientId, chantierId, supplierId, employeeId,
        uploadedById: user.id,
      },
    });
  }
  await logAudit(user.companyId, user.id, 'upload', 'Document', undefined, `${files.length} fichier(s)`);
  await notifyCompanyAdmins(user.companyId, { type: 'document_recu', title: 'Nouveau document', body: `${user.name} a ajouté ${files.length} document(s) dans ${folder}.`, link: '/documents' });
  revalidatePath('/documents');
}

export async function renameDocument(documentId: string, newName: string) {
  const user = await requireUser();
  if (!newName.trim()) return;
  await prisma.document.update({ where: { id: documentId, companyId: user.companyId }, data: { name: newName.trim() } });
  revalidatePath('/documents');
}

export async function moveDocument(documentId: string, folder: string) {
  const user = await requireUser();
  await prisma.document.update({ where: { id: documentId, companyId: user.companyId }, data: { folder } });
  revalidatePath('/documents');
}

export async function deleteDocument(documentId: string) {
  const user = await requireUser();
  const doc = await prisma.document.findFirst({ where: { id: documentId, companyId: user.companyId } });
  if (!doc) return;
  await prisma.document.delete({ where: { id: documentId } });
  await deleteStoredFile(doc.filePath);
  revalidatePath('/documents');
}

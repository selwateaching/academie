import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireUser } from '@/lib/session';

export async function GET(req: NextRequest) {
  const user = await requireUser();
  const q = req.nextUrl.searchParams.get('q')?.trim() ?? '';
  if (q.length < 2) return NextResponse.json({ results: [] });

  const where = { companyId: user.companyId };
  const contains = { contains: q };

  const [clients, chantiers, devis, factures, suppliers, docs, tasks] = await Promise.all([
    prisma.client.findMany({ where: { ...where, OR: [{ firstName: contains }, { lastName: contains }, { companyName: contains }, { email: contains }] }, take: 5 }),
    prisma.chantier.findMany({ where: { ...where, name: contains }, take: 5 }),
    prisma.devis.findMany({ where: { ...where, number: contains }, include: { client: true }, take: 5 }),
    prisma.facture.findMany({ where: { ...where, number: contains }, include: { client: true }, take: 5 }),
    prisma.supplier.findMany({ where: { ...where, name: contains }, take: 5 }),
    prisma.document.findMany({ where: { ...where, name: contains }, take: 5 }),
    prisma.task.findMany({ where: { ...where, title: contains }, take: 5 }),
  ]);

  const results = [
    ...clients.map((c) => ({ id: c.id, type: 'Client', label: `${c.firstName} ${c.lastName}${c.companyName ? ' · ' + c.companyName : ''}`, sub: c.email ?? c.phone ?? '', href: `/clients/${c.id}` })),
    ...chantiers.map((c) => ({ id: c.id, type: 'Chantier', label: c.name, sub: c.address ?? '', href: `/chantiers/${c.id}` })),
    ...devis.map((d) => ({ id: d.id, type: 'Devis', label: d.number, sub: `${d.client.firstName} ${d.client.lastName}`, href: `/devis/${d.id}` })),
    ...factures.map((f) => ({ id: f.id, type: 'Facture', label: f.number, sub: `${f.client.firstName} ${f.client.lastName}`, href: `/factures/${f.id}` })),
    ...suppliers.map((s) => ({ id: s.id, type: 'Fournisseur', label: s.name, sub: s.email ?? '', href: `/fournisseurs/${s.id}` })),
    ...docs.map((d) => ({ id: d.id, type: 'Document', label: d.name, sub: d.folder, href: `/documents?doc=${d.id}` })),
    ...tasks.map((t) => ({ id: t.id, type: 'Tâche', label: t.title, sub: t.status, href: `/taches` })),
  ];

  return NextResponse.json({ results });
}

import { NextRequest, NextResponse } from 'next/server';
import { renderToBuffer } from '@react-pdf/renderer';
import { prisma } from '@/lib/prisma';
import { requireClientSession } from '@/lib/clientAuth';
import { computeTotals } from '@/lib/calc';
import { DocumentPdf } from '@/lib/pdf/DocumentPdf';
import { FACTURE_STATUSES } from '@/lib/enums';
import React from 'react';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await requireClientSession();
  const facture = await prisma.facture.findFirst({
    where: { id: params.id, clientId: session.clientId },
    include: { client: true, chantier: true, lines: { orderBy: { order: 'asc' } }, company: true },
  });
  if (!facture) return NextResponse.json({ error: 'Introuvable' }, { status: 404 });

  const totals = computeTotals(facture.lines, facture.discountPct);
  const element: any = React.createElement(DocumentPdf, {
    docTitle: 'FACTURE', number: facture.number, statusLabel: (FACTURE_STATUSES as any)[facture.status]?.label,
    date: facture.date, secondaryDate: { label: 'Échéance', value: facture.dueDate },
    company: facture.company, client: facture.client, chantierName: facture.chantier?.name,
    lines: facture.lines, discountPct: facture.discountPct, totals, paidAmount: facture.paidAmount,
    paymentTerms: facture.paymentTerms, notes: facture.notes,
  });
  const buffer = await renderToBuffer(element);
  return new NextResponse(new Uint8Array(buffer), { headers: { 'Content-Type': 'application/pdf', 'Content-Disposition': `inline; filename="${facture.number}.pdf"` } });
}

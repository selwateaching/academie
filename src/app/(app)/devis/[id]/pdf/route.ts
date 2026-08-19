import { NextRequest, NextResponse } from 'next/server';
import { renderToBuffer } from '@react-pdf/renderer';
import { prisma } from '@/lib/prisma';
import { requireUser } from '@/lib/session';
import { computeTotals } from '@/lib/calc';
import { DocumentPdf } from '@/lib/pdf/DocumentPdf';
import { DEVIS_STATUSES } from '@/lib/enums';
import React from 'react';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await requireUser();
  const devis = await prisma.devis.findFirst({
    where: { id: params.id, companyId: user.companyId },
    include: { client: true, chantier: true, lines: { orderBy: { order: 'asc' } }, company: true },
  });
  if (!devis) return NextResponse.json({ error: 'Introuvable' }, { status: 404 });

  const totals = computeTotals(devis.lines, devis.discountPct);
  const element: any = React.createElement(DocumentPdf, {
      docTitle: 'DEVIS',
      number: devis.number,
      statusLabel: (DEVIS_STATUSES as any)[devis.status]?.label,
      date: devis.date,
      secondaryDate: { label: 'Valide jusqu\'au', value: devis.validUntil },
      company: devis.company,
      client: devis.client,
      chantierName: devis.chantier?.name,
      lines: devis.lines,
      discountPct: devis.discountPct,
      totals,
      depositPct: devis.depositPct,
      paymentTerms: devis.paymentTerms,
      notes: devis.notes,
    });
  const buffer = await renderToBuffer(element);

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="${devis.number}.pdf"`,
    },
  });
}

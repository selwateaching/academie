import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireUser } from '@/lib/session';
import Papa from 'papaparse';
import ExcelJS from 'exceljs';

async function getRows(companyId: string, type: string): Promise<Record<string, string | number>[]> {
  switch (type) {
    case 'factures': {
      const factures = await prisma.facture.findMany({ where: { companyId }, include: { client: true, chantier: true } });
      return factures.map((f) => ({
        Numero: f.number, Client: `${f.client.firstName} ${f.client.lastName}`, Chantier: f.chantier?.name ?? '',
        Type: f.type, Statut: f.status, Date: f.date.toISOString().slice(0, 10), Echeance: f.dueDate?.toISOString().slice(0, 10) ?? '',
        TotalHT: f.totalHT, TotalTTC: f.totalTTC, Paye: f.paidAmount, Restant: f.totalTTC - f.paidAmount,
      }));
    }
    case 'devis': {
      const devis = await prisma.devis.findMany({ where: { companyId }, include: { client: true, chantier: true } });
      return devis.map((d) => ({
        Numero: d.number, Client: `${d.client.firstName} ${d.client.lastName}`, Chantier: d.chantier?.name ?? '',
        Statut: d.status, Date: d.date.toISOString().slice(0, 10), TotalHT: d.totalHT, TotalTTC: d.totalTTC,
      }));
    }
    case 'chantiers': {
      const chantiers = await prisma.chantier.findMany({ where: { companyId }, include: { client: true, factures: true } });
      return chantiers.map((c) => {
        const revenueActual = c.factures.filter((f) => f.status === 'PAYEE').reduce((s, f) => s + f.totalTTC, 0);
        return {
          Nom: c.name, Client: `${c.client.firstName} ${c.client.lastName}`, Statut: c.status, Avancement: `${c.progress}%`,
          BudgetPrevu: c.budgetPlanned, CoutReel: c.costActual, CAPrevu: c.revenuePlanned, CAEncaisse: revenueActual,
          Marge: revenueActual - c.costActual,
        };
      });
    }
    case 'heures': {
      const entries = await prisma.timeEntry.findMany({ where: { user: { companyId } }, include: { user: true, chantier: true } });
      return entries.map((e) => ({ Salarie: e.user.name, Chantier: e.chantier?.name ?? '', Date: e.date.toISOString().slice(0, 10), Heures: e.hours, Note: e.note ?? '' }));
    }
    case 'clients': {
      const clients = await prisma.client.findMany({ where: { companyId } });
      return clients.map((c) => ({ Nom: `${c.firstName} ${c.lastName}`, Entreprise: c.companyName ?? '', Email: c.email ?? '', Telephone: c.phone ?? '', Adresse: c.address ?? '' }));
    }
    default:
      return [];
  }
}

export async function GET(req: NextRequest) {
  const user = await requireUser();
  const type = req.nextUrl.searchParams.get('type') ?? 'factures';
  const format = req.nextUrl.searchParams.get('format') ?? 'csv';
  const rows = await getRows(user.companyId, type);

  if (format === 'xlsx') {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet(type);
    if (rows.length > 0) {
      sheet.columns = Object.keys(rows[0]).map((key) => ({ header: key, key, width: 20 }));
      sheet.addRows(rows);
      sheet.getRow(1).font = { bold: true };
    }
    const buffer = await workbook.xlsx.writeBuffer();
    return new NextResponse(new Uint8Array(buffer as ArrayBuffer), {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${type}.xlsx"`,
      },
    });
  }

  const csv = Papa.unparse(rows);
  return new NextResponse(csv, {
    headers: { 'Content-Type': 'text/csv; charset=utf-8', 'Content-Disposition': `attachment; filename="${type}.csv"` },
  });
}

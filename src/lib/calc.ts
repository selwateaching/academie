export type Line = { quantity: number; unitPrice: number; vatRate: number };

export function lineTotalHT(line: Line) {
  return line.quantity * line.unitPrice;
}

export function computeTotals(lines: Line[], discountPct = 0) {
  const subtotalHT = lines.reduce((sum, l) => sum + lineTotalHT(l), 0);
  const discountAmount = (subtotalHT * discountPct) / 100;
  const netHT = subtotalHT - discountAmount;

  const vatGroups = new Map<number, number>();
  for (const l of lines) {
    const base = lineTotalHT(l) * (1 - discountPct / 100);
    vatGroups.set(l.vatRate, (vatGroups.get(l.vatRate) ?? 0) + base * (l.vatRate / 100));
  }
  const vatAmount = Array.from(vatGroups.values()).reduce((a, b) => a + b, 0);
  const totalTTC = netHT + vatAmount;

  return {
    subtotalHT,
    discountAmount,
    netHT,
    vatAmount,
    totalTTC,
    vatBreakdown: Array.from(vatGroups.entries()).map(([rate, amount]) => ({ rate, amount })),
  };
}

export async function nextNumber(
  prisma: any,
  model: 'devis' | 'facture',
  prefix: string
) {
  const year = new Date().getFullYear();
  const count =
    model === 'devis'
      ? await prisma.devis.count({ where: { number: { startsWith: `${prefix}${year}-` } } })
      : await prisma.facture.count({ where: { number: { startsWith: `${prefix}${year}-` } } });
  const n = (count + 1).toString().padStart(4, '0');
  return `${prefix}${year}-${n}`;
}

export function parseLinesFromFormData(formData: FormData) {
  const count = Number(formData.get('line_count') ?? 0);
  const lines: { type: string; description: string; quantity: number; unit: string; unitPrice: number; vatRate: number; order: number }[] = [];
  for (let i = 0; i < count; i++) {
    const description = String(formData.get(`line_desc_${i}`) ?? '').trim();
    if (!description) continue;
    lines.push({
      type: String(formData.get(`line_type_${i}`) ?? 'PRESTATION'),
      description,
      quantity: Number(formData.get(`line_qty_${i}`) ?? 0),
      unit: String(formData.get(`line_unit_${i}`) ?? 'u'),
      unitPrice: Number(formData.get(`line_price_${i}`) ?? 0),
      vatRate: Number(formData.get(`line_vat_${i}`) ?? 20),
      order: i,
    });
  }
  return lines;
}

export function computeChantierMargin(revenueActual: number, costActual: number) {
  const margin = revenueActual - costActual;
  const marginPct = revenueActual > 0 ? (margin / revenueActual) * 100 : 0;
  return { margin, marginPct };
}

'use client';

import { useState } from 'react';
import { computeTotals } from '@/lib/calc';
import { LINE_TYPES, fmtEUR } from '@/lib/enums';
import { Icon } from '@/components/shell/Icon';

export type EditorLine = { type: string; description: string; quantity: number; unit: string; unitPrice: number; vatRate: number };

export function LineEditor({ initialLines, defaultVatRate = 20 }: { initialLines?: EditorLine[]; defaultVatRate?: number }) {
  const [lines, setLines] = useState<EditorLine[]>(
    initialLines && initialLines.length > 0
      ? initialLines
      : [{ type: 'PRESTATION', description: '', quantity: 1, unit: 'u', unitPrice: 0, vatRate: defaultVatRate }]
  );

  function update(i: number, patch: Partial<EditorLine>) {
    setLines((prev) => prev.map((l, idx) => (idx === i ? { ...l, ...patch } : l)));
  }
  function addLine() {
    setLines((prev) => [...prev, { type: 'PRESTATION', description: '', quantity: 1, unit: 'u', unitPrice: 0, vatRate: defaultVatRate }]);
  }
  function removeLine(i: number) {
    setLines((prev) => prev.filter((_, idx) => idx !== i));
  }

  const totals = computeTotals(lines, 0);

  return (
    <div>
      <input type="hidden" name="line_count" value={lines.length} />
      <div className="space-y-3">
        {lines.map((line, i) => (
          <div key={i} className="grid grid-cols-12 gap-2 items-start rounded-xl border border-ink-100 p-3">
            <input type="hidden" name={`line_type_${i}`} value={line.type} />
            <div className="col-span-12 sm:col-span-2">
              <select value={line.type} onChange={(e) => update(i, { type: e.target.value })} className="select !py-2 !text-xs">
                {Object.entries(LINE_TYPES).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </div>
            <div className="col-span-12 sm:col-span-4">
              <input
                name={`line_desc_${i}`}
                value={line.description}
                onChange={(e) => update(i, { description: e.target.value })}
                placeholder="Description de la prestation"
                required
                className="input !py-2 !text-sm"
              />
            </div>
            <div className="col-span-4 sm:col-span-1">
              <input
                type="number" step="0.01" name={`line_qty_${i}`} value={line.quantity}
                onChange={(e) => update(i, { quantity: Number(e.target.value) })}
                placeholder="Qté" className="input !py-2 !text-sm"
              />
            </div>
            <div className="col-span-4 sm:col-span-1">
              <input
                name={`line_unit_${i}`} value={line.unit}
                onChange={(e) => update(i, { unit: e.target.value })}
                placeholder="Unité" className="input !py-2 !text-sm"
              />
            </div>
            <div className="col-span-4 sm:col-span-2">
              <input
                type="number" step="0.01" name={`line_price_${i}`} value={line.unitPrice}
                onChange={(e) => update(i, { unitPrice: Number(e.target.value) })}
                placeholder="Prix U. HT" className="input !py-2 !text-sm"
              />
            </div>
            <div className="col-span-8 sm:col-span-1">
              <select
                name={`line_vat_${i}`} value={line.vatRate}
                onChange={(e) => update(i, { vatRate: Number(e.target.value) })}
                className="select !py-2 !text-xs"
              >
                {[0, 5.5, 10, 20].map((v) => (
                  <option key={v} value={v}>{v}%</option>
                ))}
              </select>
            </div>
            <div className="col-span-4 sm:col-span-1 flex items-center justify-end gap-2 h-full">
              <button type="button" onClick={() => removeLine(i)} className="text-rose-500 hover:text-rose-700 p-2" aria-label="Supprimer">
                <Icon name="Trash2" size={16} />
              </button>
            </div>
            <p className="col-span-12 text-right text-xs text-ink-400">Total ligne HT : <strong className="text-ink-600">{fmtEUR(line.quantity * line.unitPrice)}</strong></p>
          </div>
        ))}
      </div>
      <button type="button" onClick={addLine} className="btn-secondary btn-sm mt-3">
        <Icon name="Plus" size={14} /> Ajouter une ligne
      </button>

      <div className="mt-5 flex justify-end">
        <div className="w-full sm:w-72 space-y-1.5 text-sm">
          <div className="flex justify-between"><span className="text-ink-500">Total HT</span><span className="font-medium">{fmtEUR(totals.netHT)}</span></div>
          <div className="flex justify-between"><span className="text-ink-500">TVA</span><span className="font-medium">{fmtEUR(totals.vatAmount)}</span></div>
          <div className="flex justify-between text-base border-t border-ink-200 pt-1.5 mt-1.5"><span className="font-semibold text-ink-800">Total TTC</span><span className="font-bold text-brand-700">{fmtEUR(totals.totalTTC)}</span></div>
        </div>
      </div>
    </div>
  );
}

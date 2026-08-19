'use client';

import { useState } from 'react';
import { addStockMovement } from './actions';
import { Icon } from '@/components/shell/Icon';

export function StockMoveForm({ materialId, chantiers }: { materialId: string; chantiers: { id: string; name: string }[] }) {
  const [open, setOpen] = useState(false);
  const action = addStockMovement.bind(null, materialId);
  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="btn-secondary btn-sm">
        <Icon name="ArrowLeftRight" size={13} /> Mouvement
      </button>
    );
  }
  return (
    <form
      action={async (fd) => { await action(fd); setOpen(false); }}
      className="flex flex-wrap items-center gap-1.5"
    >
      <select name="type" className="select !py-1 !text-xs w-auto">
        <option value="ENTREE">Entrée</option>
        <option value="SORTIE">Sortie</option>
      </select>
      <input type="number" step="0.01" name="quantity" placeholder="Qté" required className="input !py-1 !text-xs w-20" />
      <select name="chantierId" className="select !py-1 !text-xs w-auto">
        <option value="">Sans chantier</option>
        {chantiers.map((c) => (<option key={c.id} value={c.id}>{c.name}</option>))}
      </select>
      <button className="btn-primary btn-sm">OK</button>
      <button type="button" onClick={() => setOpen(false)} className="btn-ghost btn-sm">Annuler</button>
    </form>
  );
}

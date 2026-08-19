'use client';

import { useState, useRef, useEffect } from 'react';
import { Icon } from '@/components/shell/Icon';

const TYPES = [
  { value: 'factures', label: 'Factures' },
  { value: 'devis', label: 'Devis' },
  { value: 'chantiers', label: 'Rentabilité chantiers' },
  { value: 'heures', label: 'Heures' },
  { value: 'clients', label: 'Clients' },
];

export function ExportButtons() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    function onClick(e: MouseEvent) { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); }
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen((v) => !v)} className="btn-secondary"><Icon name="Download" size={16} /> Exporter</button>
      {open && (
        <div className="absolute right-0 mt-2 w-64 card p-2 z-50">
          {TYPES.map((t) => (
            <div key={t.value} className="flex items-center justify-between px-2 py-1.5">
              <span className="text-sm text-ink-700">{t.label}</span>
              <div className="flex gap-1">
                <a href={`/api/export?type=${t.value}&format=csv`} className="btn-secondary btn-sm !px-2">CSV</a>
                <a href={`/api/export?type=${t.value}&format=xlsx`} className="btn-secondary btn-sm !px-2">Excel</a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

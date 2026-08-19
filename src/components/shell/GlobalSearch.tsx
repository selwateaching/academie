'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Icon } from '@/components/shell/Icon';

type Result = { id: string; type: string; label: string; sub: string; href: string };

export function GlobalSearch() {
  const [q, setQ] = useState('');
  const [results, setResults] = useState<Result[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  useEffect(() => {
    if (q.trim().length < 2) {
      setResults([]);
      return;
    }
    setLoading(true);
    const t = setTimeout(() => {
      fetch(`/api/search?q=${encodeURIComponent(q)}`)
        .then((r) => r.json())
        .then((data) => {
          setResults(data.results ?? []);
          setOpen(true);
        })
        .finally(() => setLoading(false));
    }, 250);
    return () => clearTimeout(t);
  }, [q]);

  return (
    <div className="relative flex-1 max-w-lg" ref={ref}>
      <div className="relative">
        <Icon name="Search" size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onFocus={() => results.length > 0 && setOpen(true)}
          placeholder="Rechercher un client, devis, chantier, facture…"
          className="input !pl-9 !py-2 text-sm"
        />
      </div>
      {open && q.trim().length >= 2 && (
        <div className="absolute left-0 right-0 mt-2 card p-2 z-50 max-h-96 overflow-y-auto">
          {loading && <p className="px-3 py-2 text-sm text-ink-400">Recherche…</p>}
          {!loading && results.length === 0 && <p className="px-3 py-2 text-sm text-ink-400">Aucun résultat pour « {q} »</p>}
          {!loading &&
            results.map((r) => (
              <Link
                key={r.type + r.id}
                href={r.href}
                onClick={() => setOpen(false)}
                className="flex items-center justify-between gap-2 rounded-lg px-3 py-2.5 hover:bg-brand-50 text-sm"
              >
                <div className="min-w-0">
                  <p className="font-medium text-ink-800 truncate">{r.label}</p>
                  <p className="text-xs text-ink-400 truncate">{r.sub}</p>
                </div>
                <span className="badge bg-ink-100 text-ink-500 border-ink-200 shrink-0">{r.type}</span>
              </Link>
            ))}
        </div>
      )}
    </div>
  );
}

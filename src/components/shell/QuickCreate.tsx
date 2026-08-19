'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Icon } from '@/components/shell/Icon';

const ITEMS = [
  { href: '/clients/nouveau', label: 'Nouveau client', icon: 'Users' },
  { href: '/devis/nouveau', label: 'Nouveau devis', icon: 'FileText' },
  { href: '/factures/nouveau', label: 'Nouvelle facture', icon: 'Receipt' },
  { href: '/chantiers/nouveau', label: 'Nouveau chantier', icon: 'Building2' },
  { href: '/taches/nouveau', label: 'Nouvelle tâche', icon: 'ListChecks' },
  { href: '/documents', label: 'Ajouter un document', icon: 'FolderOpen' },
  { href: '/messagerie', label: 'Envoyer un message', icon: 'MessageSquare' },
  { href: '/calendrier/nouveau', label: 'Nouveau rendez-vous', icon: 'Calendar' },
];

export function QuickCreate() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="btn-primary !rounded-full !p-0 h-10 w-10 sm:h-auto sm:w-auto sm:!rounded-xl sm:!px-4"
        aria-label="Créer"
      >
        <Icon name="Plus" size={18} strokeWidth={2.5} />
        <span className="hidden sm:inline">Créer</span>
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-64 card p-2 z-50 animate-in">
          {ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-ink-700 hover:bg-brand-50 hover:text-brand-700"
            >
              <Icon name={item.icon} size={17} />
              {item.label}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

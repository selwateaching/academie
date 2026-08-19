export const ROLES = {
  ADMIN: { label: 'Patron / Administrateur', color: 'bg-brand-600' },
  CONDUCTEUR: { label: 'Conducteur de travaux', color: 'bg-indigo-600' },
  CHEF_CHANTIER: { label: 'Chef de chantier', color: 'bg-amber-600' },
  SALARIE: { label: 'Salarié', color: 'bg-slate-600' },
  COMPTABILITE: { label: 'Comptabilité', color: 'bg-emerald-600' },
} as const;
export type RoleKey = keyof typeof ROLES;

export const PERMISSIONS: Record<RoleKey, string[]> = {
  ADMIN: ['*'],
  CONDUCTEUR: [
    'dashboard', 'clients', 'prospects', 'chantiers', 'planning', 'devis', 'factures',
    'fournisseurs', 'materiaux', 'salaries', 'heures', 'taches', 'documents', 'messagerie',
    'calendrier', 'rapports',
  ],
  CHEF_CHANTIER: [
    'dashboard', 'chantiers', 'planning', 'heures', 'taches', 'documents', 'messagerie', 'calendrier', 'clients',
  ],
  SALARIE: ['dashboard', 'planning', 'heures', 'taches', 'documents', 'messagerie', 'calendrier'],
  COMPTABILITE: ['dashboard', 'devis', 'factures', 'finances', 'rapports', 'clients', 'fournisseurs', 'documents'],
};

export function can(role: string, section: string) {
  const perms = PERMISSIONS[role as RoleKey];
  if (!perms) return false;
  return perms.includes('*') || perms.includes(section);
}

export const CLIENT_TYPES = {
  PARTICULIER: 'Particulier',
  ENTREPRISE: 'Entreprise',
} as const;

export const PROSPECT_STATUSES = {
  NOUVEAU: { label: 'Nouveau', color: 'bg-slate-100 text-slate-700 border-slate-300' },
  CONTACTE: { label: 'Contacté', color: 'bg-blue-100 text-blue-700 border-blue-300' },
  DEVIS_ENVOYE: { label: 'Devis envoyé', color: 'bg-indigo-100 text-indigo-700 border-indigo-300' },
  RELANCE: { label: 'Relancé', color: 'bg-amber-100 text-amber-700 border-amber-300' },
  GAGNE: { label: 'Gagné', color: 'bg-emerald-100 text-emerald-700 border-emerald-300' },
  PERDU: { label: 'Perdu', color: 'bg-rose-100 text-rose-700 border-rose-300' },
} as const;

export const CHANTIER_STATUSES = {
  A_PREPARER: { label: 'À préparer', color: 'bg-slate-100 text-slate-700 border-slate-300' },
  PLANIFIE: { label: 'Planifié', color: 'bg-blue-100 text-blue-700 border-blue-300' },
  EN_COURS: { label: 'En cours', color: 'bg-amber-100 text-amber-700 border-amber-300' },
  EN_PAUSE: { label: 'En pause', color: 'bg-orange-100 text-orange-700 border-orange-300' },
  TERMINE: { label: 'Terminé', color: 'bg-emerald-100 text-emerald-700 border-emerald-300' },
  ARCHIVE: { label: 'Archivé', color: 'bg-slate-200 text-slate-500 border-slate-300' },
} as const;

export const DEVIS_STATUSES = {
  BROUILLON: { label: 'Brouillon', color: 'bg-slate-100 text-slate-700 border-slate-300' },
  ENVOYE: { label: 'Envoyé', color: 'bg-blue-100 text-blue-700 border-blue-300' },
  CONSULTE: { label: 'Consulté', color: 'bg-indigo-100 text-indigo-700 border-indigo-300' },
  ACCEPTE: { label: 'Accepté', color: 'bg-emerald-100 text-emerald-700 border-emerald-300' },
  REFUSE: { label: 'Refusé', color: 'bg-rose-100 text-rose-700 border-rose-300' },
  EXPIRE: { label: 'Expiré', color: 'bg-orange-100 text-orange-700 border-orange-300' },
} as const;

export const FACTURE_STATUSES = {
  BROUILLON: { label: 'Brouillon', color: 'bg-slate-100 text-slate-700 border-slate-300' },
  ENVOYEE: { label: 'Envoyée', color: 'bg-blue-100 text-blue-700 border-blue-300' },
  PAYEE: { label: 'Payée', color: 'bg-emerald-100 text-emerald-700 border-emerald-300' },
  PARTIELLEMENT_PAYEE: { label: 'Partiellement payée', color: 'bg-amber-100 text-amber-700 border-amber-300' },
  EN_RETARD: { label: 'En retard', color: 'bg-orange-100 text-orange-700 border-orange-300' },
  IMPAYEE: { label: 'Impayée', color: 'bg-rose-100 text-rose-700 border-rose-300' },
} as const;

export const FACTURE_TYPES = {
  STANDARD: 'Standard',
  ACOMPTE: "Facture d'acompte",
  SITUATION: 'Facture de situation',
  FINALE: 'Facture finale',
} as const;

export const LINE_TYPES = {
  PRESTATION: 'Prestation',
  MATERIAU: 'Matériau',
  MAIN_OEUVRE: "Main-d'œuvre",
} as const;

export const PAYMENT_METHODS = {
  VIREMENT: 'Virement',
  CHEQUE: 'Chèque',
  ESPECES: 'Espèces',
  CARTE: 'Carte bancaire',
  PRELEVEMENT: 'Prélèvement',
  AUTRE: 'Autre',
} as const;

export const TASK_STATUSES = {
  A_FAIRE: { label: 'À faire', color: 'bg-slate-100 text-slate-700 border-slate-300' },
  EN_COURS: { label: 'En cours', color: 'bg-blue-100 text-blue-700 border-blue-300' },
  TERMINEE: { label: 'Terminée', color: 'bg-emerald-100 text-emerald-700 border-emerald-300' },
} as const;

export const TASK_PRIORITIES = {
  BASSE: { label: 'Basse', color: 'bg-slate-100 text-slate-700' },
  NORMALE: { label: 'Normale', color: 'bg-blue-100 text-blue-700' },
  URGENTE: { label: 'Urgente', color: 'bg-rose-100 text-rose-700' },
} as const;

export const EVENT_TYPES = {
  CHANTIER: { label: 'Chantier', color: '#2563eb' },
  RDV: { label: 'Rendez-vous client', color: '#7c3aed' },
  LIVRAISON: { label: 'Livraison', color: '#d97706' },
  INTERVENTION: { label: 'Intervention', color: '#0891b2' },
  REUNION: { label: 'Réunion', color: '#059669' },
  AUTRE: { label: 'Autre', color: '#64748b' },
} as const;

export const DOC_FOLDERS = {
  CLIENTS: 'Clients',
  CHANTIERS: 'Chantiers',
  DEVIS: 'Devis',
  FACTURES: 'Factures',
  FOURNISSEURS: 'Fournisseurs',
  SALARIES: 'Salariés',
  ADMINISTRATIF: 'Administratif',
} as const;

export const PHOTO_CATEGORIES = {
  AVANT: 'Avant',
  EN_COURS: 'En cours',
  APRES: 'Après',
} as const;

export const ABSENCE_TYPES = {
  CONGE: 'Congé',
  MALADIE: 'Arrêt maladie',
  RTT: 'RTT',
  AUTRE: 'Autre',
} as const;

export function fmtEUR(n: number | null | undefined) {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(n ?? 0);
}

export function fmtDate(d: Date | string | null | undefined) {
  if (!d) return '—';
  const date = typeof d === 'string' ? new Date(d) : d;
  return new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(date);
}

export function fmtDateTime(d: Date | string | null | undefined) {
  if (!d) return '—';
  const date = typeof d === 'string' ? new Date(d) : d;
  return new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(date);
}

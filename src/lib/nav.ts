export type NavItem = { href: string; label: string; icon: string; section: string };

export const NAV_ITEMS: NavItem[] = [
  { href: '/dashboard', label: 'Tableau de bord', icon: 'LayoutDashboard', section: 'dashboard' },
  { href: '/clients', label: 'Clients', icon: 'Users', section: 'clients' },
  { href: '/prospects', label: 'Prospects', icon: 'UserPlus', section: 'prospects' },
  { href: '/chantiers', label: 'Chantiers', icon: 'Building2', section: 'chantiers' },
  { href: '/planning', label: 'Planning', icon: 'CalendarClock', section: 'planning' },
  { href: '/devis', label: 'Devis', icon: 'FileText', section: 'devis' },
  { href: '/factures', label: 'Factures', icon: 'Receipt', section: 'factures' },
  { href: '/fournisseurs', label: 'Fournisseurs', icon: 'Truck', section: 'fournisseurs' },
  { href: '/materiaux', label: 'Matériaux / Stock', icon: 'Boxes', section: 'materiaux' },
  { href: '/salaries', label: 'Salariés', icon: 'HardHat', section: 'salaries' },
  { href: '/heures', label: 'Heures', icon: 'Clock', section: 'heures' },
  { href: '/taches', label: 'Tâches', icon: 'ListChecks', section: 'taches' },
  { href: '/documents', label: 'Documents', icon: 'FolderOpen', section: 'documents' },
  { href: '/messagerie', label: 'Messagerie', icon: 'MessageSquare', section: 'messagerie' },
  { href: '/calendrier', label: 'Calendrier', icon: 'Calendar', section: 'calendrier' },
  { href: '/carte', label: 'Carte', icon: 'Map', section: 'chantiers' },
  { href: '/finances', label: 'Finances', icon: 'Wallet', section: 'finances' },
  { href: '/rapports', label: 'Rapports', icon: 'BarChart3', section: 'rapports' },
  { href: '/assistant', label: 'Assistant IA', icon: 'Sparkles', section: 'dashboard' },
  { href: '/parametres', label: 'Paramètres', icon: 'Settings', section: 'parametres' },
];

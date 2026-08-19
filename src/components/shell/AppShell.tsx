'use client';

import { useState } from 'react';
import { signOut } from 'next-auth/react';
import { Sidebar } from '@/components/shell/Sidebar';
import { GlobalSearch } from '@/components/shell/GlobalSearch';
import { NotificationBell } from '@/components/shell/NotificationBell';
import { QuickCreate } from '@/components/shell/QuickCreate';
import { Icon } from '@/components/shell/Icon';
import { ROLES } from '@/lib/enums';

export function AppShell({
  role,
  companyName,
  userName,
  avatarColor,
  children,
}: {
  role: string;
  companyName: string;
  userName: string;
  avatarColor: string;
  children: React.ReactNode;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const roleLabel = (ROLES as any)[role]?.label ?? role;

  return (
    <div className="min-h-screen flex bg-ink-50">
      <aside className="hidden lg:block w-64 shrink-0 sticky top-0 h-screen">
        <Sidebar role={role} companyName={companyName} />
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setMobileOpen(false)} />
          <div className="absolute left-0 top-0 h-full w-72 shadow-pop">
            <Sidebar role={role} companyName={companyName} onNavigate={() => setMobileOpen(false)} />
          </div>
        </div>
      )}

      <div className="flex-1 min-w-0 flex flex-col">
        <header className="sticky top-0 z-40 bg-white/90 backdrop-blur border-b border-ink-200 px-3 sm:px-5 py-3 flex items-center gap-3">
          <button className="lg:hidden rounded-lg p-2 hover:bg-ink-100" onClick={() => setMobileOpen(true)} aria-label="Menu">
            <Icon name="Menu" size={20} />
          </button>
          <GlobalSearch />
          <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
            <QuickCreate />
            <NotificationBell />
            <div className="relative">
              <button
                onClick={() => setUserMenuOpen((v) => !v)}
                className="flex items-center gap-2 rounded-full pl-1 pr-1 sm:pr-3 py-1 hover:bg-ink-100"
              >
                <span
                  className="h-8 w-8 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0"
                  style={{ backgroundColor: avatarColor }}
                >
                  {userName?.[0]?.toUpperCase() ?? 'U'}
                </span>
                <span className="hidden sm:block text-left leading-tight">
                  <span className="block text-sm font-semibold text-ink-800">{userName}</span>
                  <span className="block text-[11px] text-ink-400">{roleLabel}</span>
                </span>
              </button>
              {userMenuOpen && (
                <div className="absolute right-0 mt-2 w-48 card p-1.5 z-50">
                  <a href="/parametres" className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-ink-700 hover:bg-ink-50">
                    <Icon name="Settings" size={16} /> Paramètres
                  </a>
                  <button
                    onClick={() => signOut({ callbackUrl: '/login' })}
                    className="w-full flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-rose-600 hover:bg-rose-50"
                  >
                    <Icon name="LogOut" size={16} /> Déconnexion
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>
        <main className="flex-1 p-3 sm:p-6 max-w-[1600px] w-full mx-auto pb-24 lg:pb-6">{children}</main>
        <MobileQuickBar />
      </div>
    </div>
  );
}

function MobileQuickBar() {
  const items = [
    { href: '/dashboard', icon: 'LayoutDashboard', label: 'Accueil' },
    { href: '/planning', icon: 'CalendarClock', label: 'Planning' },
    { href: '/heures', icon: 'Clock', label: 'Heures' },
    { href: '/documents', icon: 'FolderOpen', label: 'Docs' },
    { href: '/messagerie', icon: 'MessageSquare', label: 'Messages' },
  ];
  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-ink-200 flex items-stretch">
      {items.map((it) => (
        <a key={it.href} href={it.href} className="flex-1 flex flex-col items-center gap-0.5 py-2.5 text-ink-500 active:text-brand-600">
          <Icon name={it.icon} size={20} />
          <span className="text-[10px] font-medium">{it.label}</span>
        </a>
      ))}
    </nav>
  );
}

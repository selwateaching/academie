'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { NAV_ITEMS } from '@/lib/nav';
import { Icon } from '@/components/shell/Icon';
import { can } from '@/lib/enums';

export function Sidebar({ role, companyName, onNavigate }: { role: string; companyName: string; onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <div className="flex h-full flex-col bg-ink-900 text-ink-100">
      <div className="flex items-center gap-2.5 px-5 py-5 border-b border-white/10">
        <div className="h-9 w-9 rounded-lg bg-brand-600 flex items-center justify-center shrink-0">
          <Icon name="HardHat" size={20} className="text-white" />
        </div>
        <div className="min-w-0">
          <p className="font-bold text-white text-sm leading-tight truncate">{companyName}</p>
          <p className="text-[11px] text-ink-400">BTP Manager</p>
        </div>
      </div>
      <nav className="flex-1 overflow-y-auto py-3 px-2.5 space-y-0.5">
        {NAV_ITEMS.filter((item) => can(role, item.section)).map((item) => {
          const active = pathname === item.href || pathname?.startsWith(item.href + '/');
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                active ? 'bg-brand-600 text-white shadow-sm' : 'text-ink-300 hover:bg-white/5 hover:text-white'
              }`}
            >
              <Icon name={item.icon} size={18} strokeWidth={2} />
              <span className="truncate">{item.label}</span>
            </Link>
          );
        })}
      </nav>
      <div className="px-4 py-3 border-t border-white/10 text-[11px] text-ink-500">
        BTP Manager © {new Date().getFullYear()}
      </div>
    </div>
  );
}

import Link from 'next/link';
import type { LucideIcon } from 'lucide-react';

export function StatCard({
  label,
  value,
  icon: Icon,
  href,
  tone = 'default',
  hint,
}: {
  label: string;
  value: string | number;
  icon: LucideIcon;
  href?: string;
  tone?: 'default' | 'success' | 'warning' | 'danger' | 'brand';
  hint?: string;
}) {
  const tones: Record<string, string> = {
    default: 'bg-ink-100 text-ink-600',
    success: 'bg-emerald-100 text-emerald-600',
    warning: 'bg-amber-100 text-amber-600',
    danger: 'bg-rose-100 text-rose-600',
    brand: 'bg-brand-100 text-brand-700',
  };
  const content = (
    <div className="card p-4 sm:p-5 flex items-start gap-4 h-full hover:shadow-pop transition-shadow">
      <div className={`shrink-0 rounded-xl p-2.5 ${tones[tone]}`}>
        <Icon size={20} strokeWidth={2.2} />
      </div>
      <div className="min-w-0">
        <p className="text-xs font-semibold text-ink-500 uppercase tracking-wide truncate">{label}</p>
        <p className="text-xl sm:text-2xl font-bold text-ink-900 mt-0.5 truncate">{value}</p>
        {hint && <p className="text-xs text-ink-400 mt-0.5">{hint}</p>}
      </div>
    </div>
  );
  return href ? <Link href={href}>{content}</Link> : content;
}

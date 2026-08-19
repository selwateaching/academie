export function Badge({ label, className }: { label: string; className?: string }) {
  return <span className={`badge ${className ?? 'bg-slate-100 text-slate-700 border-slate-300'}`}>{label}</span>;
}

export function StatusBadge({ map, value }: { map: Record<string, { label: string; color: string }>; value: string }) {
  const item = map[value] ?? { label: value, color: 'bg-slate-100 text-slate-700 border-slate-300' };
  return <Badge label={item.label} className={item.color} />;
}

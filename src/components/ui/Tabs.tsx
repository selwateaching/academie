'use client';

import { useState } from 'react';

export function Tabs({ tabs }: { tabs: { label: string; content: React.ReactNode; count?: number }[] }) {
  const [active, setActive] = useState(0);
  return (
    <div>
      <div className="flex gap-1 overflow-x-auto border-b border-ink-200 mb-5 -mx-1 px-1">
        {tabs.map((t, i) => (
          <button
            key={t.label}
            onClick={() => setActive(i)}
            className={`shrink-0 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              active === i ? 'border-brand-600 text-brand-700' : 'border-transparent text-ink-500 hover:text-ink-800'
            }`}
          >
            {t.label}
            {typeof t.count === 'number' && <span className="ml-1.5 text-xs text-ink-400">({t.count})</span>}
          </button>
        ))}
      </div>
      <div>{tabs[active]?.content}</div>
    </div>
  );
}

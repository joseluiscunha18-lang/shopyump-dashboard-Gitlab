'use client';

import { Search } from 'lucide-react';
import type { Produto } from '@/types/database';

export function ProductSearchBar({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
  produtos: Produto[];
}) {
  return (
    <div className="relative">
      <div className="flex h-11 items-center gap-2.5 rounded-xl border border-[#1A1210]/15 bg-white px-3.5 shadow-[0_2px_6px_rgba(15,23,42,0.06)] transition-colors focus-within:border-ink">
        <Search size={16} strokeWidth={2.3} className="flex-shrink-0 text-slate-500" />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Procurar"
          className="h-full w-full min-w-0 bg-transparent text-[13px] font-semibold text-ink placeholder:text-slate-400 focus:outline-none"
        />
      </div>
    </div>
  );
}

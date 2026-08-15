'use client';

import { Search, SlidersHorizontal } from 'lucide-react';
import { cn } from '@/lib/cn';

export function ProductSearchBar({
  value,
  onChange,
  filtersOpen,
  onToggleFilters,
  activeFilterCount,
}: {
  value: string;
  onChange: (v: string) => void;
  filtersOpen: boolean;
  onToggleFilters: () => void;
  activeFilterCount: number;
}) {
  return (
    <div className="flex h-12 items-center gap-2 rounded-2xl border border-slate-200/80 bg-white pl-4 pr-2 shadow-[0_1px_2px_rgba(15,23,42,0.03)] transition-colors focus-within:border-ink/25 focus-within:ring-2 focus-within:ring-ink/[0.05]">
      <Search size={16} strokeWidth={2.2} className="flex-shrink-0 text-slate-400" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Pesquisar produtos..."
        className="h-full w-full min-w-0 bg-transparent text-[13px] font-semibold text-ink placeholder:text-slate-400 focus:outline-none"
      />
      <button
        type="button"
        onClick={onToggleFilters}
        aria-label="Filtros"
        className={cn(
          'relative flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl transition-colors',
          filtersOpen ? 'bg-ink text-white' : 'text-slate-400 hover:bg-slate-100 hover:text-ink',
        )}
      >
        <SlidersHorizontal size={15} strokeWidth={2.2} />
        {!filtersOpen && activeFilterCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-[15px] w-[15px] items-center justify-center rounded-full bg-brand text-[8.5px] font-black text-white ring-2 ring-white">
            {activeFilterCount}
          </span>
        )}
      </button>
    </div>
  );
}

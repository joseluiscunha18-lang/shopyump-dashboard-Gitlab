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
    <div className="flex h-11 items-center gap-2.5 overflow-hidden rounded-xl border border-transparent bg-muted px-3.5 transition-colors focus-within:border-border focus-within:bg-card [-webkit-tap-highlight-color:transparent]">
      <Search size={17} strokeWidth={1.8} className="shrink-0 text-muted-foreground" />
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Procurar produtos"
        aria-label="Procurar produtos"
        className="h-full w-full min-w-0 appearance-none border-0 bg-transparent text-[14px] font-medium text-foreground shadow-none outline-none ring-0 placeholder:text-muted-foreground focus:outline-none focus:ring-0 focus-visible:outline-none focus-visible:ring-0 [&::-webkit-search-cancel-button]:appearance-none [&::-webkit-search-decoration]:appearance-none"
      />
    </div>
  );
}

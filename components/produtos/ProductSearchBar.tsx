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
      {/* Sem caixa própria (sem borda/cantos arredondados) — é só uma linha
      dentro do card, com um traço fino por baixo a separar do resto, em vez
      de um "cartão dentro do cartão". */}
      <div className="flex h-10 items-center gap-2.5 border-b border-[#1A1210]/10 pb-3 transition-colors focus-within:border-ink">
        <Search size={16} strokeWidth={2.3} className="flex-shrink-0 text-[#1A1210]/55" />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Procurar"
          className="h-full w-full min-w-0 bg-transparent text-[13px] font-semibold text-ink placeholder:text-[#1A1210]/40 focus:outline-none"
        />
      </div>
    </div>
  );
}

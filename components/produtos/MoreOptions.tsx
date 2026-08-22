'use client';

import { useState } from 'react';
import { ChevronDown, SlidersHorizontal } from 'lucide-react';
import { Input, Textarea } from '@/components/ui/Input';
import type { ProdutoMaisOpcoes } from '@/types/database';
import { cn } from '@/lib/cn';

export function MoreOptions({
  value,
  onChange,
}: {
  value: Omit<ProdutoMaisOpcoes, 'peso'>;
  onChange: (v: Omit<ProdutoMaisOpcoes, 'peso'>) => void;
}) {
  const [open, setOpen] = useState(false);

  function set<K extends keyof Omit<ProdutoMaisOpcoes, 'peso'>>(key: K, v: ProdutoMaisOpcoes[K]) {
    onChange({ ...value, [key]: v });
  }

  return (
    <div className="overflow-hidden rounded-[18px] border border-[rgba(28,25,23,0.1)]">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between px-4 py-4 transition-colors hover:bg-[#FAFAF9]"
      >
        <span className="flex items-center gap-2.5 text-[14px] font-bold text-[#1C1917]">
          <SlidersHorizontal size={15} strokeWidth={2} className="text-[#A8A29E]" />
          Mais opções
        </span>
        <ChevronDown
          size={16}
          strokeWidth={2}
          className={cn('text-[#A8A29E] transition-transform duration-200', open && 'rotate-180')}
        />
      </button>

      {open && (
        <div className="flex flex-col gap-5 border-t border-[rgba(28,25,23,0.07)] bg-white px-4 py-5">
          <Input
            label="SKU"
            value={value.sku ?? ''}
            onChange={(e) => set('sku', e.target.value)}
            placeholder="Gerado automaticamente se deixares vazio"
          />
          <Textarea
            label="Informações de entrega"
            rows={3}
            value={value.infoEntrega ?? ''}
            onChange={(e) => set('infoEntrega', e.target.value)}
            placeholder="Ex: Envio em 2–3 dias úteis"
          />
        </div>
      )}
    </div>
  );
}

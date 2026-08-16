'use client';

import { useState } from 'react';
import { ChevronDown, Settings2 } from 'lucide-react';
import { Input, Textarea } from '@/components/ui/Input';
import type { ProdutoMaisOpcoes } from '@/types/database';
import { cn } from '@/lib/cn';

export function MoreOptions({
  value,
  onChange,
  hasVariants,
}: {
  value: ProdutoMaisOpcoes;
  onChange: (v: ProdutoMaisOpcoes) => void;
  /** Quando o produto tem variantes, o peso passa a viver em cada
   *  variante (StockSection) — deixa de fazer sentido pedir um peso
   *  padrão aqui, porque cada combinação tende a pesar diferente. */
  hasVariants: boolean;
}) {
  const [open, setOpen] = useState(false);

  function set<K extends keyof ProdutoMaisOpcoes>(key: K, v: ProdutoMaisOpcoes[K]) {
    onChange({ ...value, [key]: v });
  }

  return (
    <div className="rounded-2xl border border-slate-100">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between px-4 py-3.5"
      >
        <span className="flex items-center gap-2 text-[13px] font-black text-ink">
          <Settings2 size={15} className="text-slate-400" /> Mais opções
        </span>
        <ChevronDown size={16} className={cn('text-slate-400 transition-transform', open && 'rotate-180')} />
      </button>

      {open && (
        <div className="flex flex-col gap-4 border-t border-slate-100 px-4 py-4">
          <Input
            label="SKU"
            value={value.sku ?? ''}
            onChange={(e) => set('sku', e.target.value)}
            placeholder="Gerado automaticamente se deixares vazio"
          />
          {!hasVariants && (
            <Input
              label="Peso padrão (kg)"
              hint="Opcional"
              type="number"
              min={0}
              step="0.01"
              value={value.peso ?? ''}
              onChange={(e) => set('peso', e.target.value === '' ? null : Number(e.target.value))}
              placeholder="Opcional"
            />
          )}
          {hasVariants && (
            <p className="text-[10px] font-medium text-slate-400">
              Peso: define o peso de cada versão em "Versões disponíveis" mais abaixo.
            </p>
          )}
          <Textarea
            label="Informações de entrega"
            rows={3}
            value={value.infoEntrega ?? ''}
            onChange={(e) => set('infoEntrega', e.target.value)}
            placeholder="Ex: Envio em 2-3 dias úteis"
          />
        </div>
      )}
    </div>
  );
}

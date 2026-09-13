'use client';

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { Sheet } from '@/components/ui/Sheet';
import { cn } from '@/lib/cn';

/**
 * Painel contextual de Produtos — abre ao tocar na grelha de produtos na
 * pré-visualização. Só trata da APRESENTAÇÃO (nº de colunas); editar os
 * produtos em si continua em "Produtos" no menu principal — este atalho
 * evita o vendedor ter de sair e procurar.
 */
export function ProdutosSheet({
  open,
  onClose,
  colunas,
  onColunasChange,
}: {
  open: boolean;
  onClose: () => void;
  colunas: 2 | 3 | null;
  onColunasChange: (value: 2 | 3 | null) => void;
}) {
  return (
    <Sheet open={open} onClose={onClose} title="Produtos" subtitle="Como o catálogo aparece na loja" heightVh={50}>
      <div className="flex flex-col gap-6 pb-4">
        <div className="flex flex-col gap-2">
          <span className="text-[11px] font-black uppercase tracking-widest text-slate-500">Colunas</span>
          <div className="flex gap-2">
            {[
              { id: null, label: 'Padrão do tema' },
              { id: 2 as const, label: '2 colunas' },
              { id: 3 as const, label: '3 colunas' },
            ].map((opt) => (
              <button
                key={String(opt.id)}
                type="button"
                onClick={() => onColunasChange(opt.id)}
                className={cn(
                  'flex-1 rounded-[12px] border px-3 py-3 text-[12px] font-bold transition-colors',
                  colunas === opt.id ? 'border-[#111110] bg-[#F4F4F3] text-ink' : 'border-[#E5E3E0] text-slate-400'
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <Link
          href="/produtos"
          className="flex items-center justify-between rounded-[13px] border border-[#E5E3E0] px-4 py-3.5 text-[13px] font-bold text-ink"
        >
          Ver e editar produtos <ArrowRight size={16} />
        </Link>
      </div>
    </Sheet>
  );
}

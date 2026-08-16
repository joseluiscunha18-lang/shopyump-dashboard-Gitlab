'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { Switch } from '@/components/ui/Switch';
import { totalEstoque } from '@/lib/variantes';
import type { ProdutoCombinacao } from '@/types/database';
import { cn } from '@/lib/cn';

export function StockSection({
  hasVariants,
  combinacoes,
  onCombinacoesChange,
  estoqueSimples,
  onEstoqueSimplesChange,
  controlarEstoque,
  onControlarEstoqueChange,
  precoBase,
}: {
  hasVariants: boolean;
  combinacoes: ProdutoCombinacao[];
  onCombinacoesChange: (v: ProdutoCombinacao[]) => void;
  estoqueSimples: string;
  onEstoqueSimplesChange: (v: string) => void;
  controlarEstoque: boolean;
  onControlarEstoqueChange: (v: boolean) => void;
  precoBase: number;
}) {
  if (hasVariants) {
    return (
      <div>
        <div className="mb-2 flex items-center justify-between pl-1">
          <h3 className="text-[13px] font-black text-ink">Estoque por variante</h3>
          <span className="text-[11px] font-bold text-slate-400">
            {totalEstoque(combinacoes)} unidades no total
          </span>
        </div>
        <div className="flex flex-col gap-2">
          {combinacoes.map((c, i) => (
            <CombinacaoRow
              key={c.chave}
              combinacao={c}
              precoBase={precoBase}
              onChange={(next) => {
                const copy = [...combinacoes];
                copy[i] = next;
                onCombinacoesChange(copy);
              }}
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-2 flex items-center justify-between pl-1">
        <h3 className="text-[13px] font-black text-ink">Estoque</h3>
        <label className="flex items-center gap-2">
          <span className="text-[11px] font-semibold text-slate-400">Controlar estoque</span>
          <Switch checked={controlarEstoque} onChange={onControlarEstoqueChange} ariaLabel="Controlar estoque" size="sm" />
        </label>
      </div>
      {controlarEstoque && (
        <Input
          type="number"
          min={0}
          value={estoqueSimples}
          onChange={(e) => onEstoqueSimplesChange(e.target.value)}
          placeholder="0"
        />
      )}
      {!controlarEstoque && (
        <p className="pl-1 text-[11px] font-medium text-slate-400">
          O produto fica sempre disponível, sem limite de quantidade.
        </p>
      )}
    </div>
  );
}

function CombinacaoRow({
  combinacao,
  precoBase,
  onChange,
}: {
  combinacao: ProdutoCombinacao;
  precoBase: number;
  onChange: (c: ProdutoCombinacao) => void;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="rounded-2xl bg-slate-50/70 px-3.5 py-2.5">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="flex flex-1 items-center gap-1.5 text-left"
        >
          <ChevronDown size={13} className={cn('shrink-0 text-slate-400 transition-transform', expanded && 'rotate-180')} />
          <span className="truncate text-[12px] font-bold text-ink">{combinacao.chave}</span>
        </button>
        <input
          type="number"
          min={0}
          value={combinacao.estoque ?? ''}
          onChange={(e) =>
            onChange({ ...combinacao, estoque: e.target.value === '' ? null : Number(e.target.value) })
          }
          placeholder="0"
          className="h-9 w-20 shrink-0 rounded-xl border border-transparent bg-white px-3 text-right text-[13px] font-bold text-ink shadow-sm outline-none focus:border-ink focus:ring-2 focus:ring-ink/10"
        />
      </div>

      {expanded && (
        <div className="mt-2.5 border-t border-slate-200/70 pt-2.5">
          <label className="mb-1 block text-[10px] font-black uppercase tracking-widest text-slate-400">
            Preço desta variante
          </label>
          <div className="flex items-center gap-2">
            <input
              type="number"
              min={0}
              value={combinacao.preco ?? ''}
              onChange={(e) =>
                onChange({ ...combinacao, preco: e.target.value === '' ? null : Number(e.target.value) })
              }
              placeholder={String(precoBase || 0)}
              className="h-9 w-full rounded-xl border border-transparent bg-white px-3 text-[13px] font-bold text-ink shadow-sm outline-none focus:border-ink focus:ring-2 focus:ring-ink/10"
            />
            <span className="shrink-0 text-[11px] font-bold text-slate-400">MT</span>
          </div>
          <p className="mt-1.5 text-[10px] font-medium text-slate-400">
            Deixa em branco para usar o preço principal ({precoBase || 0} MT).
          </p>
        </div>
      )}
    </div>
  );
}

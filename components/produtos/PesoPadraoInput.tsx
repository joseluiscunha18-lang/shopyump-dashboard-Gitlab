'use client';

import { useEffect, useRef, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { kgParaUnidade, pesoParaKg } from '@/lib/peso';
import type { UnidadePeso } from '@/lib/peso';
import { cn } from '@/lib/cn';

/**
 * Peso padrão do produto — vive antes de "Opções do produto" porque é
 * usado automaticamente por todas as variantes (cada uma só precisa de um
 * valor próprio quando pesa mesmo diferente do padrão; ver o campo "Peso"
 * dentro de cada versão em StockSection).
 */
export function PesoPadraoInput({
  valor,
  unidade,
  onChangeValor,
  onChangeUnidade,
}: {
  /** Valor em texto, na unidade atual (não em kg) — mais simples para o input controlado. */
  valor: string;
  unidade: UnidadePeso;
  onChangeValor: (v: string) => void;
  onChangeUnidade: (u: UnidadePeso) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, [open]);

  function trocarUnidade(u: UnidadePeso) {
    setOpen(false);
    if (u === unidade) return;
    // Converte o valor já digitado para a nova unidade, para o vendedor
    // não perder o número ao trocar de unidade.
    if (valor.trim() !== '' && !Number.isNaN(Number(valor))) {
      const kg = pesoParaKg(Number(valor), unidade);
      onChangeValor(String(kgParaUnidade(kg, u)));
    }
    onChangeUnidade(u);
  }

  return (
    <div>
      <label className="mb-1.5 block pl-1 text-[11px] font-black uppercase tracking-widest text-slate-400">
        Peso padrão <span className="font-medium normal-case text-slate-300">— opcional</span>
      </label>
      <div className="flex items-center gap-2">
        <input
          type="number"
          min={0}
          step="0.01"
          inputMode="decimal"
          value={valor}
          onChange={(e) => onChangeValor(e.target.value)}
          placeholder="0"
          className="h-11 w-full min-w-0 flex-1 rounded-xl bg-slate-100 px-3.5 text-[13px] font-bold text-ink outline-none focus:ring-2 focus:ring-ink/10"
        />

        {/* Unidade — abre um cartão flutuante com as opções, igual ao
        padrão dos outros menus de ações do produto. */}
        <div ref={ref} className="relative shrink-0">
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-label="Escolher unidade do peso padrão"
            className="flex h-11 items-center gap-1 rounded-xl bg-slate-100 px-3 text-[12px] font-bold text-ink transition-colors hover:bg-slate-200/70"
          >
            {unidade}
            <ChevronDown size={13} className={cn('text-slate-400 transition-transform', open && 'rotate-180')} />
          </button>

          {open && (
            <div className="absolute right-0 top-full z-20 mt-1.5 w-16 overflow-hidden rounded-2xl border border-slate-100 bg-white p-1.5 shadow-[0_16px_40px_-14px_rgba(15,23,42,0.22)]">
              {(['g', 'kg', 'lb', 'oz'] as const).map((u) => (
                <button
                  key={u}
                  type="button"
                  onClick={() => trocarUnidade(u)}
                  className={cn(
                    'flex w-full items-center justify-center rounded-xl px-2 py-2 text-[12px] font-bold transition-colors',
                    unidade === u ? 'bg-ink text-white' : 'text-ink hover:bg-slate-50'
                  )}
                >
                  {u}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
      <p className="mt-1.5 pl-1 text-[10px] font-medium text-slate-400">
        Usado por todas as versões — dentro de uma versão dá para pôr um peso próprio só quando for diferente.
      </p>
    </div>
  );
}

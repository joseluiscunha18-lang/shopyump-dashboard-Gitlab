'use client';

import { useState } from 'react';
import { Eye, EyeOff, ChevronRight } from 'lucide-react';
import { ELEVATED_SURFACE } from '@/components/ui/Surfaces';
import { useToast } from '@/components/ui/Toast';
import { cn } from '@/lib/cn';

// Re-exporta para não quebrar imports existentes na page.tsx
export { resolvePagamentosCard, buildPagamentosBreakdown } from './resolvePagamentosCard';
export type { ResolvedPagamentosCard } from './resolvePagamentosCard';

interface PagamentosBreakdownItem {
  label: string;
  value: number;
}

interface PagamentosCardProps {
  amount: number;
  amountLabel: string;
  breakdown?: PagamentosBreakdownItem[];
  currencyLabel?: string;
  hint?: string;
}

function formatMoney(value: number): string {
  return new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value);
}

export function PagamentosCard({ amount, amountLabel, breakdown = [], currencyLabel = 'MZN', hint }: PagamentosCardProps) {
  const temBreakdown = breakdown.length > 0;
  const [amountVisible, setAmountVisible] = useState(true);
  const { show } = useToast();

  return (
    <div className="flex h-full flex-col">
      <div className={cn('flex flex-1 flex-col gap-4 rounded-[24px] p-5 sm:p-6', ELEVATED_SURFACE)}>

        {/* Cabeçalho: título + Ver detalhes */}
        <div className="flex items-center justify-between">
          <p className="text-[13px] font-black tracking-tight text-ink">Finanças</p>
          <button
            type="button"
            onClick={() => show('Detalhes financeiros em breve.')}
            className="flex items-center gap-0.5 text-[12px] font-semibold text-slate-400 transition-opacity hover:opacity-70 active:scale-[0.98]"
          >
            Ver detalhes
            <ChevronRight className="h-[13px] w-[13px]" strokeWidth={2.4} />
          </button>
        </div>

        {/* Saldo principal */}
        <div className="flex flex-col gap-1">
          <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-slate-400">{amountLabel}</p>
          <div className="flex items-center gap-2">
            <p className="font-display text-[28px] font-black leading-none tracking-tight text-ink sm:text-[30px]">
              {amountVisible ? (
                <>
                  {formatMoney(amount)}
                  <span className="ml-1 text-[15px] font-bold text-slate-400">{currencyLabel}</span>
                </>
              ) : (
                <span aria-hidden className="tracking-[0.15em] text-slate-300">
                  ••••••
                </span>
              )}
            </p>
            <button
              type="button"
              onClick={() => setAmountVisible((v) => !v)}
              aria-label={amountVisible ? 'Ocultar valor' : 'Mostrar valor'}
              aria-pressed={!amountVisible}
              className="flex h-6 w-6 items-center justify-center rounded-full text-slate-400 transition-colors hover:text-ink active:scale-95"
            >
              {amountVisible
                ? <Eye className="h-[16px] w-[16px]" strokeWidth={2.2} />
                : <EyeOff className="h-[16px] w-[16px]" strokeWidth={2.2} />}
            </button>
          </div>
        </div>

        {/* Breakdown por período */}
        {temBreakdown && (
          <div className="flex items-start border-t border-slate-100 pt-4">
            {breakdown.map((item, i) => (
              <div key={item.label} className={cn('flex flex-1 flex-col min-w-0', i > 0 && 'ml-3 border-l border-slate-100 pl-3')}>
                <p className="truncate text-[10.5px] font-semibold text-slate-400">{item.label}</p>
                <p className="truncate text-[13.5px] font-black tracking-tight text-ink">
                  {formatMoney(item.value)}
                  <span className="ml-0.5 text-[10px] font-bold text-slate-400"> {currencyLabel}</span>
                </p>
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
}

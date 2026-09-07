'use client';

import { useState } from 'react';
import { Eye, EyeOff, ChevronRight } from 'lucide-react';
import { ELEVATED_SURFACE } from '@/components/ui/Surfaces';
import { useToast } from '@/components/ui/Toast';
import { formatNumberDot } from '@/lib/format';
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

export function PagamentosCard({ amount, amountLabel, breakdown = [], currencyLabel = 'MT', hint }: PagamentosCardProps) {
  const temBreakdown = breakdown.length > 0;
  const [amountVisible, setAmountVisible] = useState(true);
  const { show } = useToast();

  return (
    <div className="flex h-full flex-col">
      <div className={cn('flex flex-1 flex-col justify-between rounded-[24px] p-5 sm:p-6', ELEVATED_SURFACE)}>
        <div className="flex flex-col gap-1">
          <p className="text-[12.5px] font-black tracking-tight text-ink">Finanças</p>

          <div className="mt-1.5 flex items-center gap-1.5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-slate-400">{amountLabel}</p>
            <button
              type="button"
              onClick={() => setAmountVisible((v) => !v)}
              aria-label={amountVisible ? 'Ocultar valor' : 'Mostrar valor'}
              aria-pressed={!amountVisible}
              className="flex h-5 w-5 items-center justify-center rounded-full text-slate-400 transition-colors hover:text-ink active:scale-95"
            >
              {amountVisible ? <Eye className="h-[15px] w-[15px]" strokeWidth={2.2} /> : <EyeOff className="h-[15px] w-[15px]" strokeWidth={2.2} />}
            </button>
          </div>

          <p className="font-display text-[26px] font-black leading-none tracking-tight text-ink sm:text-[28px]">
            {amountVisible ? (
              <>
                {formatNumberDot(amount)} <span className="text-[14px] font-bold text-slate-400">{currencyLabel}</span>
              </>
            ) : (
              <span aria-hidden className="tracking-[0.15em] text-slate-300">
                • • • • •
              </span>
            )}
          </p>
          {hint && <p className="text-[12.5px] font-semibold text-slate-400">{hint}</p>}
        </div>

        {temBreakdown && (
          <div className="mt-4 flex items-center border-t border-slate-100 pt-3.5">
            {breakdown.map((item, i) => (
              <div key={item.label} className={cn('flex flex-1 flex-col min-w-0', i > 0 && 'ml-3 border-l border-slate-100 pl-3')}>
                <p className="truncate text-[13.5px] font-black tracking-tight text-ink">
                  {formatNumberDot(item.value)} <span className="text-[10.5px] font-bold text-slate-400">{currencyLabel}</span>
                </p>
                <p className="truncate text-[10.5px] font-semibold text-slate-400">{item.label}</p>
              </div>
            ))}
          </div>
        )}

        <button
          type="button"
          onClick={() => show('Detalhes financeiros em breve.')}
          className="mt-3.5 flex items-center gap-0.5 self-start text-[12.5px] font-bold text-ink transition-opacity hover:opacity-70 active:scale-[0.98]"
        >
          Ver detalhes
          <ChevronRight className="h-[15px] w-[15px]" strokeWidth={2.4} />
        </button>
      </div>
    </div>
  );
}

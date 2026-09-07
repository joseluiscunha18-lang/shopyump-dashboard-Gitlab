'use client';

import { useState } from 'react';
import { Eye, EyeOff, ChevronRight } from 'lucide-react';
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

// Surface própria do card Finanças — fundo índigo muito claro derivado de
// #4F46E5, com sombra colorida suave e ring índigo quase invisível.
// Substitui ELEVATED_SURFACE (bg-white) só aqui; nenhum outro card muda.
const FINANCAS_SURFACE =
  'bg-[#EEF0FF] shadow-[0_1px_0_rgba(79,70,229,0.08),0_6px_13px_-6px_rgba(79,70,229,0.14),0_15px_22px_-16px_rgba(79,70,229,0.08)] ring-1 ring-[#4F46E5]/[0.10]';

export function PagamentosCard({ amount, amountLabel, breakdown = [], currencyLabel = 'MZN' }: PagamentosCardProps) {
  const temBreakdown = breakdown.length > 0;
  const [amountVisible, setAmountVisible] = useState(true);
  const { show } = useToast();

  return (
    <div className="flex h-full flex-col">
      <div className={cn('flex flex-1 flex-col gap-4 rounded-[24px] p-5 sm:p-6', FINANCAS_SURFACE)}>

        {/* Cabeçalho: título + Ver detalhes */}
        <div className="flex items-center justify-between">
          <p className="text-[13px] font-black tracking-tight text-[#1e1b4b]">Finanças</p>
          <button
            type="button"
            onClick={() => show('Detalhes financeiros em breve.')}
            className="flex items-center gap-0.5 text-[12px] font-semibold text-[#4F46E5] transition-opacity hover:opacity-70 active:scale-[0.98]"
          >
            Ver detalhes
            <ChevronRight className="h-[13px] w-[13px]" strokeWidth={2.4} />
          </button>
        </div>

        {/* Saldo principal */}
        <div className="flex flex-col gap-1">
          <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[#6d6aba]">{amountLabel}</p>
          <div className="flex items-center gap-2">
            <p className="font-display text-[28px] font-black leading-none tracking-tight text-[#1e1b4b] sm:text-[30px]">
              {amountVisible ? (
                <>
                  {formatMoney(amount)}
                  <span className="ml-1 text-[15px] font-bold text-[#6d6aba]">{currencyLabel}</span>
                </>
              ) : (
                <span aria-hidden className="tracking-[0.15em] text-[#a5b4fc]">
                  ••••••
                </span>
              )}
            </p>
            <button
              type="button"
              onClick={() => setAmountVisible((v) => !v)}
              aria-label={amountVisible ? 'Ocultar valor' : 'Mostrar valor'}
              aria-pressed={!amountVisible}
              className="flex h-6 w-6 items-center justify-center rounded-full text-[#4F46E5]/60 transition-colors hover:text-[#4F46E5] active:scale-95"
            >
              {amountVisible
                ? <Eye className="h-[16px] w-[16px]" strokeWidth={2.2} />
                : <EyeOff className="h-[16px] w-[16px]" strokeWidth={2.2} />}
            </button>
          </div>
        </div>

        {/* Breakdown por período */}
        {temBreakdown && (
          <div className="flex items-start border-t border-[#4F46E5]/[0.10] pt-4">
            {breakdown.map((item, i) => (
              <div key={item.label} className={cn('flex flex-1 flex-col min-w-0', i > 0 && 'ml-3 border-l border-[#4F46E5]/[0.10] pl-3')}>
                <p className="truncate text-[10.5px] font-semibold text-[#6d6aba]">{item.label}</p>
                <p className="truncate text-[13.5px] font-black tracking-tight text-[#1e1b4b]">
                  {formatMoney(item.value)}
                  <span className="ml-0.5 text-[10px] font-bold text-[#6d6aba]"> {currencyLabel}</span>
                </p>
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
}

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

/** Ondas decorativas — lado direito do card, meio da altura, longe do saldo. */
function WavesBackground() {
  return (
    <svg
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 h-full w-full"
      viewBox="0 0 420 220"
      preserveAspectRatio="xMidYMid slice"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Onda principal — curva suave da direita superior para direita inferior */}
      <path
        d="M 480 20 Q 420 80 430 120 Q 440 165 380 210"
        fill="none"
        stroke="rgba(255,255,255,0.08)"
        strokeWidth="65"
        strokeLinecap="round"
      />
      {/* Onda secundária — mais deslocada para fora, muito subtil */}
      <path
        d="M 510 10 Q 455 75 465 118 Q 475 165 415 215"
        fill="none"
        stroke="rgba(255,255,255,0.04)"
        strokeWidth="50"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function PagamentosCard({ amount, amountLabel, breakdown = [], currencyLabel = 'MZN' }: PagamentosCardProps) {
  const temBreakdown = breakdown.length > 0;
  const [amountVisible, setAmountVisible] = useState(true);
  const { show } = useToast();

  return (
    <div className="flex h-full flex-col">
      {/* Card dark com ondas */}
      <div
        className={cn(
          'relative flex flex-1 flex-col gap-4 overflow-hidden rounded-[22px] p-5 sm:p-6',
          // Gradiente: canto superior-esquerdo ligeiramente mais claro (azul-aço),
          // fundo escuro premium no inferior-direito. Nenhuma cor saturada — só
          // luminosidade, para dar profundidade sem virar degradê colorido.
          'bg-[linear-gradient(135deg,_#1e2d4a_0%,_#151f35_45%,_#0f1629_100%)]',
          // Sombra com leve toque índigo para "ancorar" o card no painel claro
          'shadow-[0_2px_0_rgba(79,70,229,0.07),0_8px_20px_-6px_rgba(15,22,41,0.32),0_22px_30px_-18px_rgba(15,22,41,0.20)]',
          'ring-1 ring-white/[0.09]',
        )}
      >
        {/* Ondas decorativas em background */}
        <WavesBackground />

        {/* Conteúdo acima das ondas */}
        <div className="relative z-10 flex flex-col gap-4">

          {/* Cabeçalho: título + Ver detalhes */}
          <div className="flex items-center justify-between">
            <p className="text-[14px] font-black tracking-tight text-white">Finanças</p>
            <button
              type="button"
              onClick={() => show('Detalhes financeiros em breve.')}
              className="flex items-center gap-0.5 text-[12px] font-semibold text-white/60 transition-opacity hover:opacity-75 active:scale-[0.98]"
            >
              Ver detalhes
              <ChevronRight className="h-[13px] w-[13px]" strokeWidth={2.4} />
            </button>
          </div>

          {/* Saldo principal */}
          <div className="flex flex-col gap-1">
            <p className="text-[10.5px] font-semibold uppercase tracking-[0.12em] text-white/65">
              {amountLabel}
            </p>
            <div className="flex items-center gap-2">
              <p className="font-display text-[30px] font-black leading-none tracking-tight text-white sm:text-[32px]">
                {amountVisible ? (
                  <>
                    {formatMoney(amount)}
                    <span className="ml-1.5 text-[15px] font-bold text-white/50">{currencyLabel}</span>
                  </>
                ) : (
                  <span aria-hidden className="tracking-[0.18em] text-white/55">
                    ••••••
                  </span>
                )}
              </p>
              <button
                type="button"
                onClick={() => setAmountVisible((v) => !v)}
                aria-label={amountVisible ? 'Ocultar valor' : 'Mostrar valor'}
                aria-pressed={!amountVisible}
                className="flex h-7 w-7 items-center justify-center rounded-full text-white/60 transition-colors hover:text-white/80 active:scale-95"
              >
                {amountVisible
                  ? <Eye className="h-[17px] w-[17px]" strokeWidth={2} />
                  : <EyeOff className="h-[17px] w-[17px]" strokeWidth={2} />}
              </button>
            </div>
          </div>

          {/* Breakdown por período */}
          {temBreakdown && (
            <div className="flex items-start border-t border-white/[0.18] pt-4">
              {breakdown.map((item, i) => (
                <div
                  key={item.label}
                  className={cn(
                    'flex flex-1 flex-col min-w-0',
                    i > 0 && 'ml-3 border-l border-white/[0.18] pl-3',
                  )}
                >
                  <p className="truncate text-[10.5px] font-semibold text-white/70">{item.label}</p>
                  <p className="truncate text-[13.5px] font-black tracking-tight text-white">
                    {formatMoney(item.value)}
                    <span className="ml-0.5 text-[10px] font-bold text-white/60"> {currencyLabel}</span>
                  </p>
                </div>
              ))}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

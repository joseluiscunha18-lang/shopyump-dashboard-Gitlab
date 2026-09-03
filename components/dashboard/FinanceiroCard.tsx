import { ELEVATED_SURFACE } from '@/components/ui/Surfaces';
import { formatNumberDot } from '@/lib/format';
import { cn } from '@/lib/cn';

interface FinanceiroCardProps {
  availableAmount: number;
  processingAmount: number;
  currencyLabel?: string;
}

/**
 * Módulo "Financeiro" para lojas com o gateway PRÓPRIO da Shopyump
 * (`storePayment.provider === 'shopyump' && connected`). Diferente do
 * Free sem canal financeiro (§10 — nunca mostrar saldo inventado), aqui
 * o dinheiro É de facto custodiado pela Shopyump, por isso "Disponível
 * para saque" e "Em processamento" são informação real, não uma
 * simulação de carteira bancária.
 */
export function FinanceiroCard({ availableAmount, processingAmount, currencyLabel = 'MT' }: FinanceiroCardProps) {
  return (
    <div>
      <h2 className="mb-3 px-1 text-[13px] font-bold uppercase tracking-[0.08em] text-slate-400">Financeiro</h2>

      <div className={cn('flex items-center rounded-[24px] p-5 sm:p-6', ELEVATED_SURFACE)}>
        <div className="flex-1">
          <p className="text-[11px] font-semibold text-slate-400">Disponível para saque</p>
          <p className="mt-0.5 text-[20px] font-black tracking-tight text-ink sm:text-[22px]">
            {formatNumberDot(availableAmount)} <span className="text-[12px] font-bold text-slate-400">{currencyLabel}</span>
          </p>
        </div>
        <div className="flex-1 border-l border-slate-100 pl-4">
          <p className="text-[11px] font-semibold text-slate-400">Em processamento</p>
          <p className="mt-0.5 text-[20px] font-black tracking-tight text-ink sm:text-[22px]">
            {formatNumberDot(processingAmount)} <span className="text-[12px] font-bold text-slate-400">{currencyLabel}</span>
          </p>
        </div>
      </div>
    </div>
  );
}

import { CreditCard } from 'lucide-react';
import { ELEVATED_SURFACE } from '@/components/ui/Surfaces';
import { formatNumberDot } from '@/lib/format';
import { cn } from '@/lib/cn';

interface PaymentsCardProps {
  confirmedAmount: number;
  paymentsCount: number;
  currencyLabel?: string;
}

/**
 * Módulo "Pagamentos" (§9 do pedido) — para lojas com gateway EXTERNO
 * (`storePayment.provider === 'external' && connected`). Mostra
 * atividade de pagamentos ("Confirmados"), nunca saldo Shopyump: o
 * dinheiro está no gateway do próprio vendedor, não custodiado por nós.
 * Por isso não há "Disponível" nem "Em processamento" aqui — só a
 * confirmação de que os pagamentos aconteceram.
 */
export function PaymentsCard({ confirmedAmount, paymentsCount, currencyLabel = 'MT' }: PaymentsCardProps) {
  return (
    <div>
      <h2 className="mb-3 px-1 text-[13px] font-bold uppercase tracking-[0.08em] text-slate-400">Pagamentos</h2>

      <div className={cn('flex items-center justify-between gap-3 rounded-[24px] p-5 sm:p-6', ELEVATED_SURFACE)}>
        <div className="flex items-start gap-3 min-w-0">
          <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#F5F3F0] text-slate-400">
            <CreditCard size={16} strokeWidth={2} />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-semibold text-slate-400">Confirmados</p>
            <p className="mt-0.5 truncate text-[20px] font-black tracking-tight text-ink sm:text-[22px]">
              {formatNumberDot(confirmedAmount)} <span className="text-[12px] font-bold text-slate-400">{currencyLabel}</span>
            </p>
            <p className="mt-1 text-[11.5px] font-medium text-slate-400">
              {paymentsCount} {paymentsCount === 1 ? 'pagamento' : 'pagamentos'}
            </p>
          </div>
        </div>

        {/* Sem <Link> ainda — página de pagamentos não existe nesta etapa. */}
        <span className="shrink-0 select-none text-[12px] font-semibold text-slate-400">Ver pagamentos →</span>
      </div>
    </div>
  );
}

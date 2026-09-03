import { Store, ShieldCheck, Wallet } from 'lucide-react';
import { ELEVATED_SURFACE, Badge } from '@/components/ui/Surfaces';
import { formatNumberDot } from '@/lib/format';
import { cn } from '@/lib/cn';

interface MarketplaceCardProps {
  salesAmount: number;
  protectedAmount: number;
  availableAmount: number;
  currencyLabel?: string;
}

/**
 * Módulo do Marketplace (§8 do pedido) — só deve ser renderizado pelo
 * chamador quando `marketplace.status === 'active'`. Propositalmente
 * distinto do StorePayment/FinanceiroCard: "Em proteção" (nunca "Em
 * processamento") é o termo específico do período de proteção do
 * Marketplace, e o layout em 3 blocos horizontais lembra um resumo de
 * operação, não um extrato bancário.
 */
export function MarketplaceCard({ salesAmount, protectedAmount, availableAmount, currencyLabel = 'MT' }: MarketplaceCardProps) {
  const itens = [
    { label: 'Vendas', valor: salesAmount, Icon: Store },
    { label: 'Em proteção', valor: protectedAmount, Icon: ShieldCheck },
    { label: 'Disponível para saque', valor: availableAmount, Icon: Wallet },
  ];

  return (
    <div>
      <div className="mb-3 flex items-center justify-between px-1">
        <h2 className="text-[13px] font-bold uppercase tracking-[0.08em] text-slate-400">Marketplace</h2>
        <Badge tone="success">Ativo</Badge>
      </div>

      <div className={cn('rounded-[24px] p-5 sm:p-6', ELEVATED_SURFACE)}>
        <div className="flex flex-col gap-4 sm:flex-row sm:gap-0">
          {itens.map(({ label, valor, Icon }, i) => (
            <div key={label} className={cn('flex flex-1 items-start gap-2.5', i > 0 && 'sm:border-l sm:border-slate-100 sm:pl-4')}>
              <Icon size={16} strokeWidth={2} className="mt-0.5 shrink-0 text-slate-300" />
              <div className="min-w-0">
                <p className="text-[11px] font-semibold leading-tight text-slate-400">{label}</p>
                <p className="mt-0.5 truncate text-[18px] font-black tracking-tight text-ink">
                  {formatNumberDot(valor)} <span className="text-[12px] font-bold text-slate-400">{currencyLabel}</span>
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

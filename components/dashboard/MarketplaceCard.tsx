import { ELEVATED_SURFACE, Badge } from '@/components/ui/Surfaces';
import { formatNumberDot } from '@/lib/format';
import { cn } from '@/lib/cn';

interface MarketplaceCardProps {
  protectedAmount: number;
  disputedAmount: number;
  refundedAmount: number;
  currencyLabel?: string;
}

/**
 * Módulo do Marketplace (§8 do pedido) — só deve ser renderizado pelo
 * chamador quando `marketplace.status === 'active'`.
 *
 * Estrutura hero+breakdown, espelhada na do PagamentosCard (mesmo
 * padding, raio, `ELEVATED_SURFACE`) — os dois cards vivem lado a lado
 * no mesmo carrossel (ver HomeCardCarousel) e precisam de ter a MESMA
 * altura e a mesma hierarquia visual.
 *
 * "Em proteção" é o hero (dinheiro vendido mas ainda retido — §7);
 * "Em disputa" e "Em reembolso" ficam no breakdown por baixo — são as
 * duas formas de esse dinheiro retido ficar ainda mais travado
 * (reclamação em aberto vs. devolução já em curso). Nenhum dos três
 * entra no "Disponível para saque" do card Pagamentos — só
 * `availableAmount` entra ali (ver `resolvePagamentosCard` em
 * PagamentosCard.tsx) — por isso não aparece mais aqui, para não
 * mostrar o mesmo saldo sacável duas vezes.
 *
 * `h-full`/`flex-1`/`justify-between` só existem para este card
 * acompanhar a altura do vizinho no carrossel sem aumentar fonte nem
 * inventar espaçamento — o espaço extra vai sempre para o respiro entre
 * o hero e o breakdown.
 */
export function MarketplaceCard({ protectedAmount, disputedAmount, refundedAmount, currencyLabel = 'MT' }: MarketplaceCardProps) {
  const breakdown = [
    { label: 'Em disputa', valor: disputedAmount },
    { label: 'Em reembolso', valor: refundedAmount },
  ];

  return (
    <div className="flex h-full flex-col">
      <div className="mb-3 flex items-center justify-between px-1">
        <h2 className="text-[13px] font-bold uppercase tracking-[0.08em] text-slate-400">Marketplace</h2>
        <Badge tone="success">Ativo</Badge>
      </div>

      <div className={cn('flex flex-1 flex-col justify-between rounded-[24px] p-5 sm:p-6', ELEVATED_SURFACE)}>
        <div className="flex flex-col gap-1">
          <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-slate-400">Em proteção</p>
          <p className="font-display text-[26px] font-black leading-none tracking-tight text-ink sm:text-[28px]">
            {formatNumberDot(protectedAmount)} <span className="text-[14px] font-bold text-slate-400">{currencyLabel}</span>
          </p>
        </div>

        <div className="mt-4 flex items-center border-t border-slate-100 pt-3.5">
          {breakdown.map((item, i) => (
            <div key={item.label} className={cn('flex flex-1 flex-col min-w-0', i > 0 && 'ml-3 border-l border-slate-100 pl-3')}>
              <p className="truncate text-[13.5px] font-black tracking-tight text-ink">
                {formatNumberDot(item.valor)} <span className="text-[10.5px] font-bold text-slate-400">{currencyLabel}</span>
              </p>
              <p className="truncate text-[10.5px] font-semibold text-slate-400">{item.label}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

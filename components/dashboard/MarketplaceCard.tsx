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
 * chamador quando `marketplace.status === 'active'`.
 *
 * Estrutura interna deliberadamente ESPELHADA na do PagamentosCard
 * (mesmo padding, raio, `ELEVATED_SURFACE`, e a mesma hierarquia
 * hero+breakdown: um número em destaque em cima, blocos secundários em
 * baixo separados por `border-t`) — os dois cards vivem lado a lado no
 * mesmo carrossel (ver HomeCardCarousel) e precisam de parecer um único
 * sistema desenhado em conjunto, com a MESMA altura, em vez de dois
 * desenhos diferentes a competir. "Disponível para saque" (a parte já
 * liberada — o mesmo valor que entra no saldo Shopyump combinado, ver
 * `resolvePagamentosCard`) é o número mais acionável para o vendedor,
 * por isso é o que fica em destaque; Vendas e Em proteção continuam a
 * existir tal e qual, só que como breakdown secundário por baixo — a
 * mesma leitura de antes (3 valores, nenhum escondido), só reorganizada
 * para ter o mesmo peso visual do Pagamentos. `h-full`/`flex-1`/
 * `justify-between` só existem para o card esticar com o vizinho sem
 * aumentar fonte nem inventar espaçamento — o espaço extra vai sempre
 * para o respiro entre o hero e o breakdown.
 */
export function MarketplaceCard({ salesAmount, protectedAmount, availableAmount, currencyLabel = 'MT' }: MarketplaceCardProps) {
  const breakdown = [
    { label: 'Vendas', valor: salesAmount },
    { label: 'Em proteção', valor: protectedAmount },
  ];

  return (
    <div className="flex h-full flex-col">
      <div className="mb-3 flex items-center justify-between px-1">
        <h2 className="text-[13px] font-bold uppercase tracking-[0.08em] text-slate-400">Marketplace</h2>
        <Badge tone="success">Ativo</Badge>
      </div>

      <div className={cn('flex flex-1 flex-col justify-between rounded-[24px] p-5 sm:p-6', ELEVATED_SURFACE)}>
        <div className="flex flex-col gap-1">
          <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-slate-400">Disponível para saque</p>
          <p className="font-display text-[26px] font-black leading-none tracking-tight text-ink sm:text-[28px]">
            {formatNumberDot(availableAmount)} <span className="text-[14px] font-bold text-slate-400">{currencyLabel}</span>
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

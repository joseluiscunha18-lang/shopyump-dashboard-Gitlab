import { ELEVATED_SURFACE, Badge } from '@/components/ui/Surfaces';
import { formatNumberDot } from '@/lib/format';
import { cn } from '@/lib/cn';

interface MarketplaceCardProps {
  protectedAmount: number;
  disputedAmount: number;
  currencyLabel?: string;
}

/**
 * Módulo do Marketplace (§8 do pedido) — só deve ser renderizado pelo
 * chamador quando `marketplace.status === 'active'`.
 *
 * Conteúdo reduzido, de propósito, a só duas linhas — "Em proteção" e
 * "Em disputa" — no mesmo formato "valor · rótulo" já usado noutros
 * sítios do produto (ver ProductRow.tsx: "{preço} MZN · {categoria}").
 * "Vendas" e "Disponível para saque" deixaram de aparecer aqui: o
 * primeiro nunca teve ação nenhuma associada, e o segundo já vive
 * combinado no card Pagamentos (ver `resolvePagamentosCard` em
 * PagamentosCard.tsx, que soma `marketplace.availableAmount` lá) — não
 * fazia sentido mostrar o mesmo "disponível para saque" duas vezes. Os
 * dois valores que sobram aqui são exatamente os que só fazem sentido
 * dentro do Marketplace: dinheiro ainda retido (proteção) e dinheiro
 * contestado por um comprador (disputa) — nenhum dos dois é saldo
 * sacável, por isso não pertencem ao Pagamentos.
 *
 * `h-full`/`flex-1`/`justify-center` continuam a existir só para este
 * card acompanhar a altura do vizinho no carrossel (ver
 * HomeCardCarousel) sem aumentar a fonte nem inventar espaçamento — com
 * menos conteúdo do que o Pagamentos, o espaço extra vira respiro
 * vertical entre as duas linhas, nunca texto maior.
 */
export function MarketplaceCard({ protectedAmount, disputedAmount, currencyLabel = 'MT' }: MarketplaceCardProps) {
  const itens = [
    { label: 'Em proteção', valor: protectedAmount },
    { label: 'Em disputa', valor: disputedAmount },
  ];

  return (
    <div className="flex h-full flex-col">
      <div className="mb-3 flex items-center justify-between px-1">
        <h2 className="text-[13px] font-bold uppercase tracking-[0.08em] text-slate-400">Marketplace</h2>
        <Badge tone="success">Ativo</Badge>
      </div>

      <div className={cn('flex flex-1 flex-col justify-center gap-3 rounded-[24px] p-5 sm:p-6', ELEVATED_SURFACE)}>
        {itens.map((item) => (
          <p key={item.label} className="truncate text-[16px] font-black tracking-tight text-ink sm:text-[17px]">
            {formatNumberDot(item.valor)} <span className="font-bold text-slate-400">{currencyLabel}</span>{' '}
            <span className="font-semibold text-slate-400">· {item.label}</span>
          </p>
        ))}
      </div>
    </div>
  );
}

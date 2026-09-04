import { ELEVATED_SURFACE } from '@/components/ui/Surfaces';
import { formatNumberDot } from '@/lib/format';
import { cn } from '@/lib/cn';

interface PagamentosBreakdownItem {
  label: string;
  value: number;
}

interface PagamentosCardProps {
  /**
   * Número principal do card. O que ele significa muda conforme o
   * gateway — quem monta o card decide, este componente só desenha:
   * "Vendas este mês" no gateway externo (a Shopyump não custodia esse
   * dinheiro, só confirma que entrou), "Disponível para saque" no
   * gateway Shopyump (esse sim é saldo real, custodiado por nós).
   */
  amount: number;
  amountLabel: string;
  /**
   * "Hoje" / "Ontem" / "Este mês" — de 0 a 3 itens, nesta ordem. NUNCA
   * preencher um item sem dado real só para completar 3 colunas: o
   * card desenha 1, 2 ou 3 blocos e mantém o mesmo espaçamento/altura
   * em qualquer um dos casos (ver `buildPagamentosBreakdown` abaixo).
   * Com 0 itens, a linha inteira some — o número principal continua
   * sozinho, sem inventar nada por baixo.
   */
  breakdown?: PagamentosBreakdownItem[];
  currencyLabel?: string;
}

/**
 * Card "Pagamentos" — uma ÚNICA estrutura visual para os dois tipos de
 * gateway de loja própria (externo e Shopyump). O layout nunca muda de
 * forma nem de altura entre eles; só o conteúdo (número principal +
 * label + quantos blocos de período existem) se adapta. Ver
 * MarketplaceCard para o módulo equivalente do Marketplace, que tem
 * semântica própria (Vendas/Em proteção/Disponível) e não usa este
 * componente.
 */
export function PagamentosCard({ amount, amountLabel, breakdown = [], currencyLabel = 'MT' }: PagamentosCardProps) {
  const temBreakdown = breakdown.length > 0;

  return (
    <div>
      <h2 className="mb-3 px-1 text-[13px] font-bold uppercase tracking-[0.08em] text-slate-400">Pagamentos</h2>

      <div className={cn('rounded-[24px] p-5 sm:p-6', ELEVATED_SURFACE)}>
        <div className="flex flex-col gap-1">
          <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-slate-400">{amountLabel}</p>
          <p className="font-display text-[26px] font-black leading-none tracking-tight text-ink sm:text-[28px]">
            {formatNumberDot(amount)} <span className="text-[14px] font-bold text-slate-400">{currencyLabel}</span>
          </p>
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
      </div>
    </div>
  );
}

interface PagamentosBreakdownSource {
  salesToday?: number;
  salesYesterday?: number;
  salesThisMonth?: number;
}

/**
 * Monta o array "Hoje/Ontem/Este mês" a partir dos campos opcionais do
 * gateway (ver MockStorePaymentState), pulando qualquer período sem
 * dado real — nunca inventa um valor só para preencher as 3 colunas.
 * Colocado aqui (e não só no mock) porque é exatamente a mesma regra
 * que a fonte de dados real vai seguir quando o gateway existir de
 * facto: um adaptador, não lógica de mock.
 */
export function buildPagamentosBreakdown(source: PagamentosBreakdownSource): PagamentosBreakdownItem[] {
  const itens: PagamentosBreakdownItem[] = [];
  if (source.salesToday !== undefined) itens.push({ label: 'Hoje', value: source.salesToday });
  if (source.salesYesterday !== undefined) itens.push({ label: 'Ontem', value: source.salesYesterday });
  if (source.salesThisMonth !== undefined) itens.push({ label: 'Este mês', value: source.salesThisMonth });
  return itens;
}

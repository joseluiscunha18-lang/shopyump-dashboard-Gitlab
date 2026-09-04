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
 * Card "Pagamentos" — uma ÚNICA estrutura visual para qualquer
 * combinação de gateway (externo ou Shopyump) e Marketplace. O layout
 * nunca muda de forma nem de altura entre os casos; só o conteúdo
 * (número principal + label + quantos blocos de período existem) se
 * adapta — ver `resolvePagamentosCard` abaixo, que decide esse conteúdo
 * a partir do gateway/Marketplace da loja. Ver MarketplaceCard para o
 * módulo equivalente do Marketplace com semântica própria (Vendas/Em
 * proteção/Disponível), que continua a existir separadamente e NÃO usa
 * este componente.
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
 * Monta o array "Hoje/Ontem/Este mês" a partir de campos opcionais já
 * combinados (ver `resolvePagamentosCard`), pulando qualquer período
 * sem dado real — nunca inventa um valor só para preencher as 3
 * colunas.
 */
export function buildPagamentosBreakdown(source: PagamentosBreakdownSource): PagamentosBreakdownItem[] {
  const itens: PagamentosBreakdownItem[] = [];
  if (source.salesToday !== undefined) itens.push({ label: 'Hoje', value: source.salesToday });
  if (source.salesYesterday !== undefined) itens.push({ label: 'Ontem', value: source.salesYesterday });
  if (source.salesThisMonth !== undefined) itens.push({ label: 'Este mês', value: source.salesThisMonth });
  return itens;
}

interface StorePaymentSource {
  provider: 'none' | 'shopyump' | 'external';
  connected: boolean;
  /** Só usado quando provider === 'shopyump' — ver §7/§8 da spec original. */
  availableAmount: number;
  salesToday?: number;
  salesYesterday?: number;
  salesThisMonth?: number;
}

interface MarketplaceSource {
  status: string;
  /** Só a parte já liberada entra no saldo — "Em proteção" nunca conta aqui. */
  availableAmount: number;
  /** Tratado como a contribuição de "Este mês" desse canal. */
  salesAmount: number;
  salesToday?: number;
  salesYesterday?: number;
}

export interface ResolvedPagamentosCard {
  amount: number;
  amountLabel: string;
  breakdown: PagamentosBreakdownItem[];
}

function somarDefinidos(...valores: Array<number | undefined>): number | undefined {
  const definidos = valores.filter((v): v is number => v !== undefined);
  if (definidos.length === 0) return undefined;
  return definidos.reduce((total, v) => total + v, 0);
}

/**
 * Decide TUDO que o card Pagamentos precisa mostrar — número principal,
 * o que ele significa, e a quebra Hoje/Ontem/Este mês — a partir do
 * gateway da loja e do Marketplace. `null` quando não há nenhum canal
 * financeiro confirmado (Free, ou pago sem gateway e sem Marketplace):
 * nesse caso o card nem deve ser renderizado.
 *
 * Este `null`/não-`null` é também o único critério para decidir a
 * ordem da Home: sempre que há Marketplace ativo OU gateway (externo
 * ou Shopyump) — em qualquer combinação, independentemente do plano
 * ser grátis ou pago — este método devolve um valor, e nesse caso o
 * "Resumo" (Pedidos/Visitas) deixa de aparecer e o Pagamentos passa a
 * ser o card principal, exibido em primeiro lugar (ver /dev/cenarios).
 *
 * Regras (ver pedido "NOVA LÓGICA DO CARD FINANCEIRO DA HOME"):
 * - Dinheiro em gateway EXTERNO nunca entra no saldo Shopyump — o
 *   vendedor saca direto lá. Sozinho, vira "Vendas este mês".
 * - Gateway Shopyump e/ou Marketplace (só a parte já liberada, nunca
 *   "Em proteção"/bloqueado/em disputa) somam para virar "Disponível
 *   para saque" — esse é o único dinheiro que a Shopyump de facto
 *   controla e o vendedor pode sacar agora.
 * - Ter QUALQUER saldo Shopyump (mesmo 0, se o canal está genuinamente
 *   ligado) tem prioridade sobre mostrar "Vendas este mês" — é a leitura
 *   mais completa da situação financeira do vendedor.
 * - Hoje/Ontem/Este mês são SEMPRE vendas (nunca saldo), somadas de
 *   todos os canais que a Shopyump consegue registar — gateway da loja
 *   (externo ou Shopyump) + Marketplace — independentemente de qual
 *   deles decide o número principal.
 */
export function resolvePagamentosCard(
  storePayment: StorePaymentSource,
  marketplace: MarketplaceSource
): ResolvedPagamentosCard | null {
  const gatewayShopyumpAtivo = storePayment.provider === 'shopyump' && storePayment.connected;
  const gatewayExternoAtivo = storePayment.provider === 'external' && storePayment.connected;
  const marketplaceAtivo = marketplace.status === 'active';
  const temSaldoShopyump = gatewayShopyumpAtivo || marketplaceAtivo;

  // "Este mês" combina o gateway da própria loja (seja qual for) com o
  // Marketplace — são vendas, e a Shopyump regista as duas coisas.
  const breakdown = buildPagamentosBreakdown({
    salesToday: somarDefinidos(
      gatewayShopyumpAtivo || gatewayExternoAtivo ? storePayment.salesToday : undefined,
      marketplaceAtivo ? marketplace.salesToday : undefined
    ),
    salesYesterday: somarDefinidos(
      gatewayShopyumpAtivo || gatewayExternoAtivo ? storePayment.salesYesterday : undefined,
      marketplaceAtivo ? marketplace.salesYesterday : undefined
    ),
    salesThisMonth: somarDefinidos(
      gatewayShopyumpAtivo || gatewayExternoAtivo ? storePayment.salesThisMonth : undefined,
      marketplaceAtivo ? marketplace.salesAmount : undefined
    ),
  });

  if (temSaldoShopyump) {
    const saldoGateway = gatewayShopyumpAtivo ? storePayment.availableAmount : 0;
    const saldoMarketplace = marketplaceAtivo ? marketplace.availableAmount : 0;
    return { amount: saldoGateway + saldoMarketplace, amountLabel: 'Disponível para saque', breakdown };
  }

  if (gatewayExternoAtivo) {
    return { amount: storePayment.salesThisMonth ?? 0, amountLabel: 'Vendas este mês', breakdown };
  }

  return null;
}

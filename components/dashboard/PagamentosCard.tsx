'use client';

import { useState } from 'react';
import { Eye, EyeOff, ChevronRight } from 'lucide-react';
import { ELEVATED_SURFACE } from '@/components/ui/Surfaces';
import { useToast } from '@/components/ui/Toast';
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
  /**
   * Mensagem discreta mostrada só no estado "ainda sem nenhum canal
   * financeiro confirmado" (ver `resolvePagamentosCard`): o vendedor
   * ainda não ligou gateway nem tem Marketplace ativo, por isso o
   * "Disponível para saque" está a zeros por não haver mesmo nada para
   * mostrar ainda — e não porque algo esteja em falta ou quebrado. Fica
   * por baixo do número principal, discreta (mesmo peso visual do
   * breakdown), nunca como aviso/erro.
   */
  hint?: string;
}

/**
 * Card "Finanças" (rótulo interno; o único card financeiro da Home
 * enquanto o Marketplace não estiver ativo — ver HomeCardCarousel, que
 * já devolve este card sozinho, sem chrome de carrossel, quando é o
 * único filho). Estrutura ÚNICA para qualquer combinação de gateway
 * (externo ou Shopyump) e Marketplace: o layout nunca muda de forma nem
 * de altura entre os casos; só o conteúdo (número principal + label +
 * quantos blocos de período existem) se adapta — ver
 * `resolvePagamentosCard` abaixo, que decide esse conteúdo a partir do
 * gateway/Marketplace da loja. Ver MarketplaceCard para o módulo
 * equivalente do Marketplace com semântica própria (Vendas/Em
 * proteção/Disponível), que continua a existir separadamente e NÃO usa
 * este componente — mas partilha deliberadamente a mesma hierarquia
 * hero+breakdown, padding e raio, porque os dois vivem lado a lado no
 * mesmo carrossel (ver HomeCardCarousel) quando o Marketplace está
 * ativo, e precisam de ter exatamente a mesma altura. `h-full`/`flex-1`
 * aqui servem só para isso: quando o carrossel esticar este card para
 * acompanhar a altura do vizinho, o espaço extra vai sempre para o
 * `justify-between` interno (nunca para aumentar a fonte ou inventar
 * espaçamento à parte).
 *
 * "Finanças" é o título do PRÓPRIO card (primeira linha lá dentro), não
 * um heading solto acima dele — evita repetir hierarquia (heading fora
 * + hero dentro) para uma única peça de informação. O olho ao lado do
 * `amountLabel` esconde/revela só o número principal (nunca o
 * breakdown) — estado puramente local, começa sempre visível. "Ver
 * detalhes →" fica no fundo do MESMO card, nunca como link separado por
 * fora.
 */
export function PagamentosCard({ amount, amountLabel, breakdown = [], currencyLabel = 'MT', hint }: PagamentosCardProps) {
  const temBreakdown = breakdown.length > 0;
  const [amountVisible, setAmountVisible] = useState(true);
  const { show } = useToast();

  return (
    <div className="flex h-full flex-col">
      <div className={cn('flex flex-1 flex-col justify-between rounded-[24px] p-5 sm:p-6', ELEVATED_SURFACE)}>
        <div className="flex flex-col gap-1">
          <p className="text-[12.5px] font-black tracking-tight text-ink">Finanças</p>

          <div className="mt-1.5 flex items-center gap-1.5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-slate-400">{amountLabel}</p>
            <button
              type="button"
              onClick={() => setAmountVisible((v) => !v)}
              aria-label={amountVisible ? 'Ocultar valor' : 'Mostrar valor'}
              aria-pressed={!amountVisible}
              className="flex h-5 w-5 items-center justify-center rounded-full text-slate-400 transition-colors hover:text-ink active:scale-95"
            >
              {amountVisible ? <Eye className="h-[15px] w-[15px]" strokeWidth={2.2} /> : <EyeOff className="h-[15px] w-[15px]" strokeWidth={2.2} />}
            </button>
          </div>

          <p className="font-display text-[26px] font-black leading-none tracking-tight text-ink sm:text-[28px]">
            {amountVisible ? (
              <>
                {formatNumberDot(amount)} <span className="text-[14px] font-bold text-slate-400">{currencyLabel}</span>
              </>
            ) : (
              <span aria-hidden className="tracking-[0.15em] text-slate-300">
                • • • • •
              </span>
            )}
          </p>
          {hint && <p className="text-[12.5px] font-semibold text-slate-400">{hint}</p>}
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

        <button
          type="button"
          onClick={() => show('Detalhes financeiros em breve.')}
          className="mt-3.5 flex items-center gap-0.5 self-start text-[12.5px] font-bold text-ink transition-opacity hover:opacity-70 active:scale-[0.98]"
        >
          Ver detalhes
          <ChevronRight className="h-[15px] w-[15px]" strokeWidth={2.4} />
        </button>
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
  /** Ver o campo homónimo em `PagamentosCardProps`. Só preenchido no
   *  estado "nenhum canal financeiro confirmado ainda". */
  hint?: string;
}

function somarDefinidos(...valores: Array<number | undefined>): number | undefined {
  const definidos = valores.filter((v): v is number => v !== undefined);
  if (definidos.length === 0) return undefined;
  return definidos.reduce((total, v) => total + v, 0);
}

/**
 * Decide TUDO que o card Pagamentos precisa mostrar — número principal,
 * o que ele significa, a quebra Hoje/Ontem/Este mês e, quando é caso
 * disso, a mensagem de configuração — a partir do gateway da loja e do
 * Marketplace.
 *
 * Pagamentos é SEMPRE o card principal da Home agora, mesmo quando não
 * há nenhum canal financeiro confirmado (Free, ou pago sem gateway e
 * sem Marketplace) — esta função já não devolve `null` para esse caso.
 * Em vez de esconder o card, mostra "Disponível para saque" a 0 MT com
 * `hint` a convidar o vendedor a configurar um método de pagamento (ver
 * PagamentosCardProps.hint). Quem monta a página decide, à parte, se
 * mostra a secção complementar "Resumo da loja" por baixo (ver
 * ResumoLojaSecao) — isso acontece sempre que `storePayment.provider
 * === 'none'`, com ou sem Marketplace ativo (ver /dev/cenarios).
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
 * - Sem nenhum canal confirmado, Hoje/Ontem/Este mês aparecem a 0 MT
 *   (nunca escondidos): é o mesmo "shape" do card já pronto, só à
 *   espera de dados reais assim que o vendedor configurar pagamentos.
 */
export function resolvePagamentosCard(
  storePayment: StorePaymentSource,
  marketplace: MarketplaceSource
): ResolvedPagamentosCard {
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

  // Nenhum canal financeiro confirmado ainda (nem gateway, nem
  // Marketplace) — em vez de esconder o card, mostra-o já na forma
  // final ("Disponível para saque"), só que a zeros, com uma indicação
  // discreta do que falta fazer. Hoje/Ontem/Este mês entram a 0 MT de
  // propósito aqui (ver docstring acima) — é o único ponto do ficheiro
  // onde isso é intencional, ao contrário de `buildPagamentosBreakdown`
  // que nunca inventa um período sem dado real.
  return {
    amount: 0,
    amountLabel: 'Disponível para saque',
    breakdown: buildPagamentosBreakdown({ salesToday: 0, salesYesterday: 0, salesThisMonth: 0 }),
    hint: 'Configure pagamentos para começar a receber',
  };
}

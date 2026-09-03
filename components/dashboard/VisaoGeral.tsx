import { Package, Eye, ShoppingBag, TrendingUp, TrendingDown } from 'lucide-react';
import { ELEVATED_SURFACE } from '@/components/ui/Surfaces';
import { formatNumberDot, formatSignedPercent } from '@/lib/format';
import { cn } from '@/lib/cn';

interface VisaoGeralProps {
  salesAmount: number;
  /** Omitido (ou 0) quando ainda não há uma base de comparação — a
   *  pastilha de crescimento simplesmente não aparece, em vez de mostrar
   *  "+0,0%" sem significado (ver Home real: ainda não temos histórico
   *  mês-a-mês, então este prop fica de fora até essa lógica existir). */
  growthPercent?: number;
  productsCount: number;
  visits: number;
  ordersCount: number;
  currencyLabel?: string;
}

/**
 * "Visão geral" — substitui o antigo StoreSummaryBar ("Resumo da loja").
 *
 * É a base sobre a qual o resto do Home financeiro (Marketplace, gateway
 * próprio, pagamentos externos — ver MarketplaceCard/PaymentsCard/
 * FinanceiroCard) se vai empilhar por baixo, um módulo de cada vez,
 * conforme a loja ganha atividade real. Este componente em si NUNCA
 * mostra saldo/carteira — só "Vendas" (valor de pedidos) e os três
 * indicadores operacionais, que são sempre seguros de mostrar
 * independentemente do plano ou de haver canal financeiro ligado.
 *
 * `salesAmount === 0` é tratado como o estado "loja sem vendas ainda":
 * em vez de um bloco vazio ou "0 MT", mostra-se a frase "Ainda não há
 * vendas" — mais honesto e menos "carteira zerada" do que um número.
 */
export function VisaoGeral({
  salesAmount,
  growthPercent,
  productsCount,
  visits,
  ordersCount,
  currencyLabel = 'MT',
}: VisaoGeralProps) {
  const temVendas = salesAmount > 0;
  const mostrarCrescimento = temVendas && !!growthPercent;
  const crescimentoPositivo = (growthPercent ?? 0) >= 0;
  const GrowthIcon = crescimentoPositivo ? TrendingUp : TrendingDown;

  const metricas = [
    { label: 'Produtos', valor: productsCount, Icon: Package },
    { label: 'Visitas', valor: visits, Icon: Eye },
    { label: 'Pedidos', valor: ordersCount, Icon: ShoppingBag },
  ];

  return (
    <div>
      <h2 className="mb-3 px-1 text-[13px] font-bold uppercase tracking-[0.08em] text-slate-400">Visão geral</h2>

      <div className={cn('rounded-[24px] p-5 sm:p-6', ELEVATED_SURFACE)}>
        {temVendas ? (
          <div className="flex flex-col gap-1.5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-slate-400">Vendas</p>
            <div className="flex flex-wrap items-baseline gap-x-2.5 gap-y-1.5">
              <p className="font-display text-[32px] font-black leading-none tracking-tight text-ink sm:text-[36px]">
                {formatNumberDot(salesAmount)}
                <span className="ml-1.5 text-[16px] font-bold text-slate-400 sm:text-[18px]">{currencyLabel}</span>
              </p>
              {mostrarCrescimento && (
                <span
                  className={cn(
                    'inline-flex items-center gap-1 rounded-full px-2 py-[3px] text-[12px] font-bold leading-none',
                    crescimentoPositivo ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'
                  )}
                >
                  <GrowthIcon size={12} strokeWidth={2.75} />
                  {formatSignedPercent(growthPercent as number)}
                </span>
              )}
            </div>
            {mostrarCrescimento && <p className="text-[11.5px] font-medium text-slate-400">vs. mês anterior</p>}
          </div>
        ) : (
          <div className="flex flex-col gap-1">
            <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-slate-400">Vendas</p>
            <p className="text-[17px] font-bold leading-none text-slate-400">Ainda não há vendas</p>
          </div>
        )}

        <div className="mt-5 flex items-center border-t border-slate-100 pt-4">
          {metricas.map(({ label, valor, Icon }, i) => (
            <div key={label} className={cn('flex flex-1 items-center gap-2.5 min-w-0', i > 0 && 'ml-3 border-l border-slate-100 pl-3')}>
              <Icon size={16} strokeWidth={2} className="shrink-0 text-slate-300" />
              <div className="min-w-0 leading-tight">
                <p className="truncate text-[16px] font-black tracking-tight text-ink sm:text-[17px]">{formatNumberDot(valor)}</p>
                <p className="truncate text-[10.5px] font-semibold text-slate-400">{label}</p>
              </div>
            </div>
          ))}
        </div>

        {temVendas && (
          <div className="mt-4 flex justify-end">
            {/*
              Ainda sem `<Link>`: a página /analytics não existe nesta
              etapa (ver §1/§13 do pedido — só UI dos cards, sem
              construir Analytics). Fica visualmente pronta para virar
              um Link real assim que essa página existir.
            */}
            <span className="select-none text-[12px] font-semibold text-slate-400">Ver análises →</span>
          </div>
        )}
      </div>
    </div>
  );
}

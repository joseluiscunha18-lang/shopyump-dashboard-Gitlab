import { ShoppingBag, Eye } from 'lucide-react';
import { ELEVATED_SURFACE } from '@/components/ui/Surfaces';
import { formatNumberDot } from '@/lib/format';
import { cn } from '@/lib/cn';

interface ResumoCardProps {
  ordersCount: number;
  visits: number;
}

/**
 * "Resumo" — substitui a antiga "Visão geral" (que misturava Vendas,
 * Pedidos, Visitas e Produtos numa coisa só). Agora é só os dois
 * indicadores puramente operacionais, sempre seguros de mostrar
 * independentemente de plano ou de haver canal financeiro: Pedidos e
 * Visitas. Produtos foi removido de propósito — não é pedido do §"NOVA
 * LÓGICA" mostrar essa contagem aqui. Vendas (e tudo o que é dinheiro)
 * agora vive inteiramente no card "Pagamentos" — ver PagamentosCard.tsx
 * — para não haver a mesma informação repetida em dois lugares.
 *
 * O componente em si não decide quando aparecer: quem monta a página
 * é que esconde este card assim que existe algum canal financeiro (ou
 * a própria noção de "Pagamentos") já modelado. Hoje isso só se aplica
 * ao Home real (`app/(dashboard)/page.tsx`), que ainda não tem
 * gateway/Marketplace ligados de facto — assim que essa integração
 * existir, este card deve seguir a mesma regra já usada em
 * `/dev/cenarios`: Pagamentos passa a ser sempre o card principal (ver
 * `resolvePagamentosCard` em PagamentosCard.tsx, que já cobre o caso
 * "nenhum canal ainda" com um estado zerado + `hint`, em vez de
 * esconder o card), e o Resumo sai de cena — nesse ponto este
 * componente deixa de ser necessário.
 */
export function ResumoCard({ ordersCount, visits }: ResumoCardProps) {
  const metricas = [
    { label: 'Pedidos', valor: ordersCount, Icon: ShoppingBag },
    { label: 'Visitas', valor: visits, Icon: Eye },
  ];

  return (
    <div>
      <h2 className="mb-3 px-1 text-[13px] font-bold uppercase tracking-[0.08em] text-slate-400">Resumo</h2>

      <div className={cn('rounded-[24px] p-5 sm:p-6', ELEVATED_SURFACE)}>
        <div className="flex items-center">
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
      </div>
    </div>
  );
}

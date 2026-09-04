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

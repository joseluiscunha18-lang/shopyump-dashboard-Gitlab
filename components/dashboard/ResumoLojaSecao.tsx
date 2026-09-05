import { ShoppingBag, Eye } from 'lucide-react';
import { formatNumberDot } from '@/lib/format';
import { cn } from '@/lib/cn';

interface ResumoLojaSecaoProps {
  ordersCount: number;
  visits: number;
}

/**
 * "Resumo da loja" — secção COMPLEMENTAR, não um card (sem `ELEVATED_SURFACE`,
 * sem fundo branco/sombra/raio próprio): fica diretamente sobre o fundo da
 * página, como um apêndice discreto por baixo do Marketplace, e não como
 * mais um bloco a competir visualmente com ele.
 *
 * Faz sentido em todo cenário em que a loja NÃO tem nenhum gateway
 * próprio ligado (nem externo, nem Shopyump — `storePayment.provider
 * === 'none'`), com ou sem Marketplace ativo, em qualquer plano (grátis
 * ou pago) — incluindo quando não há canal financeiro nenhum ainda:
 * Pagamentos é sempre o card principal (ver `resolvePagamentosCard`,
 * que nesse caso mostra "Disponível para saque" a 0 MT com um `hint` a
 * pedir para configurar pagamentos), mas Pedidos/Visitas da LOJA (que
 * não são a mesma coisa que os pedidos/vendas do Marketplace, quando
 * ele existe) ainda não aparecem em lado nenhum — daí esta secção
 * extra, mais discreta, em vez de mais um card a competir com o
 * Pagamentos.
 *
 * Quem monta a página decide quando mostrar (ver /dev/cenarios): sempre
 * logo a seguir ao card/carrossel do Pagamentos.
 */
export function ResumoLojaSecao({ ordersCount, visits }: ResumoLojaSecaoProps) {
  const metricas = [
    { label: 'Pedidos', valor: ordersCount, Icon: ShoppingBag },
    { label: 'Visitas', valor: visits, Icon: Eye },
  ];

  return (
    <div>
      <h2 className="mb-3 px-1 text-[13px] font-bold uppercase tracking-[0.08em] text-slate-400">Resumo da loja</h2>

      <div className="flex items-center px-1">
        {metricas.map(({ label, valor, Icon }, i) => (
          <div key={label} className={cn('flex flex-1 items-center gap-2.5 min-w-0', i > 0 && 'ml-3 border-l border-slate-200 pl-3')}>
            <Icon size={16} strokeWidth={2} className="shrink-0 text-slate-300" />
            <div className="min-w-0 leading-tight">
              <p className="truncate text-[16px] font-black tracking-tight text-ink sm:text-[17px]">{formatNumberDot(valor)}</p>
              <p className="truncate text-[10.5px] font-semibold text-slate-400">{label}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

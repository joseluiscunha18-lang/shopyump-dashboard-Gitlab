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
 * Só faz sentido nos dois cenários em que o Marketplace está ativo mas a
 * loja NÃO tem nenhum gateway próprio ligado (nem externo, nem Shopyump —
 * `storePayment.provider === 'none'`), em qualquer plano (grátis ou pago):
 * nesses casos o Pagamentos já assumiu o lugar do card principal (ver
 * `resolvePagamentosCard`) e o Marketplace já mostra "Vendas" dele
 * próprio, mas Pedidos/Visitas da LOJA (que não são a mesma coisa que os
 * pedidos/vendas do Marketplace) ainda não apareciam em lado nenhum — daí
 * esta secção extra, mais discreta, em vez de trazer de volta o
 * `ResumoCard` (esse continua reservado para quando não há canal
 * financeiro nenhum confirmado — ver ResumoCard.tsx).
 *
 * Quem monta a página decide quando mostrar (ver /dev/cenarios): sempre
 * logo a seguir ao MarketplaceCard.
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

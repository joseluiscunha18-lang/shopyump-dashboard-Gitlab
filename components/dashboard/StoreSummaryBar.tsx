import { ELEVATED_SURFACE } from '@/components/ui/Surfaces';
import { cn } from '@/lib/cn';

/**
 * Ao contrário do NewOrderAlert e dos cards de onboarding (que só
 * aparecem quando há algo de concreto a mostrar), este bloco é sempre
 * visível, mesmo a zeros — é intencional (ver conversa de UX): mostrar o
 * resumo desde o primeiro dia ensina o usuário desde já ONDE a evolução
 * da loja vai aparecer, mesmo antes de haver progresso para mostrar.
 */
export function StoreSummaryBar({
  produtos,
  visitas,
  pedidos,
}: {
  produtos: number;
  visitas: number;
  pedidos: number;
}) {
  const itens = [
    { label: 'Produtos', valor: produtos },
    { label: 'Visitas', valor: visitas },
    { label: 'Pedidos', valor: pedidos },
  ];

  return (
    <div>
      <h2 className="mb-3 px-1 text-[13px] font-bold uppercase tracking-[0.08em] text-slate-400">Resumo da loja</h2>
      <div className={cn('grid grid-cols-3 divide-x divide-slate-100 overflow-hidden rounded-[20px]', ELEVATED_SURFACE)}>
        {itens.map((item) => (
          <div key={item.label} className="flex flex-col items-center gap-0.5 px-2 py-3.5 sm:py-4">
            <span className="text-[20px] font-black leading-none tracking-tight text-ink sm:text-[22px]">{item.valor}</span>
            <span className="text-[11px] font-semibold text-slate-400">{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

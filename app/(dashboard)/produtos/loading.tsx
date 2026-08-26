import { ProductRowSkeleton } from '@/components/produtos/PendingProductRow';

/**
 * Sem isto, o router.push('/produtos') feito pelo ProductForm só troca de
 * ecrã depois de a página de destino ter os dados prontos (a lista de
 * produtos vinda do servidor) — em rede lenta isso podia somar vários
 * segundos por cima dos 3s já garantidos no botão "Publicar produto",
 * dando a sensação de uma espera muito maior do que o previsto.
 *
 * Com este ficheiro, o Next.js troca para esta tela de imediato ao
 * navegar (o botão deixa de processar exatamente aos 3s) e só troca de
 * novo, sem transição brusca, quando `page.tsx` já tiver os dados reais —
 * o mesmo esqueleto que já usamos no resto do fluxo, agora também aqui.
 */
export default function ProdutosLoading() {
  return (
    <div className="flex flex-col gap-6 pt-2">
      <h2 className="text-lg font-black text-ink tracking-tight">Produtos</h2>

      <div className="overflow-hidden rounded-md border border-[#1A1210]/8 bg-white shadow-[0_1px_0_rgba(15,23,42,0.04),0_10px_28px_-10px_rgba(15,23,42,0.14)]">
        <div className="divide-y divide-[#1A1210]/8">
          <ProductRowSkeleton />
          <ProductRowSkeleton />
          <ProductRowSkeleton />
        </div>
      </div>
    </div>
  );
}

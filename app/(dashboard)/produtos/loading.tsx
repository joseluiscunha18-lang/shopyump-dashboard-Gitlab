'use client';

import { Skeleton } from '@/components/ui/Surfaces';
import { PendingProductRow } from '@/components/produtos/PendingProductRow';
import { usePublishing } from '@/components/produtos/PublishingContext';

/**
 * Next.js mostra este ficheiro IMEDIATAMENTE ao navegar para /produtos,
 * sem esperar pelo `page.tsx` (que faz `getUserContext` + `getProdutosByLoja`
 * — duas idas e voltas reais ao Supabase). O `page.tsx` continua a
 * carregar por trás, em streaming, e troca sozinho para o conteúdo real
 * assim que a resposta chega — sem isto, o `router.push('/produtos')` só
 * troca de ecrã depois de o Supabase responder, e é exactamente essa
 * espera (variável, e por vezes de vários segundos) que fazia parecer que
 * o botão "Publicar produto" demorava muito mais do que o seu próprio
 * temporizador.
 *
 * Continua 'use client' + lê o `PublishingContext` (que vive no layout,
 * acima desta rota, por isso já está montado neste preciso instante) para
 * que o produto que acabou de ser publicado apareça já aqui, mesmo antes
 * de a lista real dos outros produtos chegar — é "os dados que já temos
 * agora", tal como pedido. Os produtos já existentes (que ainda não
 * conhecemos neste ecrã, por virem só do servidor) ficam representados
 * por linhas de esqueleto genéricas, substituídas assim que o `page.tsx`
 * terminar de carregar.
 */
export default function ProdutosLoading() {
  const { pending } = usePublishing();

  return (
    <div className="flex flex-col gap-6 pt-2">
      <Skeleton className="h-6 w-24" />

      <div className="rounded-md border border-[#1A1210]/8 bg-white shadow-[0_1px_0_rgba(15,23,42,0.04),0_10px_28px_-10px_rgba(15,23,42,0.14)]">
        <div className="px-4 pb-3 pt-4">
          <Skeleton className="h-9 w-full rounded-[10px]" />
          <div className="mt-3">
            <Skeleton className="h-8 w-2/3 rounded-[10px]" />
          </div>
        </div>

        <div className="flex h-11 items-center gap-3 border-b border-[#1A1210]/8 bg-[#F6F7F9] px-4">
          <Skeleton className="h-4 w-4 rounded-[4px]" />
          <Skeleton className="h-3 w-20" />
        </div>

        <div className="divide-y divide-[#1A1210]/8">
          {/* O produto recém-publicado, já com os dados reais que se
          conhecem — não é um placeholder. */}
          {pending.map((p) => (
            <PendingProductRow key={p.tempId} produto={p} confirmado={false} selected={false} onToggleSelect={() => {}} />
          ))}

          {/* Produtos já existentes na loja: ainda desconhecidos aqui
          (só o `page.tsx` sabe, e está a caminho), por isso ficam como
          linhas genéricas em vez de fingir dados que não temos. */}
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 p-4">
              <Skeleton className="h-4 w-4 flex-shrink-0 rounded-[4px]" />
              <Skeleton className="-ml-1 h-14 w-14 flex-shrink-0 rounded-md" />
              <div className="min-w-0 flex-1">
                <Skeleton className="h-[13px] w-2/5" />
                <Skeleton className="mt-0.5 h-[12px] w-1/3" />
                <Skeleton className="mt-1 h-[11px] w-1/4" />
              </div>
              <Skeleton className="h-8 w-8 flex-shrink-0 rounded-md" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

'use client';

import { Skeleton } from '@/components/ui/Surfaces';
import { PendingProductRow } from '@/components/produtos/PendingProductRow';
import { usePublishing } from '@/components/produtos/PublishingContext';
import { Checkbox } from '@/components/ui/Checkbox';

/**
 * Next.js mostra este ficheiro IMEDIATAMENTE ao navegar para /produtos,
 * sem esperar pelo `page.tsx` (que faz `getUserContext` + `getProdutosByLoja`
 * — duas idas e voltas reais ao Supabase). O `page.tsx` continua a
 * carregar por trás, em streaming, e troca sozinho para o conteúdo real
 * assim que a resposta chega.
 *
 * UX: pesquisa, filtros e cabeçalho são renderizados como UI real e
 * interativa desde o primeiro instante — só as linhas de produtos ainda
 * desconhecidos ficam como skeleton. O produto recém-publicado
 * (se existir em `pending`) aparece já com os dados reais, sem skeleton.
 */
export default function ProdutosLoading() {
  const { pending } = usePublishing();

  return (
    <div className="flex flex-col gap-6 pt-2">
      {/* Título real — não skeleton */}
      <h2 className="text-lg font-black text-ink tracking-tight">Produtos</h2>

      <div className="rounded-md border border-[#1A1210]/8 bg-white shadow-[0_1px_0_rgba(15,23,42,0.04),0_10px_28px_-10px_rgba(15,23,42,0.14)]">
        {/* Área de pesquisa e filtros: UI real mas desativada/placeholder
            enquanto os dados do servidor ainda não chegaram */}
        <div className="px-4 pb-3 pt-4">
          {/* SearchBar placeholder — mesma aparência, mas não funcional ainda */}
          <div className="flex h-9 w-full items-center gap-2 rounded-[10px] border border-[#1A1210]/10 bg-[#F6F7F9] px-3">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 text-[#1A1210]/30">
              <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
            </svg>
            <span className="text-[13px] font-medium text-[#1A1210]/30">Pesquisar produtos…</span>
          </div>

          {/* Filtros placeholder — skeleton só nas pílulas, não na área toda */}
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <Skeleton className="h-8 w-16 rounded-[10px]" />
            <Skeleton className="h-8 w-20 rounded-[10px]" />
            <Skeleton className="h-8 w-24 rounded-[10px]" />
          </div>
        </div>

        {/* Cabeçalho da tabela — real, com checkbox e contador */}
        <div className="flex h-11 items-center gap-3 border-b border-[#1A1210]/8 bg-[#F6F7F9] px-4">
          <Checkbox
            checked={false}
            onChange={() => {}}
            ariaLabel="Selecionar todos"
            className="pointer-events-none opacity-40"
          />
          <span className="text-[12px] font-bold text-[#1A1210]/40">
            {pending.length > 0 ? `${pending.length} produto${pending.length !== 1 ? 's' : ''}` : 'A carregar…'}
          </span>
        </div>

        <div className="divide-y divide-[#1A1210]/8">
          {/* Produto recém-publicado: dados reais já disponíveis, sem skeleton */}
          {pending.map((p) => (
            <PendingProductRow
              key={p.tempId}
              produto={p}
              confirmado={false}
              selected={false}
              onToggleSelect={() => {}}
            />
          ))}

          {/* Produtos já existentes na loja: skeleton só nas linhas,
              não na pesquisa/filtros/cabeçalho acima. */}
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

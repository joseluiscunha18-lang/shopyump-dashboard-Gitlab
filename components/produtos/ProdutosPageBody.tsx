'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { ProductPreviewCard } from '@/components/produtos/ProductPreviewCard';
import { ProductsExplorer } from '@/components/produtos/ProductsExplorer';
import { ProductCelebrationBanner } from '@/components/produtos/ProductCelebrationBanner';
import { usePublishing } from '@/components/produtos/PublishingContext';
import type { Produto } from '@/types/database';

/**
 * Decide entre o ecrã vazio ("Adicione seu primeiro produto") e a lista.
 * Precisa de ser client porque, além dos `produtos` já guardados na base
 * (vindos do servidor), tem de olhar também para publicações otimistas
 * ainda em curso — o primeiro produto de uma loja pode estar "a publicar"
 * mesmo antes de existir na base de dados, e nesse caso já não faz
 * sentido mostrar o ecrã vazio.
 */
export function ProdutosPageBody({ produtos, lojaSlug }: { produtos: Produto[]; lojaSlug?: string }) {
  const { pending } = usePublishing();
  const temAlgumaCoisa = produtos.length > 0 || pending.length > 0;

  return (
    <div className="flex flex-col gap-6 pt-2">
      <ProductCelebrationBanner lojaSlug={lojaSlug} />

      <h2 className="text-lg font-black text-ink tracking-tight">Produtos</h2>

      {temAlgumaCoisa ? (
        <ProductsExplorer produtos={produtos} />
      ) : (
        <div className="relative w-full overflow-hidden rounded-md bg-white shadow-[0_1px_0_rgba(15,23,42,0.04),0_4px_10px_-6px_rgba(15,23,42,0.08),0_12px_20px_-16px_rgba(15,23,42,0.05)] ring-1 ring-black/[0.03]">
          <div className="flex flex-col items-center px-6 pt-6 pb-6 sm:pt-8 sm:pb-8">
            <ProductPreviewCard />

            <div className="mt-3 flex max-w-[280px] flex-col items-center gap-2 text-center sm:mt-4">
              <h2 className="font-display text-xl font-extrabold tracking-tight text-ink sm:text-2xl">
                Adicione seu primeiro produto
              </h2>
              <p className="text-[13px] font-medium leading-relaxed text-slate-400">
                Comece a construir seu catálogo e
                <br />
                coloque seus produtos à venda.
              </p>
            </div>

            <Link href="/produtos/novo" className="mt-4 sm:mt-5">
              <Button variant="dark">Adicionar produto</Button>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

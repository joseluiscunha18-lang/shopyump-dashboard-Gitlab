import type { Metadata } from 'next';
import Link from 'next/link';
import { Plus } from 'lucide-react';
import { getUserContext } from '@/lib/auth/getUserContext';
import { getProdutosByLoja } from '@/lib/queries/produtos';
import { Button } from '@/components/ui/Button';
import { ProductsExplorer } from '@/components/produtos/ProductsExplorer';
import { ProductPreviewCard } from '@/components/produtos/ProductPreviewCard';

export const metadata: Metadata = { title: 'Produtos | Shopyump' };

export default async function ProdutosPage() {
  const ctx = await getUserContext();
  if (!ctx.loja) return null;

  const produtos = await getProdutosByLoja(ctx.loja.id);

  if (produtos.length === 0) {
    return (
      <div className="flex flex-col gap-6 pt-2">
        <h2 className="text-lg font-black text-ink tracking-tight">Produtos</h2>

        <div className="relative w-full overflow-hidden rounded-[28px] bg-white shadow-[0_1px_0_rgba(15,23,42,0.04),0_4px_10px_-6px_rgba(15,23,42,0.08),0_12px_20px_-16px_rgba(15,23,42,0.05)] ring-1 ring-black/[0.03]">
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
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 pt-2">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-black text-ink tracking-tight">Produtos</h2>
        <Link href="/produtos/novo">
          <Button size="sm">
            <Plus size={15} /> Novo produto
          </Button>
        </Link>
      </div>

      <ProductsExplorer produtos={produtos} />
    </div>
  );
}

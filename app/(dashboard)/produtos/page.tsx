import type { Metadata } from 'next';
import Link from 'next/link';
import { Plus } from 'lucide-react';
import { getUserContext } from '@/lib/auth/getUserContext';
import { getProdutosByLoja } from '@/lib/queries/produtos';
import { Card } from '@/components/ui/Surfaces';
import { Button } from '@/components/ui/Button';
import { ProductRow } from '@/components/produtos/ProductRow';

export const metadata: Metadata = { title: 'Produtos | Shopyump' };

export default async function ProdutosPage() {
  const ctx = await getUserContext();
  if (!ctx.loja) return null;

  const produtos = await getProdutosByLoja(ctx.loja.id);

  if (produtos.length === 0) {
    return (
      <div className="flex flex-col gap-6 pt-2">
        <h2 className="text-lg font-black text-ink tracking-tight">Produtos</h2>

        <div className="relative min-h-[420px] w-full overflow-hidden rounded-[28px] bg-white shadow-[0_1px_0_rgba(15,23,42,0.06),0_6px_14px_-6px_rgba(15,23,42,0.13),0_16px_24px_-16px_rgba(15,23,42,0.07)] ring-1 ring-black/[0.035]">
          <div className="flex h-full flex-col items-center px-6 pt-10 pb-8 sm:pt-12 sm:pb-10">
            <div className="flex h-[168px] w-full max-w-[220px] items-center justify-center sm:h-[196px]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="https://i.ibb.co/kg0TN94W/1-4.png"
                alt=""
                className="h-full w-full object-contain"
              />
            </div>

            <div className="mt-6 flex max-w-[280px] flex-col items-center gap-2 text-center sm:mt-8">
              <h2 className="font-display text-xl font-extrabold tracking-tight text-ink sm:text-2xl">
                Adicione seu primeiro produto
              </h2>
              <p className="text-[13px] font-medium leading-relaxed text-slate-400">
                Comece a construir seu catálogo e coloque seus produtos à venda na sua loja.
              </p>
            </div>

            <Link href="/produtos/novo" className="mt-7 sm:mt-8">
              <Button>Criar produto</Button>
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

      <Card className="divide-y divide-slate-100">
        {produtos.map((p) => (
          <ProductRow key={p.id} produto={p} />
        ))}
      </Card>
    </div>
  );
}

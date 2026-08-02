import type { Metadata } from 'next';
import Link from 'next/link';
import { Plus, PackageSearch } from 'lucide-react';
import { getUserContext } from '@/lib/auth/getUserContext';
import { getProdutosByLoja } from '@/lib/queries/produtos';
import { Card, EmptyState } from '@/components/ui/Surfaces';
import { Button } from '@/components/ui/Button';
import { ProductRow } from '@/components/produtos/ProductRow';

export const metadata: Metadata = { title: 'Produtos | Shopyump' };

export default async function ProdutosPage() {
  const ctx = await getUserContext();
  if (!ctx.loja) return null;

  const produtos = await getProdutosByLoja(ctx.loja.id);

  return (
    <div className="flex flex-col gap-6 pt-2">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-black text-ink tracking-tight">Produtos</h2>
          <p className="text-[12px] font-medium text-slate-400">{produtos.length} no catálogo</p>
        </div>
        <Link href="/produtos/novo">
          <Button size="sm">
            <Plus size={15} /> Novo produto
          </Button>
        </Link>
      </div>

      {produtos.length === 0 ? (
        <Card>
          <EmptyState
            icon={<PackageSearch size={22} />}
            title="Ainda não tens produtos"
            subtitle="Adiciona o teu primeiro produto para começar a vender."
            action={
              <Link href="/produtos/novo">
                <Button size="sm">Adicionar produto</Button>
              </Link>
            }
          />
        </Card>
      ) : (
        <Card className="divide-y divide-slate-100">
          {produtos.map((p) => (
            <ProductRow key={p.id} produto={p} />
          ))}
        </Card>
      )}
    </div>
  );
}

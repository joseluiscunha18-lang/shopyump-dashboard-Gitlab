import type { Metadata } from 'next';
import { getUserContext } from '@/lib/auth/getUserContext';
import { getProdutosByLoja } from '@/lib/queries/produtos';
import { ProdutosPageBody } from '@/components/produtos/ProdutosPageBody';

export const metadata: Metadata = { title: 'Produtos | Shopyump' };

export default async function ProdutosPage() {
  const ctx = await getUserContext();
  if (!ctx.loja) return null;

  const produtos = await getProdutosByLoja(ctx.loja.id);

  return <ProdutosPageBody produtos={produtos} lojaSlug={ctx.loja.slug} />;
}

import type { Metadata } from 'next';
import { getUserContext } from '@/lib/auth/getUserContext';
import { getProdutosByLoja } from '@/lib/queries/produtos';
import { ProdutosPageBody } from '@/components/produtos/ProdutosPageBody';

export const metadata: Metadata = { title: 'Produtos | Shopyump' };

// Sempre renderizada no pedido, nunca a partir de uma versão em cache da
// rota. Isto é o que garante que a lista já vem correta mesmo quando se
// chega aqui logo a seguir a publicar/editar um produto (router.refresh()
// tem de encontrar sempre um render fresco, nunca uma versão antiga
// reaproveitada) — sem isto, a página podia mostrar por instantes dados
// de antes da publicação, antes de "corrigir" sozinha.
export const dynamic = 'force-dynamic';

export default async function ProdutosPage() {
  const ctx = await getUserContext();
  if (!ctx.loja) return null;

  const produtos = await getProdutosByLoja(ctx.loja.id);

  return <ProdutosPageBody produtos={produtos} loja={ctx.loja} />;
}

import { createFileRoute } from "@/lib/route-compat";

import { getUserContext } from "@/lib/auth/getUserContext";
import { getProdutosByLoja } from "@/lib/queries/produtos";
import { getLojaMarcos } from "@/lib/queries/lojaMarcos";
import { ProdutosPageBody } from "@/components/produtos/ProdutosPageBody";

export const Route = createFileRoute("/_dashboard/produtos/")({
  head: () => ({ meta: [{ title: "Produtos | Shopyump" }, { name:"description",content:'Produtos no painel demonstrativo Shopyump.' }, { property:"og:title",content:'Produtos | Shopyump' }, { property:"og:description",content:'Produtos no painel demonstrativo Shopyump.' }, {property:"og:type",content:"website"}, {name:"twitter:card",content:"summary_large_image"}] }),
  loader: async () => {
    const ctx = await getUserContext();
    if (!ctx.loja) return { ctx, produtos: [], marcoPrimeiroProduto: null };
    const [produtos, marcos] = await Promise.all([
      getProdutosByLoja(ctx.loja.id),
      getLojaMarcos(ctx.loja.id),
    ]);
    return { ctx, produtos, marcoPrimeiroProduto: marcos.primeiro_produto ?? null };
  },
  component: ProdutosPage,
});

function ProdutosPage() {
  const { ctx, produtos, marcoPrimeiroProduto } = Route.useLoaderData();
  if (!ctx.loja) return null;

  return (
    <ProdutosPageBody
      produtos={produtos}
      lojaId={ctx.loja.id}
      lojaSlug={ctx.loja.slug}
      marcoPrimeiroProduto={marcoPrimeiroProduto}
    />
  );
}

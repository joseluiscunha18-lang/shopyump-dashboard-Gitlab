import { createFileRoute } from "@/lib/route-compat";

import { getUserContext } from "@/lib/auth/getUserContext";
import { getProdutosCount } from "@/lib/queries/produtos";
import { ProductForm } from "@/components/produtos/ProductForm";

export const Route = createFileRoute("/_dashboard/produtos/novo")({
  head: () => ({ meta: [{ title: "Novo produto | Shopyump" }, { name:"description",content:'Novo produto no painel demonstrativo Shopyump.' }, { property:"og:title",content:'Novo produto | Shopyump' }, { property:"og:description",content:'Novo produto no painel demonstrativo Shopyump.' }, {property:"og:type",content:"website"}, {name:"twitter:card",content:"summary_large_image"}] }),
  loader: async () => {
    const ctx = await getUserContext();
    const souPrimeiroProduto = ctx.loja ? (await getProdutosCount(ctx.loja.id)) === 0 : false;
    return { ctx, souPrimeiroProduto };
  },
  component: NovoProdutoPage,
});

function NovoProdutoPage() {
  const { ctx, souPrimeiroProduto } = Route.useLoaderData();
  if (!ctx.loja) return null;

  return (
    <div className="flex flex-col gap-8">
      <ProductForm lojaId={ctx.loja.id} souPrimeiroProduto={souPrimeiroProduto} />
    </div>
  );
}

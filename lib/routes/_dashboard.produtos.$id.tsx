import { createFileRoute, notFound } from "@/lib/route-compat";

import { getUserContext } from "@/lib/auth/getUserContext";
import { getProdutoById } from "@/lib/queries/produtos";
import { ProductForm } from "@/components/produtos/ProductForm";

export const Route = createFileRoute("/_dashboard/produtos/$id")({
  head: () => ({ meta: [{ title: "Editar produto | Shopyump" }, { name:"description",content:'Editar produto no painel demonstrativo Shopyump.' }, { property:"og:title",content:'Editar produto | Shopyump' }, { property:"og:description",content:'Editar produto no painel demonstrativo Shopyump.' }, {property:"og:type",content:"website"}, {name:"twitter:card",content:"summary_large_image"}] }),
  loader: async ({ params }) => {
    const ctx = await getUserContext();
    const produto = await getProdutoById(params.id);
    if (!ctx.loja || !produto || produto.loja_id !== ctx.loja.id) throw notFound();
    return { ctx, produto };
  },
  component: EditarProdutoPage,
});

function EditarProdutoPage() {
  const { ctx, produto } = Route.useLoaderData();
  if (!ctx.loja) return null;

  return (
    <div className="flex flex-col gap-6">
      <ProductForm lojaId={ctx.loja.id} produto={produto} />
    </div>
  );
}

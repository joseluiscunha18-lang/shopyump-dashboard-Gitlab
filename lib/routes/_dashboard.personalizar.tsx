import { createFileRoute } from "@/lib/route-compat";

import PersonalizarPageClient from "@/theme-editor/pages/PersonalizarPageClient";
import { getUserContext } from "@/lib/auth/getUserContext";
import { getEditorInit } from "@/lib/queries/personalizacaoEditor";

export const Route = createFileRoute("/_dashboard/personalizar")({
  head: () => ({ meta: [{ title: "Personalizar loja | Shopyump" }, { name:"description",content:'Personalizar loja no painel demonstrativo Shopyump.' }, { property:"og:title",content:'Personalizar loja | Shopyump' }, { property:"og:description",content:'Personalizar loja no painel demonstrativo Shopyump.' }, {property:"og:type",content:"website"}, {name:"twitter:card",content:"summary_large_image"}] }),
  loader: async () => {
    const ctx = await getUserContext();
    const initial = ctx.loja ? await getEditorInit(ctx.loja) : undefined;
    return { initial };
  },
  component: PersonalizarPage,
});

function PersonalizarPage() {
  const { initial } = Route.useLoaderData();
  return <PersonalizarPageClient initial={initial} />;
}

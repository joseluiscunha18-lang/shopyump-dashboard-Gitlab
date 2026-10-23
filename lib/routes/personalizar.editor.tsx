import { createFileRoute, redirect } from "@/lib/route-compat";

import EditorPageClient from "@/theme-editor/pages/EditorPageClient";
import { getUserContext } from "@/lib/auth/getUserContext";
import { getEditorInit } from "@/lib/queries/personalizacaoEditor";

/** Editor da loja em ecrã inteiro — fora da moldura do painel. */
export const Route = createFileRoute("/personalizar/editor")({
  head: () => ({ meta: [{ title: "Editor da loja | Shopyump" }, { name:"description",content:'Editor da loja no painel demonstrativo Shopyump.' }, { property:"og:title",content:'Editor da loja | Shopyump' }, { property:"og:description",content:'Editor da loja no painel demonstrativo Shopyump.' }, {property:"og:type",content:"website"}, {name:"twitter:card",content:"summary_large_image"}] }),
  loader: async () => {
    const ctx = await getUserContext();
    if (!ctx.userId) throw redirect({ to: "/login" });
    if (!ctx.loja && !ctx.isAdmin) throw redirect({ to: "/onboarding" });
    const initial = ctx.loja ? await getEditorInit(ctx.loja) : undefined;
    return { initial };
  },
  component: EditorPage,
});

function EditorPage() {
  const { initial } = Route.useLoaderData();
  return <EditorPageClient initial={initial} />;
}

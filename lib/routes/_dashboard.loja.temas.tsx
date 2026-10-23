import { createFileRoute } from "@/lib/route-compat";

import { ThemeCatalog } from "@/components/loja/customize/ThemeCatalog";

export const Route = createFileRoute("/_dashboard/loja/temas")({
  head: () => ({ meta: [{ title: "Temas | Shopyump" }, { name:"description",content:'Temas no painel demonstrativo Shopyump.' }, { property:"og:title",content:'Temas | Shopyump' }, { property:"og:description",content:'Temas no painel demonstrativo Shopyump.' }, {property:"og:type",content:"website"}, {name:"twitter:card",content:"summary_large_image"}] }),
  component: TemasPage,
});

function TemasPage() {
  return <ThemeCatalog />;
}

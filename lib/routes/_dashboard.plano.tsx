import { createFileRoute } from "@/lib/route-compat";

import { PageShell, PageHeader, DemoBanner } from "@/components/demo/DemoKit";
import { PlanoView } from "@/components/demo/DemoPages";

export const Route = createFileRoute("/_dashboard/plano")({
  head: () => ({ meta: [{ title: "Plano e faturação | Shopyump" }, { name:"description",content:'Plano e faturação no painel demonstrativo Shopyump.' }, { property:"og:title",content:'Plano e faturação | Shopyump' }, { property:"og:description",content:'Plano e faturação no painel demonstrativo Shopyump.' }, {property:"og:type",content:"website"}, {name:"twitter:card",content:"summary_large_image"}] }),
  component: Page,
});

function Page() {
  return (
    <PageShell>
      <PageHeader title="Plano e faturação" subtitle="O teu plano Shopyump (separado dos pagamentos da loja)" />
      <DemoBanner />
      <PlanoView />
    </PageShell>
  );
}

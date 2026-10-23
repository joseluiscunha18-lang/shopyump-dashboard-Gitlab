import { createFileRoute } from "@/lib/route-compat";

import { PageShell, PageHeader } from "@/components/demo/DemoKit";

export const Route = createFileRoute("/_dashboard/ajuda")({
  head: () => ({ meta: [{ title: "Ajuda | Shopyump" }, { name:"description",content:'Ajuda no painel demonstrativo Shopyump.' }, { property:"og:title",content:'Ajuda | Shopyump' }, { property:"og:description",content:'Ajuda no painel demonstrativo Shopyump.' }, {property:"og:type",content:"website"}, {name:"twitter:card",content:"summary_large_image"}] }),
  component: Page,
});

function Page() {
  return (
    <PageShell>
      <PageHeader title="Ajuda e suporte" subtitle="Perguntas frequentes" />
      <div className="flex flex-col gap-3">
        {[
          ["Como adiciono um produto?", "Toca em “+” na barra inferior ou vai a Produtos → Adicionar."],
          ["Como recebo pagamentos?", "Os Métodos de pagamento ainda são demonstrativos; não processam pagamentos reais."],
          ["Como mudo o aspeto da loja?", "Abre Personalizar loja no menu."],
        ].map(([q, a]) => (
          <details key={q} className="border-b border-border py-5">
            <summary className="cursor-pointer text-[13px] font-bold text-ink">{q}</summary>
            <p className="mt-2 text-[13px] text-slate-500">{a}</p>
          </details>
        ))}
      </div>
    </PageShell>
  );
}

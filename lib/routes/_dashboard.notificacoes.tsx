import { createFileRoute } from "@/lib/route-compat";

import { NotificacoesView } from "@/components/demo/DemoPages";

export const Route = createFileRoute("/_dashboard/notificacoes")({
  head: () => ({ meta: [{ title: "Notificações | Shopyump" }, { name:"description",content:'Acompanha os pedidos, o stock e outras atividades da tua loja.' }, { property:"og:title",content:'Notificações | Shopyump' }, { property:"og:description",content:'Acompanha os pedidos, o stock e outras atividades da tua loja.' }, {property:"og:type",content:"website"}, {name:"twitter:card",content:"summary_large_image"}] }),
  component: Page,
});

function Page() {
  return (
    <div className="notif-page-shell">
      <header className="notif-page-head">
        <h1>Notificações</h1>
        <p>Acompanha os pedidos, o stock e outras atividades da tua loja.</p>
      </header>
      <NotificacoesView />
    </div>
  );
}

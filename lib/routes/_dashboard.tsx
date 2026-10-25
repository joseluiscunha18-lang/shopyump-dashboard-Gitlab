import { useEffect } from "react";
import { Outlet, createFileRoute, redirect, useRouterState } from "@/lib/route-compat";
import { getUserContext } from "@/lib/auth/getUserContext";
import { terminarSessao } from "@/lib/auth/client";
import { usesRefinedDashboard } from '@/lib/nav/dashboardDesign';
import { createClient } from "@/lib/supabase/client";

import { countPedidosPendentes } from "@/lib/queries/pedidos";
import { getStoreUrl } from "@/lib/storeUrl";
import { Sidebar } from "@/components/nav/Sidebar";
import { BottomNav } from "@/components/nav/BottomNav";
import { DashboardContentFrame } from "@/components/nav/DashboardContentFrame";
import { TopBar } from "@/components/nav/TopBar";
import { MobileNavProvider } from "@/components/nav/MobileNavContext";
import { ProductFormGuardProvider } from "@/components/produtos/ProductFormGuardContext";
import { PublishingProvider } from "@/components/produtos/PublishingContext";

import { DashboardStateProvider,useDashboardState } from '@/components/dashboard/DashboardState';

export const Route = createFileRoute("/_dashboard")({head: () => ({meta: [{"title": "Gestão da loja — Shopyump"}, {"name": "description", "content": "Gestão da loja no Shopyump."}, {"property": "og:title", "content": "Gestão da loja — Shopyump"}, {"property": "og:description", "content": "Gestão da loja no Shopyump."}, {"property": "og:type", "content": "website"}, {"name": "twitter:card", "content": "summary_large_image"}]}), 
  ssr: false,
  // O middleware já barra quem não tem sessão/loja; isto cobre o caso de a sessão expirar com a página aberta.
  loader: async () => {
    const ctx = await getUserContext();
    if (!ctx.userId) throw redirect({ to: "/login" });
    if (!ctx.loja) {
      // Conta de administrador sem loja: o middleware deixa-a passar, por isso não a mandamos para o onboarding (evita ciclo).
      if (ctx.isAdmin) return { ctx, loja: null, pedidosPendentes: 0 };
      throw redirect({ to: "/onboarding" });
    }
    return { ctx, loja: ctx.loja, pedidosPendentes: await countPedidosPendentes(ctx.loja.id) };
  },
  component: DashboardLayout,
});

function DashboardLayout() {
  const { ctx, loja } = Route.useLoaderData();
  if (!loja) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-6 text-center">
        <p className="text-sm font-medium text-muted-foreground">Esta conta não tem uma loja associada.</p>
        <button type="button" className="text-sm font-semibold underline underline-offset-4" onClick={async () => { await terminarSessao(); window.location.assign("/login"); }}>Terminar sessão</button>
      </div>
    );
  }
  return <DashboardStateProvider init={{ ctx, loja }}><DashboardBody /></DashboardStateProvider>;
}
function DashboardBody() {
 const path=useRouterState({select:s=>s.location.pathname});
 const {dark}=useDashboardState();
  const { loja: lojaOuNula, pedidosPendentes } = Route.useLoaderData();
  const loja = lojaOuNula!; // DashboardLayout só renderiza isto quando há loja
  const storeUrl = getStoreUrl(loja.slug);

  // E-mail de boas-vindas: a Edge Function só envia 1 vez por utilizador (tabela welcome_emails_sent).
  // O sessionStorage evita chamá-la a cada carregamento; qualquer falha é ignorada e não afeta o dashboard.
  useEffect(() => {
    try {
      if (sessionStorage.getItem("welcome-email-checked")) return;
      sessionStorage.setItem("welcome-email-checked", "1");
    } catch {
      // sessionStorage indisponível: segue em frente, a função continua a ser idempotente.
    }
    createClient().functions.invoke("send-welcome-email").catch(() => {});
  }, []);

  return (
    <MobileNavProvider>
      <ProductFormGuardProvider>
        <PublishingProvider>
          <div className={"dashboard-shell min-h-screen flex "+(usesRefinedDashboard(path)?"dashboard-refined ":"")+(dark?"dark":"")}>
            <Sidebar storeUrl={storeUrl} />
            <DashboardContentFrame>
              <TopBar storeName={loja.nome} storeUrl={storeUrl}  />
               <main className={'dashboard-main flex-1 '+(path.startsWith('/produtos')?'dashboard-products':'')}>
                <Outlet />
              </main>
            </DashboardContentFrame>
            <BottomNav lojaId={loja.id} initialPedidosPendentes={pedidosPendentes} />
          </div>
        </PublishingProvider>
      </ProductFormGuardProvider>
    </MobileNavProvider>
  );
}

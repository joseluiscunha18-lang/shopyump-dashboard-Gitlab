import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@/lib/route-compat";

import { getUserContext } from "@/lib/auth/getUserContext";
import { getLojaMarcos } from "@/lib/queries/lojaMarcos";
import { getPedidosByLoja } from "@/lib/queries/pedidos";
import { getProdutosByLoja } from "@/lib/queries/produtos";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { OnboardingSteps } from "@/components/dashboard/OnboardingSteps";
import { calcularOnboarding, type MarcosPorNome } from "@/lib/onboarding/orientacoes";
import type { MarcoOnboarding } from "@/types/database";
import { contarVisitas } from "@/lib/queries/visitas";
import {
  STATUS_LABEL, atividadeRecente, intervalo, pedidosHome, pedidosNoPeriodo, tempoRelativo,
} from "@/lib/analytics/demoAnalytics";

export const Route = createFileRoute("/_dashboard/dashboard")({
  head: () => ({ meta: [{ title: "Início | Shopyump" }, { name: "description", content: "Próximos passos, resumo e atividade recente da tua loja Shopyump." }, { property: "og:title", content: "Início | Shopyump" }, { property: "og:description", content: "Próximos passos, resumo e atividade recente da tua loja Shopyump." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" }] }),
  loader: async () => {
    const ctx = await getUserContext();
    if (!ctx.loja) return { ctx, marcos: {} as MarcosPorNome, pedidos: [], produtos: [], visitas30d: 0 };
    const r30 = intervalo("30d");
    const [marcos, pedidos, produtos, visitas30d] = await Promise.all([
      getLojaMarcos(ctx.loja.id),
      getPedidosByLoja(ctx.loja.id),
      getProdutosByLoja(ctx.loja.id),
      contarVisitas(ctx.loja.id, r30.inicio, r30.fim),
    ]);
    return { ctx, marcos: marcos as MarcosPorNome, pedidos, produtos, visitas30d };
  },
  component: DashboardHomePage,
});


function DashboardHomePage() {
  const { ctx, marcos, pedidos, produtos, visitas30d } = Route.useLoaderData();

  // Fonte de verdade = base de dados (loader). `dispensadosAgora` só serve para o × ter efeito imediato
  // (cartão some e o cabeçalho muda sem esperar); se a gravação falhar, o cartão volta. Ao voltar ao Início
  // o loader lê de novo a base de dados.
  const [dispensadosAgora, setDispensadosAgora] = useState<Set<MarcoOnboarding>>(new Set());

  const onboarding = useMemo(() => {
    const efetivos: MarcosPorNome = { ...marcos };
    dispensadosAgora.forEach((m) => { efetivos[m] = { concluido_em: efetivos[m]?.concluido_em ?? null, dispensado: true }; });
    return calcularOnboarding(efetivos);
  }, [marcos, dispensadosAgora]);

  if (!ctx.loja) return <p className="pt-10 text-sm font-medium text-muted-foreground">Sem loja associada a esta conta.</p>;

  const bloco = pedidosHome(pedidos);
  const r30 = intervalo("30d");
  const atividade = atividadeRecente(produtos, pedidos, bloco?.lista.map((p) => p.id));
  return (
    <div className="flex flex-col gap-10 pt-10 pb-6">
      <div className="flex flex-col gap-6">
        <DashboardHeader cabecalho={onboarding.cabecalho} />
        {onboarding.fase !== "concluido" && (
          <OnboardingSteps
            lojaId={ctx.loja.id}
            marcos={onboarding.cartoes}
            onDispensar={(m) => setDispensadosAgora((prev) => new Set(prev).add(m))}
            onDispensarFalhou={(m) => setDispensadosAgora((prev) => { const n = new Set(prev); n.delete(m); return n; })}
          />
        )}
      </div>

      <section>
        <div className="mb-4 px-1">
          <div className="flex items-baseline justify-between">
            <h2 className="text-[19px] font-bold tracking-tight text-foreground">Resumo da loja</h2>
            <Link to="/analises" className="text-[13px] font-semibold text-brand">Ver análises →</Link>
          </div>
          <p className="mt-1 text-[13px] font-medium text-muted-foreground">Últimos 30 dias</p>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: "Pedidos recebidos", v: pedidosNoPeriodo(pedidos, r30).length },
            { label: "Visitas à loja", v: visitas30d },
          ].map((m) => (
            <div key={m.label} className="rounded-2xl border border-border/70 bg-card shadow-xs px-4 py-4">
              <p className="text-[24px] font-black text-foreground">{m.v.toLocaleString("pt-MZ")}</p>
              <p className="mt-1 text-[13px] font-medium text-muted-foreground">{m.label}</p>
            </div>
          ))}
        </div>
      </section>

      {atividade.length > 0 && (
        <section>
          <h2 className="mb-4 px-1 text-[19px] font-bold tracking-tight text-foreground">Atividade recente</h2>
          <ul className="divide-y divide-border/60 rounded-2xl border border-border/70 bg-card shadow-xs">
            {atividade.slice(0, 5).map((a) => (
              <li key={a.id} className="flex items-center justify-between gap-3 px-4 py-3 text-[13px]">
                <span className="truncate text-foreground">{a.texto}</span>
                <span className="shrink-0 text-[11.5px] text-muted-foreground">{tempoRelativo(a.quando)}</span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

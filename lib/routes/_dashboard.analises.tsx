import { createFileRoute } from "@/lib/route-compat";
import { useEffect, useMemo, useState } from "react";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ArrowDownRight, ArrowUpRight, Package } from "lucide-react";
import { PageShell, PageHeader } from "@/components/demo/DemoKit";
import { SheetSelect } from "@/components/ui/SheetSelect";
import { getPedidosByLoja } from "@/lib/queries/pedidos";
import { getVisitasPorDia } from "@/lib/queries/visitas";
import { getUserContext } from "@/lib/auth/getUserContext";
import {
  PERIODOS_ANALISE, carregarAnalises, fonteSupabase, intervaloPeriodo,
  type AnalisesResultado, type Indicador, type PeriodoId, type PontoSerie,
} from "@/lib/analytics/analises";

const DESC = "Acompanha o desempenho da tua loja e descobre oportunidades para crescer.";

export const Route = createFileRoute("/_dashboard/analises")({
  head: () => ({ meta: [{ title: "Análises | Shopyump" }, { name: "description", content: DESC }, { property: "og:title", content: "Análises | Shopyump" }, { property: "og:description", content: DESC }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" }] }),
  component: Page,
});

// Fonte real: pedidos e visitas da loja do utilizador (Supabase, sob RLS). Criada por carregamento.
async function criarFonte() {
  const ctx = await getUserContext();
  if (!ctx.loja) return null;
  const lojaId = ctx.loja.id;
  return fonteSupabase(() => getPedidosByLoja(lojaId), (r) => getVisitasPorDia(lojaId, r.inicio, r.fim));
}

const MOEDA = "MZN";
const fmt = (n: number) => n.toLocaleString("pt-PT");
const pct = (n: number) => `${(n * 100).toFixed(1).replace(".", ",")}%`;
const hojeISO = () => new Date().toISOString().slice(0, 10);

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="min-w-0 rounded-2xl border border-slate-100 bg-white p-4">
      <h2 className="mb-3 text-[14px] font-bold text-ink">{title}</h2>
      {children}
    </section>
  );
}
const Vazio = ({ t }: { t: string }) => <p className="py-6 text-center text-[12.5px] text-slate-500">{t}</p>;

function Kpi({ label, ind, render, nota }: { label: string; ind: Indicador; render: (v: number) => string; nota?: string }) {
  const v = ind.variacao;
  return (
    <div className="min-w-0 rounded-2xl border border-slate-100 bg-white px-4 py-3">
      <p className="text-[11.5px] font-medium text-slate-600">{label}</p>
      <p className="mt-1 truncate text-[19px] font-black text-ink">{ind.valor === null ? "—" : render(ind.valor)}</p>
      {ind.valor === null ? (
        <p className="mt-1 text-[10.5px] text-slate-400">Dados insuficientes</p>
      ) : v !== null ? (
        <p className={`mt-1 flex items-center gap-0.5 text-[10.5px] font-semibold ${v >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
          {v >= 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
          {pct(Math.abs(v))} <span className="font-normal text-slate-400">vs. anterior</span>
        </p>
      ) : (
        <p className="mt-1 text-[10.5px] text-slate-400">{nota ?? "Sem comparação"}</p>
      )}
    </div>
  );
}

function Grafico({ dados, tipo, nome }: { dados: PontoSerie[]; tipo: "bar" | "area"; nome: string }) {
  const eixo = { tick: { fontSize: 10, fill: "#94a3b8" }, tickLine: false, axisLine: false } as const;
  const tip = <Tooltip cursor={{ fill: "rgba(148,163,184,.12)" }} contentStyle={{ borderRadius: 12, fontSize: 12, border: "1px solid #e2e8f0" }} labelFormatter={(l) => String(l)} formatter={(v: number) => [fmt(v), nome]} />;
  return (
    <div className="h-48 w-full">
      <ResponsiveContainer width="100%" height="100%">
        {tipo === "bar" ? (
          <BarChart data={dados} margin={{ top: 4, right: 4, left: -14, bottom: 0 }}>
            <CartesianGrid vertical={false} stroke="#f1f5f9" />
            <XAxis dataKey="label" {...eixo} interval="preserveStartEnd" minTickGap={18} />
            <YAxis allowDecimals={false} {...eixo} width={40} />
            {tip}
            <Bar dataKey="valor" name={nome} fill="var(--color-brand, #0f766e)" radius={[4, 4, 0, 0]} />
          </BarChart>
        ) : (
          <AreaChart data={dados} margin={{ top: 4, right: 4, left: -14, bottom: 0 }}>
            <CartesianGrid vertical={false} stroke="#f1f5f9" />
            <XAxis dataKey="label" {...eixo} interval="preserveStartEnd" minTickGap={18} />
            <YAxis allowDecimals={false} {...eixo} width={40} />
            {tip}
            <Area type="monotone" dataKey="valor" name={nome} stroke="var(--color-brand, #0f766e)" fill="var(--color-brand, #0f766e)" fillOpacity={0.15} strokeWidth={2} />
          </AreaChart>
        )}
      </ResponsiveContainer>
      <p className="mt-1 flex items-center gap-1.5 text-[11px] text-slate-500"><span className="h-2 w-3 rounded-sm bg-brand" />{nome}</p>
    </div>
  );
}

function Page() {
  const [periodo, setPeriodo] = useState<PeriodoId>("30d");
  const [custom, setCustom] = useState({ de: "", ate: "" });
  const [estado, setEstado] = useState<{ s: "loading" } | { s: "erro" } | { s: "ok"; d: AnalisesResultado }>({ s: "loading" });
  const [tentativa, setTentativa] = useState(0);

  const r = useMemo(() => intervaloPeriodo(periodo, new Date(), custom), [periodo, custom]);

  useEffect(() => {
    if (!r) return;
    let vivo = true;
    setEstado({ s: "loading" });
    criarFonte()
      .then((fonte) => (fonte ? carregarAnalises(fonte, r) : Promise.reject(new Error("sem loja"))))
      .then((d) => vivo && setEstado({ s: "ok", d }))
      .catch(() => vivo && setEstado({ s: "erro" }));
    return () => { vivo = false; };
  }, [r, tentativa]);

  return (
    <PageShell>
      <PageHeader title="Análises" subtitle={DESC} />

      <div className="flex flex-col gap-2">
        <div className="flex flex-col gap-1 text-[12px] font-semibold text-slate-600">
          Período
          <SheetSelect value={periodo} title="Período" ariaLabel="Período" options={PERIODOS_ANALISE.map((p) => ({ value: p.id, label: p.label }))}
            onChange={(s) => { const v = s as PeriodoId; setPeriodo(v); if (v === "personalizado" && !custom.de) { const h = hojeISO(); setCustom({ de: h, ate: h }); } }} />
        </div>
        {periodo === "personalizado" && (
          <div className="grid grid-cols-2 gap-2">
            {(["de", "ate"] as const).map((k) => (
              <label key={k} className="flex flex-col gap-1 text-[12px] font-semibold text-slate-600">
                {k === "de" ? "Data inicial" : "Data final"}
                <input type="date" value={custom[k]} max={hojeISO()} onChange={(e) => setCustom((c) => ({ ...c, [k]: e.target.value }))} className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-[14px] text-ink" />
              </label>
            ))}
            {!r && <p className="col-span-2 text-[12px] text-rose-600">A data final tem de ser igual ou posterior à inicial.</p>}
          </div>
        )}
      </div>

      {!r ? null : estado.s === "loading" ? (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4" aria-busy="true">
          {Array.from({ length: 6 }).map((_, i) => <div key={i} className={`animate-pulse rounded-2xl bg-slate-100 ${i > 3 ? "col-span-2 h-56 lg:col-span-2" : "h-24"}`} />)}
        </div>
      ) : estado.s === "erro" ? (
        <Card title="Não foi possível carregar as análises">
          <p className="mb-3 text-[13px] text-slate-600">Verifica a ligação e tenta novamente.</p>
          <button onClick={() => setTentativa((n) => n + 1)} className="rounded-xl bg-brand px-4 py-2 text-[13px] font-bold text-white">Tentar novamente</button>
        </Card>
      ) : (
        <Conteudo d={estado.d} />
      )}
    </PageShell>
  );
}

function Conteudo({ d }: { d: AnalisesResultado }) {
  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kpi label="Pedidos recebidos" ind={d.pedidos} render={fmt} />
        <Kpi label="Valor dos pedidos" ind={d.valorPedidos} render={(v) => `${fmt(v)} ${MOEDA}`} nota="Exclui cancelados" />
        <Kpi label="Visitas à loja" ind={d.visitas} render={fmt} />
        <Kpi label="Taxa de conversão" ind={d.conversao} render={pct} nota="Pedidos ÷ visitas" />
      </div>

      <h2 className="mt-2 text-[16px] font-bold text-ink">Desempenho da loja</h2>
      <div className="grid gap-4 lg:grid-cols-2">
        <Card title="Evolução dos pedidos">
          {d.totalPedidos === 0 ? <Vazio t="Sem pedidos neste período." /> : <Grafico dados={d.seriePedidos} tipo="bar" nome="Pedidos" />}
        </Card>
        <Card title="Evolução das visitas">
          {d.serieVisitas.length === 0 || d.visitas.valor === 0 ? <Vazio t="Ainda sem visitas registadas neste período." /> : <Grafico dados={d.serieVisitas} tipo="area" nome="Visitas" />}
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card title="Produtos mais vendidos">
          {d.topProdutos.length === 0 ? <Vazio t="Sem produtos vendidos neste período." /> : (
            <ol className="divide-y divide-slate-100">
              {d.topProdutos.map((p) => (
                <li key={p.nome} className="flex items-center gap-3 py-2.5">
                  <span className="w-5 shrink-0 text-center text-[13px] font-black text-slate-400">{p.posicao}</span>
                  {p.imagem ? <img src={p.imagem} alt="" className="h-10 w-10 shrink-0 rounded-lg bg-slate-100 object-cover" /> : <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-slate-100"><Package className="h-4 w-4 text-slate-400" /></span>}
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[13px] font-semibold text-ink">{p.nome}</span>
                    <span className="text-[11.5px] text-slate-500">{fmt(p.unidades)} un. vendidas</span>
                  </span>
                  <span className="shrink-0 text-[12.5px] font-bold text-ink">{fmt(p.valor)} {MOEDA}</span>
                </li>
              ))}
            </ol>
          )}
        </Card>

        <Card title="Pedidos por estado">
          {d.estados.length === 0 ? <Vazio t="Sem pedidos neste período." /> : (
            <ul className="flex flex-col gap-3">
              {d.estados.map((e) => (
                <li key={e.status} className="text-[13px]">
                  <div className="mb-1 flex justify-between">
                    <span className="text-slate-600">{e.label}</span>
                    <span className="font-semibold text-ink">{e.n} <span className="font-normal text-slate-400">· {pct(e.pct)}</span></span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-100"><div className="h-2 rounded-full bg-brand" style={{ width: `${e.pct * 100}%` }} /></div>
                </li>
              ))}
              <li className="text-[11.5px] text-slate-400">Total: {d.totalPedidos} pedidos no período.</li>
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}

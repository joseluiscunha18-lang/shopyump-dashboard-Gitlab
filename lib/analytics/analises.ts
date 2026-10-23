import type { Pedido, PedidoStatus } from "@/types/database";
import { DAY, STATUS_LABEL } from "@/lib/analytics/demoAnalytics";

/**
 * Cálculos da página Análises — funções puras, sem UI.
 * A fonte de dados entra por `AnalisesFonte`; hoje é local (simulada),
 * no futuro um serviço autenticado que devolve só a loja do utilizador.
 */

export type PeriodoId = "hoje" | "ontem" | "7d" | "30d" | "90d" | "este_mes" | "mes_anterior" | "personalizado";
export interface Intervalo { inicio: number; fim: number }

export const PERIODOS_ANALISE: { id: PeriodoId; label: string }[] = [
  { id: "hoje", label: "Hoje" },
  { id: "ontem", label: "Ontem" },
  { id: "7d", label: "Últimos 7 dias" },
  { id: "30d", label: "Últimos 30 dias" },
  { id: "90d", label: "Últimos 90 dias" },
  { id: "este_mes", label: "Este mês" },
  { id: "mes_anterior", label: "Mês anterior" },
  { id: "personalizado", label: "Período personalizado" },
];

const inicioDia = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();

/** Intervalo [inicio, fim) para um período. `custom` usa datas YYYY-MM-DD inclusivas. */
export function intervaloPeriodo(p: PeriodoId, agora = new Date(), custom?: { de: string; ate: string }): Intervalo | null {
  const hoje = inicioDia(agora);
  const amanha = hoje + DAY;
  const y = agora.getFullYear(), m = agora.getMonth();
  switch (p) {
    case "hoje": return { inicio: hoje, fim: amanha };
    case "ontem": return { inicio: hoje - DAY, fim: hoje };
    case "7d": return { inicio: amanha - 7 * DAY, fim: amanha };
    case "30d": return { inicio: amanha - 30 * DAY, fim: amanha };
    case "90d": return { inicio: amanha - 90 * DAY, fim: amanha };
    case "este_mes": return { inicio: new Date(y, m, 1).getTime(), fim: amanha };
    case "mes_anterior": return { inicio: new Date(y, m - 1, 1).getTime(), fim: new Date(y, m, 1).getTime() };
    case "personalizado": {
      if (!custom?.de || !custom?.ate) return null;
      const [a, b] = [custom.de, custom.ate].map((s) => { const [yy, mm, dd] = s.split("-").map(Number); return new Date(yy!, mm! - 1, dd!).getTime(); });
      if (!Number.isFinite(a) || !Number.isFinite(b) || b! < a!) return null;
      return { inicio: a!, fim: b! + DAY };
    }
  }
}

export const intervaloComparavel = (r: Intervalo): Intervalo => ({ inicio: r.inicio - (r.fim - r.inicio), fim: r.inicio });

export interface Indicador { valor: number | null; variacao: number | null }
export interface PontoSerie { t: number; label: string; valor: number }
export interface ProdutoTop { posicao: number; nome: string; imagem?: string; unidades: number; valor: number }
export interface EstadoContagem { status: PedidoStatus; label: string; n: number; pct: number }

export interface AnalisesResultado {
  pedidos: Indicador;
  valorPedidos: Indicador;
  visitas: Indicador;
  conversao: Indicador;
  seriePedidos: PontoSerie[];
  serieVisitas: PontoSerie[];
  topProdutos: ProdutoTop[];
  estados: EstadoContagem[];
  totalPedidos: number;
}

/** Contrato da fonte de dados. Substituir pela implementação real (serviço autorizado). */
export interface AnalisesFonte {
  pedidos(r: Intervalo): Promise<Pedido[]>;
  /** Visitas por dia (início do dia → contagem). Vazio = sem registo. */
  visitas(r: Intervalo): Promise<Map<number, number>>;
}

const dentro = (iso: string, r: Intervalo) => { const t = +new Date(iso); return t >= r.inicio && t < r.fim; };
const unicos = (ps: Pedido[]) => [...new Map(ps.map((p) => [p.id, p])).values()];

export const variacaoPct = (atual: number, anterior: number) => (anterior > 0 ? (atual - anterior) / anterior : null);
export const somaValor = (ps: Pedido[]) => unicos(ps).filter((p) => p.status !== "cancelado").reduce((a, p) => a + p.total, 0);
/** Conversão = pedidos ÷ visitas; nula sem visitas. */
export const conversao = (pedidos: number, visitas: number) => (visitas > 0 ? pedidos / visitas : null);

export const ORDEM_ESTADOS: PedidoStatus[] = ["pendente", "confirmado", "enviado", "concluido", "cancelado"];

export function contarEstados(ps: Pedido[]): EstadoContagem[] {
  const lista = unicos(ps);
  return ORDEM_ESTADOS.map((s) => {
    const n = lista.filter((p) => p.status === s).length;
    return { status: s, label: STATUS_LABEL[s], n, pct: lista.length ? n / lista.length : 0 };
  }).filter((e) => e.n > 0);
}

export function rankingProdutos(ps: Pedido[], limite = 5): ProdutoTop[] {
  const m = new Map<string, Omit<ProdutoTop, "posicao">>();
  for (const p of unicos(ps)) {
    if (p.status === "cancelado") continue;
    for (const i of p.itens) {
      const c = m.get(i.nome) ?? { nome: i.nome, imagem: i.imagem, unidades: 0, valor: 0 };
      c.unidades += i.quantidade;
      c.valor += i.quantidade * i.preco;
      c.imagem ??= i.imagem;
      m.set(i.nome, c);
    }
  }
  return [...m.values()]
    .sort((a, b) => b.unidades - a.unidades || b.valor - a.valor || a.nome.localeCompare(b.nome))
    .slice(0, limite)
    .map((x, k) => ({ ...x, posicao: k + 1 }));
}

const fmtDia = new Intl.DateTimeFormat("pt-PT", { day: "2-digit", month: "short" });

/** Agrupa por dia (≤ 31 dias) ou por semana (períodos maiores). */
export function serie(r: Intervalo, valorDia: (t: number) => number): PontoSerie[] {
  const dias = Math.max(1, Math.round((r.fim - r.inicio) / DAY));
  const passo = dias > 31 ? 7 : 1;
  const out: PontoSerie[] = [];
  for (let t = r.inicio; t < r.fim; t += passo * DAY) {
    let v = 0;
    for (let k = 0; k < passo && t + k * DAY < r.fim; k++) v += valorDia(t + k * DAY);
    out.push({ t, label: fmtDia.format(new Date(t)).replace(".", ""), valor: v });
  }
  return out;
}

export function calcularAnalises(
  r: Intervalo,
  pedidosAtual: Pedido[],
  pedidosAnt: Pedido[],
  visitasAtual: Map<number, number>,
  visitasAnt: Map<number, number>,
): AnalisesResultado {
  const atual = unicos(pedidosAtual.filter((p) => dentro(p.created_at, r)));
  const ant = unicos(pedidosAnt);
  const somaMapa = (m: Map<number, number>) => [...m.values()].reduce((a, b) => a + b, 0);
  const vA = somaMapa(visitasAtual), vB = somaMapa(visitasAnt);
  const temVisitas = visitasAtual.size > 0;
  const conv = temVisitas ? conversao(atual.length, vA) : null;
  const convAnt = visitasAnt.size > 0 ? conversao(ant.length, vB) : null;
  const diaDe = (iso: string) => inicioDia(new Date(iso));
  const porDia = new Map<number, number>();
  for (const p of atual) porDia.set(diaDe(p.created_at), (porDia.get(diaDe(p.created_at)) ?? 0) + 1);
  return {
    pedidos: { valor: atual.length, variacao: variacaoPct(atual.length, ant.length) },
    valorPedidos: { valor: somaValor(atual), variacao: variacaoPct(somaValor(atual), somaValor(ant)) },
    visitas: { valor: temVisitas ? vA : null, variacao: temVisitas ? variacaoPct(vA, vB) : null },
    conversao: { valor: conv, variacao: conv !== null && convAnt ? (conv - convAnt) / convAnt : null },
    seriePedidos: serie(r, (t) => porDia.get(t) ?? 0),
    serieVisitas: temVisitas ? serie(r, (t) => visitasAtual.get(t) ?? 0) : [],
    topProdutos: rankingProdutos(atual),
    estados: contarEstados(atual),
    totalPedidos: atual.length,
  };
}

/**
 * Fonte real: pedidos e visitas da loja do utilizador, lidos do Supabase
 * (a RLS garante que só vê os da própria loja).
 */
export function fonteSupabase(
  todosPedidos: () => Promise<Pedido[]>,
  visitasPorDia: (r: Intervalo) => Promise<Map<number, number>>,
): AnalisesFonte {
  // Os pedidos são lidos uma só vez por carregamento e filtrados por intervalo.
  let cache: Promise<Pedido[]> | null = null;
  const pedidos = () => (cache ??= todosPedidos());
  return {
    async pedidos(r) { return (await pedidos()).filter((p) => dentro(p.created_at, r)); },
    async visitas(r) { return visitasPorDia(r); },
  };
}

export async function carregarAnalises(fonte: AnalisesFonte, r: Intervalo) {
  const ant = intervaloComparavel(r);
  const [pa, pb, va, vb] = await Promise.all([fonte.pedidos(r), fonte.pedidos(ant), fonte.visitas(r), fonte.visitas(ant)]);
  return calcularAnalises(r, pa, pb, va, vb);
}

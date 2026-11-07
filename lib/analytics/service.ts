import type { createClient } from '@/lib/supabase/server';
import {
  AnalyticsNotConfiguredError,
  PAGE_VIEWS_TABLE,
  VISIT_SUMMARY_TABLE,
  queryAnalyticsEngine,
} from './cf';

/**
 * Serviço de analytics de uma loja: junta o Cloudflare Analytics Engine (visitas,
 * origens, dispositivos, produtos vistos, WhatsApp...) com o Supabase (pedidos).
 *
 * Conversão e "vistos mas nunca comprados" juntam os dois lados por período — não há
 * ligação 1-para-1 visita→pedido (o pedido não guarda a visita), por isso são taxas do
 * período, não atribuição por visitante.
 *
 * SQL: de propósito só se usam SUM/COUNT/MAX/GROUP BY/intDiv/toUInt32 e filtros numéricos
 * sobre `toUInt32(timestamp)` — o cálculo fino (períodos, fusos, médias) fica aqui em JS.
 */

export type AnalyticsRange = 'today' | '7d' | '30d' | '90d';
export const ANALYTICS_RANGES: readonly AnalyticsRange[] = ['today', '7d', '30d', '90d'];

/** Moçambique (Africa/Maputo) = UTC+2, sem horário de verão. Igual ao Worker. */
const TZ = 2 * 3600;
const HOUR = 3600;
const DAY = 86400;

export interface PeriodTotals {
  visitas: number;
  visitantes_unicos: number;
  /** 1 − únicos/visitas: quanto do tráfego é de gente que voltou no mesmo dia. */
  taxa_repeticao: number;
  pedidos: number;
  /** pedidos ÷ visitas. */
  conversao: number;
  /** Visitas que enviaram o resumo do browser (base das médias abaixo). */
  visitas_com_resumo: number;
  duracao_media_s: number;
  paginas_por_visita: number;
  cliques_whatsapp: number;
  /** cliques ÷ visitas com resumo. */
  taxa_clique_whatsapp: number;
}

export interface StoreAnalytics {
  configured: true;
  range: AnalyticsRange;
  generated_at: string;
  atual: PeriodTotals;
  anterior: PeriodTotals;
  serie: { granularidade: 'hora' | 'dia'; pontos: { chave: string; visitas: number; unicos: number | null }[] };
  /** Visitas por hora do dia (0–23), hora local. */
  horas: number[];
  /** Visitas por dia da semana (seg=0 … dom=6). */
  dias_semana: number[];
  fontes: { fonte: string; visitas: number; visitas_com_resumo: number; cliques_whatsapp: number; taxa_clique: number }[];
  campanhas: { campanha: string; visitas: number }[];
  dispositivos: { mobile: number; desktop: number; tablet: number };
  paises: { pais: string; visitas: number }[];
  cidades: { cidade: string; visitas: number }[];
  produtos: { id: string; nome: string; vistas: number; pedidos: number; conversao: number }[];
  vistos_nunca_comprados: { id: string; nome: string; vistas: number }[];
  whatsapp: { cliques: number; pedidos: number; /** pedidos ÷ cliques (aproximado, ver cabeçalho) */ pedidos_por_clique: number };
}

type Row = Record<string, unknown>;
const num = (v: unknown): number => {
  const x = Number(v);
  return Number.isFinite(x) ? x : 0;
};
const str = (v: unknown): string => (v == null ? '' : String(v));
const ratio = (a: number, b: number) => (b > 0 ? a / b : 0);

/** Janela do período atual e do anterior (mesmo comprimento), alinhadas à meia-noite local. */
function windows(range: AnalyticsRange, nowSec: number) {
  const days = range === 'today' ? 1 : range === '7d' ? 7 : range === '30d' ? 30 : 90;
  const todayStart = Math.floor((nowSec + TZ) / DAY) * DAY - TZ;
  const from = todayStart - (days - 1) * DAY;
  const elapsed = nowSec - from;
  const prevFrom = from - days * DAY;
  return { days, from, to: nowSec, prevFrom, prevTo: prevFrom + elapsed };
}

const inCurrent = (startSec: number, w: ReturnType<typeof windows>) => startSec >= w.from && startSec < w.to;
const inPrevious = (startSec: number, w: ReturnType<typeof windows>) => startSec >= w.prevFrom && startSec < w.prevTo;

async function safeQuery(sql: string): Promise<Row[]> {
  try {
    return await queryAnalyticsEngine<Row>(sql);
  } catch (e) {
    if (e instanceof AnalyticsNotConfiguredError) throw e;
    // Dataset ainda sem dados (nenhuma escrita desde que os bindings foram criados) = vazio.
    if (e instanceof Error && /unknown table|no such table|does not exist|table .* not found/i.test(e.message)) return [];
    throw e;
  }
}

type SupabaseClient = Awaited<ReturnType<typeof createClient>>;

export async function getStoreAnalytics(opts: {
  slug: string;
  lojaId: string;
  range: AnalyticsRange;
  supabase: SupabaseClient;
  nowSec?: number;
}): Promise<StoreAnalytics> {
  const { slug, lojaId, range, supabase } = opts;
  // O slug vai para o SQL: só se aceita um subdomínio válido (nunca texto livre).
  if (!/^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?$/.test(slug)) throw new Error('slug inválido');

  const w = windows(range, opts.nowSec ?? Math.floor(Date.now() / 1000));
  const fromTs = `toUInt32(timestamp) >= ${Math.floor(w.prevFrom)}`;
  const curTs = `toUInt32(timestamp) >= ${Math.floor(w.from)}`;
  const pv = `FROM ${PAGE_VIEWS_TABLE} WHERE index1 = '${slug}'`;
  const vs = `FROM ${VISIT_SUMMARY_TABLE} WHERE index1 = '${slug}'`;

  const [hourly, dailyUniques, dims, summary, pedidosRes, produtosRes] = await Promise.all([
    // Visitas por hora (período atual + anterior). Hora local = h % 24.
    safeQuery(`SELECT intDiv(toUInt32(timestamp) + ${TZ}, ${HOUR}) AS h, SUM(_sample_interval) AS v ${pv} AND ${fromTs} GROUP BY h ORDER BY h LIMIT 10000`),
    // Visitantes únicos POR DIA (o visitor_id muda todos os dias → não se somam entre dias de outra forma).
    safeQuery(`SELECT intDiv(toUInt32(timestamp) + ${TZ}, ${DAY}) AS d, COUNT(DISTINCT blob9) AS u ${pv} AND ${fromTs} GROUP BY d ORDER BY d LIMIT 400`),
    // Dimensões do período atual numa só leitura (origem, campanha, dispositivo, país, cidade).
    safeQuery(`SELECT blob10 AS fonte, blob6 AS camp, blob7 AS dev, blob8 AS pais, blob11 AS cidade, SUM(_sample_interval) AS v ${pv} AND ${curTs} GROUP BY fonte, camp, dev, pais, cidade LIMIT 5000`),
    // Resumos de visita (período atual + anterior). Um visit_id pode ter até 3 envios → junta-se em JS.
    safeQuery(`SELECT intDiv(toUInt32(timestamp) + ${TZ}, ${DAY}) AS d, blob1 AS vid, blob2 AS prods, blob3 AS w, blob5 AS fonte, MAX(double1) AS dur, MAX(double2) AS pgs ${vs} AND ${fromTs} GROUP BY d, vid, prods, w, fonte LIMIT 10000`),
    supabase
      .from('pedidos')
      .select('created_at, status, itens')
      .eq('loja_id', opts.lojaId)
      .gte('created_at', new Date(w.prevFrom * 1000).toISOString())
      .order('created_at', { ascending: false })
      .limit(5000),
    supabase.from('produtos').select('id, nome').eq('loja_id', lojaId).limit(1000),
  ]);

  /* ---------- visitas por hora ---------- */
  const horas = Array<number>(24).fill(0);
  const diasSemana = Array<number>(7).fill(0);
  const hourlyByDay = new Map<number, number>();
  const hourlyCurrent: { h: number; v: number }[] = [];
  let visitasAtual = 0;
  let visitasAnterior = 0;
  for (const r of hourly) {
    const h = num(r.h);
    const v = num(r.v);
    const start = h * HOUR - TZ;
    if (inCurrent(start, w)) {
      visitasAtual += v;
      horas[h % 24] += v;
      const dayIndex = Math.floor(h / 24);
      diasSemana[(dayIndex + 3) % 7] += v; // 1970-01-01 foi uma quinta-feira → seg=0
      hourlyByDay.set(dayIndex, (hourlyByDay.get(dayIndex) ?? 0) + v);
      hourlyCurrent.push({ h, v });
    } else if (inPrevious(start, w)) {
      visitasAnterior += v;
    }
  }

  /* ---------- únicos por dia ---------- */
  const uniquesByDay = new Map<number, number>();
  let unicosAtual = 0;
  let unicosAnterior = 0;
  for (const r of dailyUniques) {
    const d = num(r.d);
    const u = num(r.u);
    const start = d * DAY - TZ;
    uniquesByDay.set(d, u);
    if (inCurrent(start, w) || (start < w.from && start + DAY > w.from && start + DAY <= w.to + DAY && start >= w.from - DAY && start + DAY > w.from)) {
      if (start >= w.from) unicosAtual += u;
    } else if (inPrevious(start, w)) {
      unicosAnterior += u;
    }
  }

  /* ---------- série ---------- */
  const serie: StoreAnalytics['serie'] =
    range === 'today'
      ? {
          granularidade: 'hora',
          pontos: Array.from({ length: Math.min(24, Math.floor((w.to - w.from) / HOUR) + 1) }, (_, i) => {
            const h = Math.floor((w.from + TZ) / HOUR) + i;
            return { chave: `${String(h % 24).padStart(2, '0')}:00`, visitas: hourlyCurrent.find((x) => x.h === h)?.v ?? 0, unicos: null };
          }),
        }
      : {
          granularidade: 'dia',
          pontos: Array.from({ length: w.days }, (_, i) => {
            const d = Math.floor((w.from + TZ) / DAY) + i;
            return {
              chave: new Date(d * DAY * 1000).toISOString().slice(0, 10),
              visitas: hourlyByDay.get(d) ?? 0,
              unicos: uniquesByDay.get(d) ?? 0,
            };
          }),
        };

  /* ---------- dimensões ---------- */
  const fontesMap = new Map<string, number>();
  const campMap = new Map<string, number>();
  const paisMap = new Map<string, number>();
  const cidadeMap = new Map<string, number>();
  const dispositivos = { mobile: 0, desktop: 0, tablet: 0 };
  for (const r of dims) {
    const v = num(r.v);
    const fonte = str(r.fonte) || 'direct';
    fontesMap.set(fonte, (fontesMap.get(fonte) ?? 0) + v);
    if (str(r.camp)) campMap.set(str(r.camp), (campMap.get(str(r.camp)) ?? 0) + v);
    if (str(r.pais)) paisMap.set(str(r.pais), (paisMap.get(str(r.pais)) ?? 0) + v);
    if (str(r.cidade)) cidadeMap.set(str(r.cidade), (cidadeMap.get(str(r.cidade)) ?? 0) + v);
    const dev = str(r.dev);
    if (dev === 'mobile' || dev === 'desktop' || dev === 'tablet') dispositivos[dev] += v;
  }
  const top = <K extends string>(m: Map<string, number>, key: K, n: number) =>
    [...m.entries()].sort((a, b) => b[1] - a[1]).slice(0, n).map(([k, visitas]) => ({ [key]: k, visitas }) as Record<K, string> & { visitas: number });

  /* ---------- resumos de visita (junta os envios do mesmo visit_id) ---------- */
  interface Visit { start: number; dur: number; pgs: number; whatsapp: boolean; fonte: string; products: Set<string> }
  const visits = new Map<string, Visit>();
  for (const r of summary) {
    const vid = str(r.vid);
    if (!vid) continue;
    const start = num(r.d) * DAY - TZ;
    const v = visits.get(vid) ?? { start, dur: 0, pgs: 0, whatsapp: false, fonte: str(r.fonte) || 'direct', products: new Set<string>() };
    v.start = Math.min(v.start, start);
    v.dur = Math.max(v.dur, num(r.dur));
    v.pgs = Math.max(v.pgs, num(r.pgs));
    if (str(r.w) === 'whatsapp_click') v.whatsapp = true;
    for (const id of str(r.prods).split(',')) if (id) v.products.add(id);
    visits.set(vid, v);
  }

  const sums = {
    atual: { n: 0, dur: 0, pgs: 0, wa: 0 },
    anterior: { n: 0, dur: 0, pgs: 0, wa: 0 },
  };
  const viewsByProduct = new Map<string, number>();
  const fontesResumo = new Map<string, { n: number; wa: number }>();
  for (const v of visits.values()) {
    const bucket = inCurrent(v.start, w) ? sums.atual : inPrevious(v.start, w) ? sums.anterior : null;
    if (!bucket) continue;
    bucket.n += 1;
    bucket.dur += v.dur;
    bucket.pgs += v.pgs;
    if (v.whatsapp) bucket.wa += 1;
    if (bucket === sums.atual) {
      for (const id of v.products) viewsByProduct.set(id, (viewsByProduct.get(id) ?? 0) + 1);
      const f = fontesResumo.get(v.fonte) ?? { n: 0, wa: 0 };
      f.n += 1;
      if (v.whatsapp) f.wa += 1;
      fontesResumo.set(v.fonte, f);
    }
  }

  /* ---------- pedidos (Supabase) ---------- */
  let pedidosAtual = 0;
  let pedidosAnterior = 0;
  const ordersByProduct = new Map<string, number>();
  for (const p of pedidosRes.data ?? []) {
    if (p.status === 'cancelado') continue;
    const t = Math.floor(new Date(p.created_at as string).getTime() / 1000);
    if (inCurrent(t, w)) {
      pedidosAtual += 1;
      const ids = new Set<string>();
      if (Array.isArray(p.itens)) for (const it of p.itens as { id?: unknown }[]) if (it && typeof it.id === 'string') ids.add(it.id);
      for (const id of ids) ordersByProduct.set(id, (ordersByProduct.get(id) ?? 0) + 1);
    } else if (inPrevious(t, w)) {
      pedidosAnterior += 1;
    }
  }

  /* ---------- produtos ---------- */
  const names = new Map<string, string>((produtosRes.data ?? []).map((p) => [p.id as string, p.nome as string]));
  const produtos = [...new Set([...viewsByProduct.keys(), ...ordersByProduct.keys()])]
    .filter((id) => names.has(id))
    .map((id) => {
      const vistas = viewsByProduct.get(id) ?? 0;
      const pedidos = ordersByProduct.get(id) ?? 0;
      return { id, nome: names.get(id)!, vistas, pedidos, conversao: Math.min(1, ratio(pedidos, vistas)) };
    })
    .sort((a, b) => b.vistas - a.vistas || b.pedidos - a.pedidos);

  const totals = (visitas: number, unicos: number, pedidos: number, s: { n: number; dur: number; pgs: number; wa: number }): PeriodTotals => ({
    visitas,
    visitantes_unicos: unicos,
    taxa_repeticao: Math.max(0, 1 - ratio(unicos, visitas)),
    pedidos,
    conversao: ratio(pedidos, visitas),
    visitas_com_resumo: s.n,
    duracao_media_s: ratio(s.dur, s.n),
    paginas_por_visita: ratio(s.pgs, s.n),
    cliques_whatsapp: s.wa,
    taxa_clique_whatsapp: ratio(s.wa, s.n),
  });

  return {
    configured: true,
    range,
    generated_at: new Date().toISOString(),
    atual: totals(visitasAtual, unicosAtual, pedidosAtual, sums.atual),
    anterior: totals(visitasAnterior, unicosAnterior, pedidosAnterior, sums.anterior),
    serie,
    horas,
    dias_semana: diasSemana,
    fontes: [...fontesMap.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 12)
      .map(([fonte, visitas]) => {
        const r = fontesResumo.get(fonte) ?? { n: 0, wa: 0 };
        return { fonte, visitas, visitas_com_resumo: r.n, cliques_whatsapp: r.wa, taxa_clique: ratio(r.wa, r.n) };
      }),
    campanhas: top(campMap, 'campanha', 10),
    dispositivos,
    paises: top(paisMap, 'pais', 10),
    cidades: top(cidadeMap, 'cidade', 10),
    produtos: produtos.slice(0, 20),
    vistos_nunca_comprados: produtos.filter((p) => p.pedidos === 0).slice(0, 10).map(({ id, nome, vistas }) => ({ id, nome, vistas })),
    whatsapp: { cliques: sums.atual.wa, pedidos: pedidosAtual, pedidos_por_clique: ratio(pedidosAtual, sums.atual.wa) },
  };
}

import type { Pedido, PedidoStatus, Produto } from "@/types/database";

/** Regras de negócio da Home e das Análises (dados de demonstração). */

export const DAY = 86400000;

export const STATUS_LABEL: Record<PedidoStatus, string> = {
  pendente: "Novo",
  confirmado: "Confirmado",
  enviado: "Enviado",
  concluido: "Concluído",
  cancelado: "Cancelado",
};

/** Um pedido é "novo" apenas pelo seu estado atual — abrir não muda nada. */
export const contarNovos = (pedidos: Pedido[]) => pedidos.filter((p) => p.status === "pendente").length;

export function pedidosHome(pedidos: Pedido[]): { titulo: string; lista: Pedido[] } | null {
  if (pedidos.length === 0) return null;
  const ord = [...pedidos].sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at));
  const novos = ord.filter((p) => p.status === "pendente");
  if (novos.length > 0) return { titulo: "Pedidos por tratar", lista: novos.slice(0, 3) };
  return { titulo: "Pedidos recentes", lista: ord.slice(0, 3) };
}

export type Periodo = "7d" | "30d" | "90d" | "este_mes" | "mes_anterior";
export const PERIODOS: { id: Periodo; label: string }[] = [
  { id: "7d", label: "Últimos 7 dias" },
  { id: "30d", label: "Últimos 30 dias" },
  { id: "90d", label: "Últimos 90 dias" },
  { id: "este_mes", label: "Este mês" },
  { id: "mes_anterior", label: "Mês anterior" },
];

export function intervalo(p: Periodo, agora = new Date()): { inicio: number; fim: number } {
  const fim = agora.getTime();
  if (p === "7d") return { inicio: fim - 7 * DAY, fim };
  if (p === "30d") return { inicio: fim - 30 * DAY, fim };
  if (p === "90d") return { inicio: fim - 90 * DAY, fim };
  const y = agora.getFullYear(), m = agora.getMonth();
  if (p === "este_mes") return { inicio: new Date(y, m, 1).getTime(), fim };
  return { inicio: new Date(y, m - 1, 1).getTime(), fim: new Date(y, m, 1).getTime() };
}

export function intervaloAnterior(r: { inicio: number; fim: number }) {
  const d = r.fim - r.inicio;
  return { inicio: r.inicio - d, fim: r.inicio };
}

const dentro = (iso: string, r: { inicio: number; fim: number }) => {
  const t = +new Date(iso);
  return t >= r.inicio && t < r.fim;
};

export const pedidosNoPeriodo = (pedidos: Pedido[], r: { inicio: number; fim: number }) =>
  pedidos.filter((p) => dentro(p.created_at, r));

/** Valor total dos pedidos (não cancelados) — não é dinheiro recebido nem lucro. */
export const valorPedidos = (pedidos: Pedido[]) =>
  pedidos.filter((p) => p.status !== "cancelado").reduce((a, p) => a + p.total, 0);

/** Conversão = pedidos ÷ visitas. Nula quando não é calculável. */
export const taxaConversao = (pedidos: number, visitas: number) => (visitas > 0 ? pedidos / visitas : null);

/** Variação face ao período anterior; nula se o anterior for zero. */
export const variacao = (atual: number, anterior: number) => (anterior > 0 ? (atual - anterior) / anterior : null);

export function porEstado(pedidos: Pedido[]) {
  const m = new Map<PedidoStatus, number>();
  for (const p of pedidos) m.set(p.status, (m.get(p.status) ?? 0) + 1);
  return [...m.entries()].map(([status, n]) => ({ status, label: STATUS_LABEL[status], n }));
}

export function topProdutos(pedidos: Pedido[]) {
  const m = new Map<string, { nome: string; unidades: number; valor: number }>();
  for (const p of pedidos) {
    if (p.status === "cancelado") continue;
    for (const i of p.itens) {
      const cur = m.get(i.nome) ?? { nome: i.nome, unidades: 0, valor: 0 };
      cur.unidades += i.quantidade;
      cur.valor += i.quantidade * i.preco;
      m.set(i.nome, cur);
    }
  }
  return [...m.values()].sort((a, b) => b.unidades - a.unidades).slice(0, 5);
}

export interface Atividade { id: string; texto: string; quando: string }

/** Atividade recente — exclui pedidos já destacados na Home. */
export function atividadeRecente(produtos: Produto[], pedidos: Pedido[], destacados: string[] = []): Atividade[] {
  const ev: Atividade[] = [
    ...produtos.filter((p) => !p.rascunho).map((p) => ({ id: "p" + p.id, texto: `Produto adicionado: ${p.nome}`, quando: p.created_at })),
    ...pedidos
      .filter((p) => p.status === "concluido" && !destacados.includes(p.id))
      .map((p) => ({ id: "o" + p.id, texto: `Pedido concluído · ${p.cliente_nome}`, quando: p.created_at })),
  ];
  return ev.sort((a, b) => +new Date(b.quando) - +new Date(a.quando)).slice(0, 5);
}

export function tempoRelativo(iso: string, agora = Date.now()) {
  const h = Math.floor((agora - +new Date(iso)) / 3600000);
  if (h < 1) return "agora";
  if (h < 24) return `há ${h} h`;
  const d = Math.floor(h / 24);
  return d === 1 ? "ontem" : `há ${d} dias`;
}

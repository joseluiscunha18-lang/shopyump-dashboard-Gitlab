/** Conversas do assistente: modelo, armazenamento local, classificação de erros e resposta (demo, em streaming). */
import type { Anexo } from "./handoff";

export type EstadoMsg = "enviando" | "processando" | "respondendo" | "concluido" | "erro" | "cancelado";
export type TipoErro = "ligacao" | "timeout" | "limite" | "servidor";

export interface Msg {
  id: string;
  /** Identificador único do pedido; uma repetição reutiliza-o (idempotência). */
  pedidoId?: string;
  autor: "eu" | "ia";
  texto: string;
  anexos: Anexo[];
  estado?: EstadoMsg;
  erro?: TipoErro;
}
export interface Conversa { id: string; titulo: string; criadaEm: number; atualizadaEm: number; msgs: Msg[]; }

export const CHAVE = "shopyump-assistente-conversas-v2";
const CHAVE_ANTIGA = "shopyump-assistente-conversa";

export const MENSAGEM_ERRO = "Não foi possível obter uma resposta. Tenta novamente.";
export const DETALHE_ERRO: Record<TipoErro, string> = {
  ligacao: "Sem ligação à internet.",
  timeout: "A resposta demorou demasiado.",
  limite: "Limite de utilização atingido. Aguarda um pouco.",
  servidor: "O serviço está com problemas.",
};

/** Título a partir da primeira mensagem, curto e sem «loja» no fim. */
export function gerarTitulo(texto: string): string {
  let t = texto.replace(/\s+/g, " ").trim();
  if (!t) return "Nova conversa";
  t = t.replace(/[.!?…]+$/, "").replace(/\s+(d[aeo]s?\s+|n[ao]s?\s+|[aà]\s+|em\s+)?(minha\s+|tua\s+)?loja$/i, "").trim() || t;
  if (t.length > 40) t = t.slice(0, 40).replace(/\s+\S*$/, "") + "…";
  return t.charAt(0).toUpperCase() + t.slice(1);
}

export function classificarErro(e: unknown): TipoErro {
  if (typeof navigator !== "undefined" && navigator.onLine === false) return "ligacao";
  const x = e as { name?: string; status?: number } | null;
  if (x?.name === "TimeoutError") return "timeout";
  if (x?.status === 429) return "limite";
  if (x?.name === "TypeError") return "ligacao";
  return "servidor";
}

export function novaConversa(): Conversa {
  const agora = Date.now();
  return { id: crypto.randomUUID(), titulo: "Nova conversa", criadaEm: agora, atualizadaEm: agora, msgs: [] };
}

export function carregar(): Conversa[] {
  try {
    const l = JSON.parse(localStorage.getItem(CHAVE) || "null") as Conversa[] | null;
    if (Array.isArray(l)) return l.map(sarar);
    const antigas = JSON.parse(localStorage.getItem(CHAVE_ANTIGA) || "[]") as Msg[];
    if (antigas.length) {
      const c = novaConversa();
      c.msgs = antigas; c.titulo = gerarTitulo(antigas.find((m) => m.autor === "eu")?.texto || "");
      return [c];
    }
  } catch { /* dados corrompidos */ }
  return [];
}

/** Ao recarregar, pedidos que ficaram a meio passam a «erro» (podem ser repetidos). */
function sarar(c: Conversa): Conversa {
  return { ...c, msgs: c.msgs.map((m) =>
    m.estado === "processando" || m.estado === "respondendo" || m.estado === "enviando"
      ? m.autor === "ia" ? { ...m, estado: m.texto ? "cancelado" : "erro", erro: m.texto ? undefined : "ligacao" } : { ...m, estado: "concluido" }
      : m) };
}

export function guardar(lista: Conversa[]) {
  const leve = lista.filter((c) => c.msgs.length).map((c) => ({ ...c, msgs: c.msgs.map((m) => ({ ...m, anexos: m.anexos.map((a) => ({ ...a, url: "" })) })) }));
  try { localStorage.setItem(CHAVE, JSON.stringify(leve)); } catch { /* sem espaço */ }
}

/**
 * Obtém a resposta em streaming. Hoje é uma demonstração local; quando o assistente for ligado,
 * deve chamar uma função do servidor (a chave da IA fica só no servidor) passando `pedidoId`.
 */
export async function responder(
  pedido: { pedidoId: string; texto: string; anexos: Anexo[] },
  opts: { signal: AbortSignal; onToken: (t: string) => void },
) {
  const espera = (ms: number) => new Promise<void>((res, rej) => {
    const t = setTimeout(res, ms);
    opts.signal.addEventListener("abort", () => { clearTimeout(t); rej(new DOMException("Cancelado", "AbortError")); }, { once: true });
  });
  if (typeof navigator !== "undefined" && navigator.onLine === false) throw new TypeError("offline");
  await espera(900);
  const extra = pedido.anexos.length ? ` Recebi ${pedido.anexos.length} anexo(s).` : "";
  const txt = `Entendido: «${pedido.texto || "anexo enviado"}».${extra} Este é o modo de demonstração — quando o assistente estiver ligado, vou orientar-te e executar as tarefas permitidas na tua loja.`;
  for (const palavra of txt.split(/(?<=\s)/)) { await espera(35); opts.onToken(palavra); }
}

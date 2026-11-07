'use client';

/**
 * Tracking de visitas da loja — ver ANALYTICS_SPEC.md.
 *
 * Resumo do mecanismo (não mexer sem ler o spec primeiro):
 *  - A ENTRADA na loja já é registada do lado do servidor, dentro do
 *    próprio Worker `shopyump-router` (dataset PAGE_VIEWS) — não depende
 *    deste ficheiro nem de o visitante ficar até ao fim.
 *  - Este ficheiro só acumula, em memória/sessionStorage, o que o
 *    visitante vê durante a visita (produtos, nº de páginas) e manda
 *    UM resumo (dataset VISIT_SUMMARY) quando a aba fica "hidden" — ou,
 *    se houver clique no WhatsApp antes disso, manda esse resumo já
 *    combinado com o clique, no próprio clique (não espera pelo hidden).
 *  - O destino é o MESMO domínio da loja (mesmo host), para o Worker
 *    poder tratar o pedido sem CORS: `POST /_sy/resumo`.
 *  - Nunca falha a navegação do visitante: tudo aqui é "best effort".
 */

const RESUMO_PATH = '/_sy/resumo';
const VISITA_KEY = 'sy.visita';
const EXPIRA_MS = 30 * 60 * 1000; // 30 min de inatividade = nova visita

type EstadoVisita = {
  visitId: string;
  lojaId: string;
  inicio: number;
  ultimaAtividade: number;
  produtos: string[]; // IDs, sem repetição, máx. 20
  paginas: number;
  enviado: boolean; // já mandámos o resumo desta visita (evita duplicar no 2º "hidden")
};

let estado: EstadoVisita | null = null;
let ligado = false;

function gerarId(): string {
  try {
    return crypto.randomUUID();
  } catch {
    return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  }
}

function ler(lojaId: string): EstadoVisita {
  try {
    const bruto = sessionStorage.getItem(VISITA_KEY);
    if (bruto) {
      const v = JSON.parse(bruto) as EstadoVisita;
      const ativa = v.lojaId === lojaId && Date.now() - v.ultimaAtividade < EXPIRA_MS;
      if (ativa) return v;
    }
  } catch {
    // sessionStorage indisponível (modo privado, etc.) — segue com estado só em memória
  }
  return { visitId: gerarId(), lojaId, inicio: Date.now(), ultimaAtividade: Date.now(), produtos: [], paginas: 0, enviado: false };
}

function gravar() {
  if (!estado) return;
  try {
    sessionStorage.setItem(VISITA_KEY, JSON.stringify(estado));
  } catch {
    // ignora — pior caso, perde-se o resumo desta visita, não a visita em si (essa já ficou no router)
  }
}

function enviar(extra: { whatsapp?: boolean }) {
  if (!estado || estado.enviado) return;
  const payload = {
    loja_id: estado.lojaId,
    visit_id: estado.visitId,
    produtos: estado.produtos,
    paginas: estado.paginas,
    duracao_s: Math.round((Date.now() - estado.inicio) / 1000),
    whatsapp: !!extra.whatsapp,
  };
  estado.enviado = true;
  gravar();
  try {
    const blob = new Blob([JSON.stringify(payload)], { type: 'application/json' });
    const ok = navigator.sendBeacon?.(RESUMO_PATH, blob);
    if (!ok) {
      // sendBeacon pode recusar (payload grande/indisponível) — tenta fetch com keepalive como rede de segurança
      fetch(RESUMO_PATH, { method: 'POST', body: blob, keepalive: true }).catch(() => {});
    }
  } catch {
    // nunca deixar isto rebentar a navegação do visitante
  }
}

/** Chamar uma vez, ao montar a loja (ver components/store/AnalyticsInit.tsx). */
export function initAnalytics(lojaId: string) {
  if (typeof window === 'undefined' || ligado) return;
  ligado = true;
  estado = ler(lojaId);
  estado.paginas += 1;
  estado.ultimaAtividade = Date.now();
  gravar();

  const aoEsconder = () => {
    if (document.visibilityState === 'hidden') enviar({});
  };
  document.addEventListener('visibilitychange', aoEsconder);
  window.addEventListener('pagehide', aoEsconder);
}

/** Chamar quando o visitante abre a página de um produto (navegação client-side entre produtos). */
export function trackProductView(produtoId: string) {
  if (!estado || !produtoId) return;
  estado.ultimaAtividade = Date.now();
  estado.paginas += 1;
  if (!estado.produtos.includes(produtoId)) {
    if (estado.produtos.length >= 20) estado.produtos.shift(); // guarda só os 20 mais recentes
    estado.produtos.push(produtoId);
  }
  gravar();
}

/**
 * Chamar no clique de um link/botão de WhatsApp que leva o visitante para
 * fora da loja (contacto direto, não o checkout — esse já grava o pedido
 * no Supabase, que é o sinal mais forte que existe). Dispara ANTES de a
 * navegação começar, por isso é síncrono e não espera resposta nenhuma.
 */
export function trackWhatsappClick() {
  enviar({ whatsapp: true });
}

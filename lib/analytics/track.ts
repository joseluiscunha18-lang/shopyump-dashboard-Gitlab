/**
 * Analytics da loja pública (browser) — ver ANALYTICS_SPEC.md e workers/shopyump-router.
 *
 * O visitante faz NO MÁXIMO 1 pedido por "rajada" de navegação (normalmente 1 por visita):
 *  - clica no WhatsApp → 1 beacon com o resumo da visita + o sinal de clique;
 *  - sai/oculta a aba sem clicar → 1 beacon com o resumo (visibilitychange/pagehide).
 * Entretanto só se acumula em memória (produtos vistos, páginas, duração) — nada é enviado.
 *
 * A ENTRADA na loja (page view) nunca depende deste ficheiro: o Worker regista-a no
 * servidor. Sem cookies, sem localStorage, sem IP: o `visitor_id` é calculado no Worker.
 *
 * Para não multiplicar pedidos: um 2.º/3.º envio só acontece se houver dados NOVOS
 * (produto novo, página nova ou clique) e nunca mais de MAX_SENDS por visita. O Worker
 * grava cada envio; a agregação junta-os pelo `visit_id` (máx. duração, união dos produtos).
 */
import { isReservedSubdomain, ROOT_DOMAIN } from '@/lib/domains';

/** Tem de coincidir com SUMMARY_PATH em workers/shopyump-router/index.js. */
const ENDPOINT = '/__sy/summary';
const MAX_PRODUCTS = 20;
const MAX_SENDS = 3;

interface VisitState {
  visitId: string;
  startedAt: number;
  /** IDs de produtos vistos, sem repetir, por ordem. */
  products: string[];
  pages: number;
  whatsapp: boolean;
  sends: number;
  lastSignature: string | null;
  /** Dados de entrada (origem), enviados no resumo para o Worker classificar. */
  entry: { r: string; us: string; um: string; uc: string };
  entryIsProduct: boolean;
}

let state: VisitState | null = null;

const WHATSAPP_URL = /^https?:\/\/(?:wa\.me|api\.whatsapp\.com|web\.whatsapp\.com|chat\.whatsapp\.com)(?:[/?#]|$)/i;

/** Só corre em lojas reais (nome.shopyump.com) — não no painel, no editor nem em localhost. */
function isTenantHost(hostname: string): boolean {
  const suffix = `.${ROOT_DOMAIN}`;
  if (!hostname.endsWith(suffix)) return false;
  const sub = hostname.slice(0, -suffix.length);
  return sub.length > 0 && !sub.includes('.') && !isReservedSubdomain(sub);
}

function newId(): string {
  try {
    return crypto.randomUUID();
  } catch {
    return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
  }
}

const clip = (v: string | null | undefined, n: number) => (v ?? '').slice(0, n);

/** Inicia a visita. Idempotente — seguro chamar em cada montagem do componente. */
export function initAnalytics(): void {
  if (typeof window === 'undefined' || state) return;
  if (!isTenantHost(window.location.hostname)) return;

  const params = new URLSearchParams(window.location.search);
  const entryIsProduct = /\/p\/[^/]+/.test(window.location.pathname);
  state = {
    visitId: newId(),
    startedAt: Date.now(),
    products: [],
    // A página de entrada conta como 1; o produto de entrada não conta duas vezes (ver trackProductView).
    pages: 1,
    whatsapp: false,
    sends: 0,
    lastSignature: null,
    entry: {
      r: clip(document.referrer, 500),
      us: clip(params.get('utm_source'), 80),
      um: clip(params.get('utm_medium'), 80),
      uc: clip(params.get('utm_campaign'), 120),
    },
    entryIsProduct,
  };

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') flush();
  });
  // Safari/iOS nem sempre dispara visibilitychange ao fechar a aba.
  window.addEventListener('pagehide', () => flush());
  // Qualquer link para o WhatsApp (botões do tema, contacto, "Abrir WhatsApp"...).
  document.addEventListener(
    'click',
    (event) => {
      const a = (event.target as Element | null)?.closest?.('a[href]');
      if (a && WHATSAPP_URL.test((a as HTMLAnchorElement).href)) trackWhatsappClick();
    },
    true,
  );
}

/** Chamar quando uma página de produto abre. Acumula em memória — não envia nada. */
export function trackProductView(productId: string): void {
  if (!state || !productId) return;
  if (!state.products.includes(productId) && state.products.length < MAX_PRODUCTS) state.products.push(productId);
  // O produto de entrada (link partilhado /p/<id>) já está contado na página de entrada.
  if (state.entryIsProduct && state.products.length === 1 && state.pages === 1 && !state.lastSignature) return;
  state.pages += 1;
}

/**
 * Chamar quando o visitante vai para o WhatsApp. Envia JANTO o resumo e o sinal de clique,
 * logo (antes de a página poder ficar oculta). Só conta uma vez por visita.
 */
export function trackWhatsappClick(): void {
  if (!state || state.whatsapp) return;
  state.whatsapp = true;
  flush();
}

function flush(): void {
  const s = state;
  if (!s || s.sends >= MAX_SENDS) return;
  const signature = `${s.products.join(',')}|${s.pages}|${s.whatsapp ? 1 : 0}`;
  // 1.º envio: sempre (regista a duração). Seguintes: só com dados novos.
  if (s.sends > 0 && signature === s.lastSignature) return;

  const payload = JSON.stringify({
    v: s.visitId,
    p: s.products,
    pv: s.pages,
    d: Math.round((Date.now() - s.startedAt) / 1000),
    w: s.whatsapp ? 1 : 0,
    ...s.entry,
  });

  let ok = false;
  try {
    // text/plain: evita pré-pedido CORS (e o endpoint é do mesmo domínio, de qualquer forma).
    ok = navigator.sendBeacon(ENDPOINT, new Blob([payload], { type: 'text/plain' }));
  } catch {
    ok = false;
  }
  if (!ok) {
    try {
      void fetch(ENDPOINT, { method: 'POST', body: payload, keepalive: true, headers: { 'content-type': 'text/plain' } });
      ok = true;
    } catch {
      /* analytics nunca pode partir a loja */
    }
  }
  if (ok) {
    s.sends += 1;
    s.lastSignature = signature;
  }
}

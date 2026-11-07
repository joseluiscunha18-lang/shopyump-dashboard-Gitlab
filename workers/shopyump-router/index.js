/**
 * shopyump-router — Cloudflare Worker
 *
 * 1) Faz de "router" das lojas: qualquer host que não seja o principal
 *    (nome.shopyump.com) é reencaminhado para shopyump.com com o host original
 *    em `x-shop-host` (o vercel.json faz a reescrita para /dashboard/loja/<slug>).
 * 2) Analytics (Cloudflare Analytics Engine), SEM pedidos extra do visitante:
 *    - PAGE_VIEWS: escrito aqui, no próprio pedido de entrada na loja (servidor).
 *    - VISIT_SUMMARY: o browser envia no máximo 1 beacon por visita para
 *      POST /__sy/summary (mesmo domínio da loja, por isso sem CORS).
 *
 * Ver ANALYTICS_SPEC.md e workers/shopyump-router/README.md.
 *
 * REGRA DE OURO: a análise nunca pode atrasar nem partir a loja. Tudo o que é
 * analytics está em try/catch e os bindings são opcionais (sem binding = não
 * regista nada, e a loja funciona na mesma).
 */

const ROOT = "shopyump.com";

/** Caminho do beacon do browser. Tem de coincidir com lib/analytics/track.ts. */
const SUMMARY_PATH = "/__sy/summary";

/** Moçambique (Africa/Maputo) = UTC+2, sem horário de verão. O "dia" de analytics é o dia local. */
const TZ_OFFSET_HOURS = 2;

/** Hosts que NÃO são lojas (passam direto). */
function isRootHost(host) {
  return host === ROOT || host === `www.${ROOT}` || host === `img.${ROOT}`;
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const originalHost = url.hostname;

    if (isRootHost(originalHost)) {
      return fetch(request);
    }

    // Beacon de resumo da visita: responde aqui, nunca chega à app.
    if (url.pathname === SUMMARY_PATH) {
      if (request.method === "POST") {
        try {
          await recordSummary(request, env, originalHost);
        } catch (_) {}
      }
      return new Response(null, { status: 204 });
    }

    // Entrada na loja (page view): escrita no Analytics Engine, sem bloquear a resposta.
    try {
      if (isPageView(request)) {
        ctx.waitUntil(recordPageView(request, url, env, originalHost));
      }
    } catch (_) {}

    url.hostname = ROOT;
    const headers = new Headers(request.headers);
    headers.set("x-shop-host", originalHost);

    const response = await fetch(
      new Request(url.toString(), {
        method: request.method,
        headers,
        body: request.body,
        redirect: "manual",
      })
    );

    const location = response.headers.get("location");
    if (location) {
      try {
        const loc = new URL(location, url);
        if (loc.hostname === ROOT) {
          loc.hostname = originalHost;
          const fixed = new Response(response.body, response);
          fixed.headers.set("location", loc.toString());
          return fixed;
        }
      } catch (_) {}
    }

    return response;
  },
};

/* ------------------------------------------------------------------ */
/* Analytics                                                           */
/* ------------------------------------------------------------------ */

/** O slug da loja é o subdomínio: nome.shopyump.com → "nome". Outro host → null. */
function slugFromHost(host) {
  const suffix = `.${ROOT}`;
  if (!host.endsWith(suffix)) return null;
  const slug = host.slice(0, -suffix.length);
  return /^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?$/.test(slug) ? slug : null;
}

const BOT_RE = /bot|crawl|spider|slurp|preview|facebookexternalhit|whatsapp|telegram|discord|curl|wget|python-requests|httpclient|headless|lighthouse|pingdom|uptime/i;

/** Só navegações de página reais: não conta assets, prefetch do Next, nem robôs. */
function isPageView(request) {
  if (request.method !== "GET") return false;
  const dest = request.headers.get("sec-fetch-dest");
  if (dest && dest !== "document") return false;
  const accept = request.headers.get("accept") || "";
  if (!dest && !accept.includes("text/html")) return false;
  if (request.headers.has("rsc") || request.headers.has("next-router-prefetch")) return false;
  const purpose = (request.headers.get("purpose") || request.headers.get("sec-purpose") || "").toLowerCase();
  if (purpose.includes("prefetch") || purpose.includes("prerender")) return false;
  if (BOT_RE.test(request.headers.get("user-agent") || "")) return false;
  return true;
}

function deviceType(ua) {
  if (/iPad|Tablet|PlayBook|Silk|(Android(?!.*Mobile))/i.test(ua)) return "tablet";
  if (/Mobi|iPhone|iPod|Android/i.test(ua)) return "mobile";
  return "desktop";
}

const SOURCES = [
  ["instagram", /instagram|^ig$/],
  ["facebook", /facebook|^fb$|fb\.com|fb\.me/],
  ["whatsapp", /whatsapp|wa\.me|^wa$/],
  ["tiktok", /tiktok/],
  ["google", /google|goog/],
  ["youtube", /youtube|youtu\.be/],
  ["twitter", /twitter|^t\.co$|^x$|x\.com/],
];

/** Origem do tráfego: utm_source manda; senão o host do referer; senão "direct". */
function classifySource(referer, utmSource, ownHost) {
  const utm = (utmSource || "").trim().toLowerCase();
  if (utm) {
    for (const [name, re] of SOURCES) if (re.test(utm)) return name;
    return utm.slice(0, 40);
  }
  let host = "";
  try {
    host = referer ? new URL(referer).hostname.toLowerCase() : "";
  } catch (_) {}
  if (!host) return "direct";
  if (host === ownHost || host === ROOT || host.endsWith(`.${ROOT}`)) return "direct"; // navegação interna
  for (const [name, re] of SOURCES) if (re.test(host)) return name;
  return "other";
}

/** Hash diário sem cookies: SHA-256(ip + user-agent + sal do dia). O IP nunca é guardado. */
async function visitorId(request, env) {
  const ip = request.headers.get("cf-connecting-ip") || "";
  const ua = request.headers.get("user-agent") || "";
  const day = new Date(Date.now() + TZ_OFFSET_HOURS * 3600 * 1000).toISOString().slice(0, 10);
  const data = new TextEncoder().encode(`${ip}|${ua}|${day}|${env.ANALYTICS_SALT || ""}`);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest).slice(0, 12))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

const clip = (v, n) => String(v == null ? "" : v).slice(0, n);

/**
 * PAGE_VIEWS — blobs (a ordem é o esquema; NÃO reordenar, só acrescentar no fim):
 *  index1 slug | blob1 slug | blob2 path | blob3 referer | blob4 utm_source |
 *  blob5 utm_medium | blob6 utm_campaign | blob7 device | blob8 país |
 *  blob9 visitor_id | blob10 origem (classificada) | blob11 cidade
 *  double1 timestamp (ms)
 */
async function recordPageView(request, url, env, host) {
  if (!env.PAGE_VIEWS) return;
  const slug = slugFromHost(host);
  if (!slug) return;
  const ua = request.headers.get("user-agent") || "";
  const referer = request.headers.get("referer") || "";
  const utmSource = url.searchParams.get("utm_source") || "";
  env.PAGE_VIEWS.writeDataPoint({
    indexes: [slug],
    blobs: [
      slug,
      clip(url.pathname, 300),
      clip(referer, 500),
      clip(utmSource, 80),
      clip(url.searchParams.get("utm_medium"), 80),
      clip(url.searchParams.get("utm_campaign"), 120),
      deviceType(ua),
      clip(request.cf && request.cf.country, 8),
      await visitorId(request, env),
      classifySource(referer, utmSource, host),
      clip(request.cf && request.cf.city, 60),
    ],
    doubles: [Date.now()],
  });
}

const ID_RE = /^[A-Za-z0-9_-]{1,64}$/;

/**
 * VISIT_SUMMARY — escrito a partir do beacon do browser (corpo JSON ≤ 4 KB):
 *   { v: visit_id, p: [ids de produtos vistos], pv: páginas vistas, d: duração (s),
 *     w: 1 se clicou no WhatsApp, r: referrer, us/um/uc: utm_source/medium/campaign }
 *
 *  index1 slug | blob1 visit_id | blob2 produtos (csv, máx. 20) | blob3 "whatsapp_click"|"" |
 *  blob4 visitor_id | blob5 origem | blob6 campanha | blob7 device | blob8 país
 *  double1 duração (s) | double2 páginas vistas
 */
async function recordSummary(request, env, host) {
  if (!env.VISIT_SUMMARY) return;
  const slug = slugFromHost(host);
  if (!slug) return;
  const ua = request.headers.get("user-agent") || "";
  if (BOT_RE.test(ua)) return;

  const text = await request.text();
  if (!text || text.length > 4096) return;
  let b;
  try {
    b = JSON.parse(text);
  } catch (_) {
    return;
  }
  if (!b || typeof b !== "object") return;

  const visitId = typeof b.v === "string" && ID_RE.test(b.v) ? b.v : "";
  if (!visitId) return;
  const products = (Array.isArray(b.p) ? b.p : []).filter((x) => typeof x === "string" && ID_RE.test(x)).slice(0, 20);
  const num = (x, max) => (Number.isFinite(x) ? Math.max(0, Math.min(max, Math.round(x))) : 0);

  env.VISIT_SUMMARY.writeDataPoint({
    indexes: [slug],
    blobs: [
      visitId,
      products.join(","),
      b.w === 1 ? "whatsapp_click" : "",
      await visitorId(request, env),
      classifySource(clip(b.r, 500), clip(b.us, 80), host),
      clip(b.uc, 120),
      deviceType(ua),
      clip(request.cf && request.cf.country, 8),
    ],
    doubles: [num(b.d, 86400), num(b.pv, 500)],
  });
}

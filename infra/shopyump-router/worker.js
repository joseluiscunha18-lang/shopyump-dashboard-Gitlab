// shopyump-router — proxy de host multi-tenant + analytics de visitas.
// Ver ANALYTICS_SPEC.md (raiz do repo dashboard) e infra/shopyump-router/README.md
// para o raciocínio completo e os passos de publicação (deploy manual, Cloudflare).

const ROOT = "shopyump.com";
const RESUMO_PATH = "/_sy/resumo";

/** IP + user-agent + sal do dia → hash estável só durante o próprio dia (sem cookies, sem guardar IP). */
async function visitorId(request, sal) {
  const ip = request.headers.get("cf-connecting-ip") || "";
  const ua = request.headers.get("user-agent") || "";
  const dados = new TextEncoder().encode(`${ip}|${ua}|${sal}`);
  const hash = await crypto.subtle.digest("SHA-256", dados);
  return [...new Uint8Array(hash)].map((b) => b.toString(16).padStart(2, "0")).join("").slice(0, 24);
}

function salDoDia(env) {
  const dia = new Date().toISOString().slice(0, 10); // YYYY-MM-DD (UTC) — muda todos os dias
  return `${dia}:${env.SY_SALT || "shopyump"}`;
}

function tipoDispositivo(ua) {
  if (!ua) return "desconhecido";
  if (/tablet|ipad/i.test(ua)) return "tablet";
  if (/mobile|android|iphone/i.test(ua)) return "mobile";
  return "desktop";
}

/** Heurística: só queremos contar "visita" em navegação de página real, não em CSS/JS/imagens/API. */
function pareceNavegacaoDePagina(request, url) {
  const destino = request.headers.get("sec-fetch-dest");
  if (destino) return destino === "document";
  if (url.pathname.startsWith("/_next/") || url.pathname.startsWith("/api/")) return false;
  return !/\.[a-z0-9]{2,5}$/i.test(url.pathname);
}

/** Escreve o evento de ENTRADA na loja (dataset shopyump_events, ver ANALYTICS_SPEC.md §3.1). */
async function registarEntrada(request, url, env) {
  try {
    const ua = request.headers.get("user-agent") || "";
    const vid = await visitorId(request, salDoDia(env));
    env.ANALYTICS.writeDataPoint({
      indexes: [url.hostname],
      blobs: [
        "visit_started",
        url.hostname,
        url.pathname,
        request.headers.get("referer") || "",
        url.searchParams.get("utm_source") || "",
        url.searchParams.get("utm_medium") || "",
        url.searchParams.get("utm_campaign") || "",
        tipoDispositivo(ua),
        request.cf?.country || "",
        vid,
      ],
      doubles: [Date.now()],
    });
  } catch (_) {
    // analytics nunca pode derrubar a loja
  }
}

/** Recebe o resumo da visita (navigator.sendBeacon, ver lib/analytics/track.ts no dashboard). */
async function registarResumo(request, url, env) {
  let corpo;
  try {
    corpo = await request.json();
  } catch {
    return new Response(null, { status: 204 });
  }
  try {
    const produtos = Array.isArray(corpo.produtos) ? corpo.produtos.slice(0, 20).join(",") : "";
    env.ANALYTICS.writeDataPoint({
      // index1 = hostname do próprio pedido, nunca o que vem no corpo — não é falsificável pelo visitante.
      indexes: [url.hostname],
      blobs: ["visit_summary", url.hostname, String(corpo.visit_id || ""), produtos, corpo.whatsapp ? "whatsapp_click" : ""],
      doubles: [Number(corpo.duracao_s) || 0, Number(corpo.paginas) || 0],
    });
  } catch (_) {
    // idem
  }
  return new Response(null, { status: 204, headers: { "Access-Control-Allow-Origin": url.origin } });
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const originalHost = url.hostname;

    if (originalHost === ROOT || originalHost === `www.${ROOT}` || originalHost === `img.${ROOT}`) {
      return fetch(request);
    }

    // Resumo de visita — tratado aqui mesmo, nunca chega ao Next.js.
    if (request.method === "POST" && url.pathname === RESUMO_PATH) {
      return registarResumo(request, url, env);
    }

    if (request.method === "GET" && pareceNavegacaoDePagina(request, url)) {
      ctx.waitUntil(registarEntrada(request, url, env));
    }

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

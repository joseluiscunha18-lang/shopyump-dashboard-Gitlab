/**
 * Cliente mínimo da SQL API do Cloudflare Analytics Engine (só servidor).
 *
 * A chave de leitura vive SÓ em variáveis de ambiente da Vercel — nunca chega ao browser:
 *   CLOUDFLARE_ACCOUNT_ID            id da conta Cloudflare
 *   CLOUDFLARE_ANALYTICS_READ_TOKEN  API token com a permissão "Account Analytics: Read" (só leitura)
 *
 * Datasets (ver workers/shopyump-router/wrangler.toml):
 */
export const PAGE_VIEWS_TABLE = 'shopyump_page_views';
export const VISIT_SUMMARY_TABLE = 'shopyump_visit_summary';

/** As variáveis de ambiente ainda não foram configuradas — não é um erro, é "analytics por ligar". */
export class AnalyticsNotConfiguredError extends Error {
  constructor() {
    super('analytics_not_configured');
  }
}

export function isAnalyticsConfigured(): boolean {
  return Boolean(process.env.CLOUDFLARE_ACCOUNT_ID && process.env.CLOUDFLARE_ANALYTICS_READ_TOKEN);
}

/** Executa uma consulta SQL e devolve as linhas (`data`). */
export async function queryAnalyticsEngine<T = Record<string, unknown>>(sql: string): Promise<T[]> {
  const account = process.env.CLOUDFLARE_ACCOUNT_ID;
  const token = process.env.CLOUDFLARE_ANALYTICS_READ_TOKEN;
  if (!account || !token) throw new AnalyticsNotConfiguredError();

  const res = await fetch(`https://api.cloudflare.com/client/v4/accounts/${account}/analytics_engine/sql`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: sql,
    cache: 'no-store',
    signal: AbortSignal.timeout(15_000),
  });
  if (!res.ok) {
    throw new Error(`Analytics Engine ${res.status}: ${(await res.text()).slice(0, 300)}`);
  }
  const json = (await res.json()) as { data?: T[] };
  return json.data ?? [];
}

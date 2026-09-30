/**
 * FONTE ÚNICA DE VERDADE para domínios e URLs do Shopyump.
 *
 * Estrutura:
 *   shopyump.com/login, /registar, /onboarding, /produtos ... → painel do lojista (esta app, na raiz)
 *   nome.shopyump.com       → loja pública do cliente (reescrita para /loja/[nome])
 *
 * next.config.ts, storeUrl.ts, auth, manifest e validação de slugs leem
 * tudo daqui.
 *
 * ÚNICA duplicação inevitável: o vercel.json (JSON não importa TypeScript)
 * repete ROOT_DOMAIN e a lista RESERVED_SUBDOMAINS na regra de subdomínios.
 * Se mudares algum destes valores aqui, muda também o vercel.json.
 *
 * ATENÇÃO: este ficheiro é importado pelo next.config.ts, por isso não
 * pode usar o alias `@/` nem código exclusivo do browser/servidor.
 */

export const ROOT_DOMAIN = 'shopyump.com';

/**
 * Prefixo do painel. Vazio = o painel vive na raiz (shopyump.com/login, /produtos...).
 * Se algum dia quiseres um prefixo, tem de começar por "/" e não terminar em "/".
 */
export const DASHBOARD_BASE_PATH = '';

/**
 * Subdomínios que nunca podem ser lojas: ou já servem outra coisa, ou
 * colidem com rotas internas (`temas` → /loja/temas do painel).
 */
export const RESERVED_SUBDOMAINS = [
  'www', 'app', 'api', 'admin', 'dashboard', 'painel', 'mail', 'email',
  'cdn', 'static', 'assets', 'status', 'help', 'ajuda', 'support', 'suporte',
  'blog', 'loja', 'lojas', 'temas', 'login', 'registar', 'onboarding',
] as const;

export function isReservedSubdomain(slug: string): boolean {
  return (RESERVED_SUBDOMAINS as readonly string[]).includes(slug.toLowerCase());
}

/** Um subdomínio DNS válido: 1–63 chars, a-z 0-9 e hífen, sem hífen nas pontas. */
export function isValidSubdomain(slug: string): boolean {
  return /^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?$/.test(slug);
}

/** URL pública de uma loja: https://nome.shopyump.com */
export function getStoreOrigin(slug: string): string {
  return `https://${slug}.${ROOT_DOMAIN}`;
}

/** URL absoluta de uma página do painel: https://shopyump.com/... */
export function getDashboardUrl(path = ''): string {
  return `https://${ROOT_DOMAIN}${DASHBOARD_BASE_PATH}${path}`;
}

/**
 * Caminho de um ficheiro de /public quando servido pelo painel.
 * Sem basePath devolve o próprio caminho (`/images/x.webp`); com basePath junta o prefixo.
 * Usar em <img src>, CSS url(), manifest, etc. (<Link> e router já tratam disto sozinhos).
 */
export function asset(path: string): string {
  return `${DASHBOARD_BASE_PATH}${path.startsWith('/') ? '' : '/'}${path}`;
}

/**
 * Regex de host que corresponde a uma LOJA (`nome.shopyump.com`, exceto
 * subdomínios reservados). Usada em `missing`/`has` do next.config.ts.
 */
export const TENANT_HOST_REGEX = `(?!(?:${RESERVED_SUBDOMAINS.join('|')})\\.)[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\\.${ROOT_DOMAIN.replace(/\./g, '\\.')}`;

/**
 * URL pública da loja (o link "Ver loja").
 *
 * Antes disto, três sítios diferentes montavam esta URL cada um à sua
 * maneira — alguns liam `NEXT_PUBLIC_WEB_URL` com fallback para
 * shopyump.vercel.app, outro tinha shopyump.vercel.app fixo, e o
 * `.env.local.example` sugeria ainda um terceiro domínio
 * (shopyump.com). Na prática, bastava a variável de ambiente estar
 * configurada na Vercel com o valor errado (ex.: o domínio do
 * marketplace) para o link ficar errado sem nenhum código estar
 * "errado" — foi exatamente o que aconteceu.
 *
 * Para não depender de uma variável de ambiente que pode divergir por
 * projeto/ambiente na Vercel, o domínio fica fixo aqui, num único
 * lugar. Se um dia a loja pública mudar de domínio outra vez, muda-se
 * só esta constante.
 */
const STORE_DOMAIN = 'https://shopyump-dashboard.vercel.app';

export function getStoreUrl(slug: string): string {
  return `${STORE_DOMAIN}/loja/${slug}`;
}

export function getProductUrl(slug: string, produtoId: string): string {
  return `${STORE_DOMAIN}/loja/${slug}/p/${produtoId}`;
}

import { getStoreOrigin } from '@/lib/domains';

/**
 * URL pública da loja (o link "Ver loja"): https://nomedaloja.shopyump.com
 *
 * O domínio vive em lib/domains.ts — é o único sítio a alterar se a loja
 * pública mudar de domínio. Não usar variáveis de ambiente para isto: já
 * uma vez divergiram entre projetos/ambientes da Vercel e o link ficou errado.
 */
export function getStoreUrl(slug: string): string {
  return getStoreOrigin(slug);
}

export function getProductUrl(slug: string, produtoId: string): string {
  return `${getStoreOrigin(slug)}/p/${produtoId}`;
}

/**
 * Rotas do fluxo de produto (criar/editar) — usadas para adaptar a TopBar
 * e ocultar a barra inferior mobile de forma síncrona com a navegação
 * (sem passar por useEffect/montagem, para não haver flash da UI normal
 * antes de trocar para o modo de fluxo).
 */
export function isProductFormFlowPath(pathname: string | null): boolean {
  if (!pathname) return false;
  return /^\/produtos\/[^/]+$/.test(pathname);
}

export function productFormFlowTitle(pathname: string | null): string {
  return pathname === '/produtos/novo' ? 'Adicionar produto' : 'Editar produto';
}

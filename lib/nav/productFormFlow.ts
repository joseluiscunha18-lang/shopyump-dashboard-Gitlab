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

/**
 * "Personalizar loja" também esconde a barra inferior — é uma página de
 * foco único (a pré-visualização + os painéis de edição), e a barra
 * ocuparia espaço vertical que a prévia precisa, sem ajudar em nada:
 * não faz sentido trocar de secção do dashboard a meio de uma edição.
 */
export function isFocusModePath(pathname: string | null): boolean {
  if (!pathname) return false;
  return isProductFormFlowPath(pathname) || pathname === '/loja';
}

export function productFormFlowTitle(pathname: string | null): string {
  return pathname === '/produtos/novo' ? 'Adicionar produto' : 'Editar produto';
}

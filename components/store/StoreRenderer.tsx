import { resolveStoreTheme } from '@/lib/store/themes/registry';
import type { LojaPublica } from '@/lib/queries/lojaPublica';
import type { ProdutoPublico } from '@/lib/queries/produtosPublicos';

/**
 * Ponto único de renderização da loja — a peça que junta "quais dados"
 * (loja + produtos, já públicos/normalizados) com "qual tema" (resolvido
 * a partir de `themeId`).
 *
 * Usado hoje só pela loja pública (`app/loja/[slug]/page.tsx`) e pela
 * página de produto partilhável (`app/loja/[slug]/p/[id]/page.tsx`, que
 * passa `produtoInicialId`). O mesmo componente pode ser reaproveitado
 * amanhã pelo preview do painel (Personalizar loja / catálogo de temas) —
 * é por isto que ele não sabe nada sobre Supabase, sessão, ou onde os
 * dados vieram: só recebe loja e produtos já prontos.
 */
export function StoreRenderer({
  themeId,
  loja,
  produtos,
  produtoInicialId,
}: {
  themeId: string | null | undefined;
  loja: LojaPublica;
  produtos: ProdutoPublico[];
  /** Abre o tema diretamente na página deste produto (ver StoreThemeProps). */
  produtoInicialId?: string;
}) {
  const { Component: Theme } = resolveStoreTheme(themeId);
  return <Theme loja={loja} produtos={produtos} produtoInicialId={produtoInicialId} />;
}

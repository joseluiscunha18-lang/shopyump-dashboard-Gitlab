import { resolveStoreTheme } from '@/lib/store/themes/registry';
import type { LojaPublica } from '@/lib/queries/lojaPublica';
import type { ProdutoPublico } from '@/lib/queries/produtosPublicos';

/**
 * Ponto único de renderização da loja — a peça que junta "quais dados"
 * (loja + produtos, já públicos/normalizados) com "qual tema" (resolvido
 * a partir de `themeId`).
 *
 * Usado hoje só pela loja pública (`app/loja/[slug]/page.tsx`). O mesmo
 * componente pode ser reaproveitado amanhã pelo preview do painel
 * (Personalizar loja / catálogo de temas) — é por isto que ele não sabe
 * nada sobre Supabase, sessão, ou onde os dados vieram: só recebe loja e
 * produtos já prontos.
 */
export function StoreRenderer({
  themeId,
  loja,
  produtos,
}: {
  themeId: string | null | undefined;
  loja: LojaPublica;
  produtos: ProdutoPublico[];
}) {
  const { Component: Theme } = resolveStoreTheme(themeId);
  return <Theme loja={loja} produtos={produtos} />;
}

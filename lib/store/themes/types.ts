import type { LojaPublica } from '@/lib/queries/lojaPublica';
import type { ProdutoPublico } from '@/lib/queries/produtosPublicos';

/**
 * Contrato que TODO tema tem de cumprir — a única coisa que a rota
 * pública (`app/loja/[slug]/page.tsx`) conhece sobre "o que é um tema".
 *
 * Propositadamente mínimo: loja + produtos, os mesmos dados vindos das
 * queries públicas, sem nenhuma noção de tokens/estrutura visual. Um
 * tema é livre de ser tão simples ou tão diferente estruturalmente de
 * outro quanto precisar — a rota nunca sabe, nem quer saber, como cada
 * tema desenha os dados. Ver lib/store/themes/registry.tsx.
 */
export interface StoreThemeProps {
  loja: LojaPublica;
  produtos: ProdutoPublico[];
  /**
   * Quando definido, o tema abre diretamente na página deste produto
   * (link partilhável `nome.shopyump.com/p/<id>`, ver
   * app/loja/[slug]/p/[id]/page.tsx) em vez de na página inicial da loja.
   * O produto tem de estar em `produtos`.
   */
  produtoInicialId?: string;
}

export type StoreThemeComponent = (props: StoreThemeProps) => React.ReactElement;

export interface StoreThemeDefinition {
  id: string;
  Component: StoreThemeComponent;
}

/**
 * Dados fictícios da pré-visualização (§3 e §12 da spec).
 *
 * Usados apenas para preencher o <StorePreview /> quando o vendedor
 * ainda não tem conteúdo suficiente (loja nova, sem produtos, sem
 * banner, etc.) ou enquanto os temas reais não estão disponíveis.
 *
 * IMPORTANTE: nunca gravar nada daqui como produto/loja real. Isto não
 * toca o Supabase — é só o "fallback" visual do preview. Ver
 * `resolvePreviewStore` para a regra de "real quando existe, fictício
 * quando falta" descrita no §11.
 */

export interface PreviewProduct {
  id: string;
  nome: string;
  preco: number;
  imagem: string;
}

export interface PreviewStoreData {
  nome: string;
  descricao: string;
  bannerUrl: string;
}

export const previewStore: PreviewStoreData = {
  nome: 'Negron',
  descricao: 'Produtos selecionados para o seu dia a dia.',
  bannerUrl: 'https://i.ibb.co/0y1j5TZJ/a438689f26504d23aa559eeb1123f70f.png',
};

export const previewCategories: string[] = ['Todos', 'Perfumes', 'Acessórios', 'Vestuário'];

export const previewProducts: PreviewProduct[] = [
  {
    id: 'preview-1',
    nome: 'Perfume Noir',
    preco: 1500,
    imagem: 'https://i.ibb.co/qF2G1zYm/natallia-photo-26nn-S5-I05-U-unsplash.jpg',
  },
  {
    id: 'preview-2',
    nome: 'Bolsa Classic',
    preco: 2200,
    imagem: 'https://i.ibb.co/0y1j5TZJ/a438689f26504d23aa559eeb1123f70f.png',
  },
  {
    id: 'preview-3',
    nome: 'Relógio Urban',
    preco: 1800,
    imagem: 'https://i.ibb.co/0y2zq6VQ/peter-albanese-w-FNTf-Yo9-Vnc-unsplash.jpg',
  },
  {
    id: 'preview-4',
    nome: 'T-shirt Essential',
    preco: 950,
    imagem: 'https://i.ibb.co/FbC8CZS8/jr-r-90-Hd-Ol-Gbjck-unsplash.jpg',
  },
];

/**
 * Regra do §11: usa o dado real quando existe, cai para o dado fictício
 * quando falta — campo a campo, não "tudo ou nada". Assim o preview vai
 * ficando cada vez mais parecido com a loja final à medida que o
 * vendedor preenche conteúdo, sem nunca misturar produtos reais com o
 * catálogo de demonstração.
 */
export function resolvePreviewStore(real: {
  nome?: string | null;
  descricao?: string | null;
  bannerUrl?: string | null;
}): PreviewStoreData {
  return {
    nome: real.nome?.trim() || previewStore.nome,
    descricao: real.descricao?.trim() || previewStore.descricao,
    bannerUrl: real.bannerUrl?.trim() || previewStore.bannerUrl,
  };
}

export function resolvePreviewProducts<T>(
  realProducts: T[] | null | undefined,
  mapReal: (p: T) => PreviewProduct
): PreviewProduct[] {
  if (realProducts && realProducts.length > 0) return realProducts.map(mapReal);
  return previewProducts;
}

/** Atalho para quando os "reais" já vêm no formato certo (ver getProdutosParaPreview). */
export function resolvePreviewProductsDireto(realProducts: PreviewProduct[] | null | undefined): PreviewProduct[] {
  return resolvePreviewProducts(realProducts, (p) => p);
}

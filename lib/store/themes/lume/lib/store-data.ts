import type { ProdutoVariantes, ProdutoVersao } from '@/types/database';
import { imagensParaVersao } from '@/lib/variantes';

export type ProductKind = "coat" | "shirt" | "bag" | "dress" | "tee" | "wallet" | "hoodie" | "cap";
export type Category = "Destaques" | "Vestuário" | "Acessórios";

export type Product = {
  id: string;
  name: string;
  price: number;
  category: Category;
  kind: ProductKind;
  tone: "stone" | "sage" | "rose" | "blue" | "sand" | "mist" | "pink" | "coral";
  createdAt?: string;
  /** Stock disponível. Indefinido = disponível (dados dinâmicos da loja). */
  stock?: number;
  /**
   * Fotos reais do produto (Supabase Storage, `produtos.fotos`) — só
   * existe em produtos reais. Quando presente, os componentes de
   * imagem (ProductCard, ProductGallery, AddToCartButton) mostram-nas
   * em vez do SVG ilustrativo de `kind`/`tone`, que fica reservado
   * para os produtos de demonstração.
   */
  images?: string[];
  /** Descrição real do produto (`produtos.descricao`). Só existe em produtos reais. */
  description?: string;
  /**
   * Variantes reais (cor/tamanho/etc.) vindas do Supabase
   * (`produtos.variantes`). undefined/null = produto sem variantes —
   * componentes de compra usam sempre `price`/`stock` do produto.
   */
  variantes?: ProdutoVariantes | null;
};

/* -------------------------------------------------------------------- */
/* Variantes — helpers para a loja pública                               */
/* -------------------------------------------------------------------- */

/** Uma característica de variação do produto, na ordem raiz → filha → neta. */
export interface CaracteristicaVariante {
  nome: string;
  cores?: Record<string, string>;
}

/** Lista as características (Cor/Tamanho/...) que o produto realmente usa. */
export function caracteristicasDoProduto(product: Product): CaracteristicaVariante[] {
  const v = product.variantes;
  if (!v) return [];
  const lista = [v.raiz, v.filha, v.neta].filter((c): c is NonNullable<typeof c> => Boolean(c?.nome));
  // Ordem de exibição: Cor primeiro, depois as restantes (ex: Tamanho) pela
  // ordem em que foram definidas — independente de qual é a raiz no painel.
  // Os valores de cada característica são filtrados pelas escolhas das que
  // vêm antes nesta lista (ver valoresParaCaracteristica), por isso a
  // ordem aqui é a única fonte de verdade.
  const ehCor = (nome: string) => nome.trim().toLowerCase() === 'cor';
  return [...lista.filter((c) => ehCor(c.nome)), ...lista.filter((c) => !ehCor(c.nome))];
}

/**
 * Galeria completa do produto: todas as fotos (para o utilizador poder
 * fazer scroll entre elas), mais o índice onde cada valor de uma
 * característica com fotos próprias (ex: Cor) começa. `alvos` são os
 * índices das fotos da versão selecionada — a galeria posiciona-se
 * numa delas ao trocar de cor. `donos[i]` é o valor da característica
 * dono da foto i (para atualizar a cor ao fazer swipe).
 */
export function galeriaDoProduto(
  product: Product,
  versao: ProdutoVersao | undefined
): { imagens: string[]; alvos: number[]; donos: (string | null)[]; caracteristica: string | null } {
  const gerais = product.images ?? [];
  const mapa = product.variantes?.imagensPorCaracteristica ?? {};
  const nomeCar = Object.keys(mapa).find((n) => Object.values(mapa[n] ?? {}).some((l) => l && l.length > 0)) ?? null;

  const imagens = [...gerais];
  const adicionar = (src: string) => {
    if (!imagens.includes(src)) imagens.push(src);
  };
  for (const v of product.variantes?.versoes ?? []) (v.imagens ?? []).forEach(adicionar);
  if (nomeCar) Object.values(mapa[nomeCar] ?? {}).forEach((l) => (l ?? []).forEach(adicionar));

  const donos: (string | null)[] = imagens.map(() => null);
  if (nomeCar) {
    for (const [valor, lista] of Object.entries(mapa[nomeCar] ?? {})) {
      for (const src of lista ?? []) {
        const i = imagens.indexOf(src);
        if (i >= 0 && donos[i] == null) donos[i] = valor;
      }
    }
  }

  let alvos: number[] = [];
  if (versao) {
    const { imagens: daVersao, origem } = imagensParaVersao(versao, mapa, gerais);
    if (origem !== 'geral') alvos = daVersao.map((src) => imagens.indexOf(src)).filter((i) => i >= 0);
  }
  return { imagens, alvos, donos, caracteristica: nomeCar };
}

/**
 * Valores possíveis para `nome`, dado o que já foi escolhido nas
 * características anteriores (`selecaoAtual`) — preserva a ordem em que
 * aparecem nas versões vendáveis (que já segue raiz.valores/filha...).
 */
export function valoresParaCaracteristica(
  product: Product,
  nome: string,
  selecaoAtual: Record<string, string>
): string[] {
  const versoes = product.variantes?.versoes ?? [];
  const anteriores = caracteristicasDoProduto(product)
    .map((c) => c.nome)
    .slice(0, caracteristicasDoProduto(product).findIndex((c) => c.nome === nome));

  const vistos = new Set<string>();
  const valores: string[] = [];
  for (const versao of versoes) {
    if (anteriores.some((c) => versao.valores[c] !== selecaoAtual[c])) continue;
    const valor = versao.valores[nome];
    if (valor && !vistos.has(valor)) {
      vistos.add(valor);
      valores.push(valor);
    }
  }
  return valores;
}

/** Versão (combinação) vendável que corresponde à seleção completa, se existir. */
export function encontrarVersao(product: Product, selecao: Record<string, string>): ProdutoVersao | undefined {
  const caracteristicas = caracteristicasDoProduto(product);
  if (!caracteristicas.length) return undefined;
  return (product.variantes?.versoes ?? []).find((versao) =>
    caracteristicas.every((c) => versao.valores[c.nome] === selecao[c.nome])
  );
}

/** Primeira versão ativa e em estoque — usada como seleção inicial da página do produto. */
export function versaoInicial(product: Product): ProdutoVersao | undefined {
  const versoes = product.variantes?.versoes ?? [];
  return (
    versoes.find((v) => v.ativa !== false && (v.estoque == null || v.estoque > 0)) ??
    versoes.find((v) => v.ativa !== false) ??
    versoes[0]
  );
}

/** Preço a mostrar: o da versão selecionada (se definido), senão o preço base do produto. */
export function precoDaVersao(product: Product, versao: ProdutoVersao | undefined): number {
  return versao?.preco ?? product.price;
}

/** Estoque da versão selecionada; undefined = sem controlo de estoque (sempre disponível). */
export function estoqueDaVersao(product: Product, versao: ProdutoVersao | undefined): number | undefined {
  if (!product.variantes) return product.stock;
  if (!versao) return 0;
  return typeof versao.estoque === 'number' ? versao.estoque : undefined;
}

/** Imagens a mostrar para a versão selecionada — versão → característica → galeria geral. */
export function imagensDaVersao(product: Product, versao: ProdutoVersao | undefined): string[] {
  if (!versao) return product.images ?? [];
  return imagensParaVersao(versao, product.variantes?.imagensPorCaracteristica, product.images ?? []).imagens;
}

export const categories: Category[] = ["Destaques", "Vestuário", "Acessórios"];

export const categorySlug = (category: string) =>
  category.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

export const categoryFromSlug = (slug?: string) => categories.find((c) => categorySlug(c) === slug);

export const products: Product[] = [
  { id: "casaco-essential", name: "Produto 01", price: 1999, category: "Destaques", kind: "coat", tone: "blue", stock: 8 },
  { id: "camisa-leve", name: "Produto 02", price: 1999, category: "Vestuário", kind: "shirt", tone: "sand", stock: 4 },
  { id: "bolsa-mini", name: "Produto 03", price: 1999, category: "Acessórios", kind: "bag", tone: "stone", stock: 0 },
  { id: "vestido-solto", name: "Produto 04", price: 1999, category: "Vestuário", kind: "dress", tone: "rose", stock: 6 },
  { id: "t-shirt-studio", name: "Produto 05", price: 1999, category: "Destaques", kind: "tee", tone: "mist", stock: 12 },
  { id: "carteira-compacta", name: "Produto 06", price: 1999, category: "Acessórios", kind: "wallet", tone: "sage", stock: 3 },
];

export const formatPrice = (value: number) => `${new Intl.NumberFormat("pt-PT").format(value)} MT`;

export const getProduct = (id: string) => products.find((product) => product.id === id);

export const isInStock = (product: Product, quantity = 1, stockOverride?: number) => {
  const stock = stockOverride !== undefined ? stockOverride : product.stock;
  return stock === undefined || stock >= quantity;
};

export const maxQuantity = (product: Product, stockOverride?: number) => {
  const stock = stockOverride !== undefined ? stockOverride : product.stock;
  return stock === undefined ? 99 : Math.max(0, stock);
};

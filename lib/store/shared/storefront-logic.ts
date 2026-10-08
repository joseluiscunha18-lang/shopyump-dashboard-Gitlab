/**
 * NÚCLEO PARTILHADO DA LOJA (theme-agnostic).
 * ──────────────────────────────────────────────────────────────────────
 * Estas funções são a ÚNICA fonte de verdade para regras que decidem
 * "o que aparece" na loja: o modo do cabeçalho, os links do rodapé e o
 * estado de compra de um produto.
 *
 * Tanto a loja pública (`lib/store/themes/<tema>/...`) como o preview do
 * editor (`theme-editor/themes/<tema>/Renderer.tsx`) têm de chamar ESTAS
 * funções em vez de reimplementar a condição com os seus próprios ifs.
 * Isso é o que garante que o editor nunca mostra algo que a loja real não
 * mostraria (e vice-versa) — a prevenção estrutural para o tipo de
 * incompatibilidade (cabeçalho, variantes, rodapé) encontrado no tema Lume.
 *
 * Ficheiro sem React e sem dependência de nenhum tema específico: pode ser
 * importado em qualquer tema novo que a plataforma venha a ter.
 */

import type { PageKind } from "@/theme-editor/editor/contracts/types";

/* ------------------------------------------------------------------ */
/* 1. Cabeçalho                                                        */
/* ------------------------------------------------------------------ */

/**
 * O conjunto de ações que o cabeçalho pode mostrar à direita. Cada tema
 * decide o visual, mas TODOS os temas têm de respeitar este mapeamento:
 * nunca mostrar "account" numa página de produto, nunca mostrar "cart"
 * fora dela, etc.
 */
export type HeaderMode = "home" | "catalog" | "product" | "institutional" | "account";

/**
 * Deriva o modo do cabeçalho a partir do tipo de página (`PageKind`), o
 * mesmo vocabulário que o manifesto do editor já usa em `PageDef.kind`
 * (ver `theme-editor/editor/contracts/types.ts`). Qualquer tema — real ou
 * no editor — que saiba em que página está, sabe o modo do cabeçalho.
 */
export function resolveHeaderMode(pageKind: PageKind): HeaderMode {
  switch (pageKind) {
    case "product":
      return "product";
    case "content":
      return "institutional";
    case "account":
    case "cart":
      return "account";
    case "collection":
    case "search":
    case "wishlist":
      return "catalog";
    case "home":
    default:
      return "home";
  }
}

/** Que ícones de ação o cabeçalho mostra à direita, por modo. */
export interface HeaderActionSet {
  search: boolean;
  wishlist: boolean;
  account: boolean;
  cart: boolean;
}

export function headerActionsFor(mode: HeaderMode): HeaderActionSet {
  switch (mode) {
    case "product":
      // Na página de produto o essencial é o carrinho — não a conta.
      return { search: false, wishlist: false, account: false, cart: true };
    case "institutional":
    case "account":
      // Páginas institucionais / conta: só o atalho para a conta.
      return { search: false, wishlist: false, account: true, cart: false };
    case "catalog":
    case "home":
    default:
      return { search: true, wishlist: true, account: true, cart: false };
  }
}

/* ------------------------------------------------------------------ */
/* 2. Rodapé — links de políticas                                      */
/* ------------------------------------------------------------------ */

export interface PolicyPageFlag {
  /** Se a loja decidiu mostrar esta página (Definições da loja). */
  mostrar: boolean;
}

export interface StorePolicyPages {
  /** "Envios e Entregas" — opcional, a loja liga/desliga. */
  entrega: PolicyPageFlag;
  /** "Termos e Privacidade" — opcional, a loja liga/desliga. */
  termos: PolicyPageFlag;
}

export type PolicyLinkId = "shipping" | "returns" | "terms";

export interface PolicyLink {
  id: PolicyLinkId;
  label: string;
  /** "Trocas e Devoluções" é sempre obrigatório — nunca é opcional em nenhum tema. */
  required: boolean;
}

const POLICY_LABELS: Record<PolicyLinkId, string> = {
  shipping: "Envios e Entregas",
  returns: "Trocas e Devoluções",
  terms: "Termos e Privacidade",
};

/**
 * Lista de links do rodapé que a loja deve mostrar. "Trocas e Devoluções" é
 * sempre incluído — é a única página institucional que a plataforma garante
 * a todas as lojas. As outras duas seguem a definição real da loja.
 *
 * Esta função é a única coisa que decide "aparece ou não aparece" — o
 * tema (real ou editor) só desenha a lista que ela devolve, nunca decide
 * sozinho.
 */
export function getVisiblePolicyLinks(paginas: StorePolicyPages): PolicyLink[] {
  const links: PolicyLink[] = [];
  if (paginas.entrega.mostrar) links.push({ id: "shipping", label: POLICY_LABELS.shipping, required: false });
  links.push({ id: "returns", label: POLICY_LABELS.returns, required: true });
  if (paginas.termos.mostrar) links.push({ id: "terms", label: POLICY_LABELS.terms, required: false });
  return links;
}

/* ------------------------------------------------------------------ */
/* 3. Produto — estado de compra (variantes, stock)                    */
/* ------------------------------------------------------------------ */

export type BuyState =
  | { status: "needsSelection" }
  | { status: "outOfStock" }
  | { status: "available" };

export interface ResolveBuyStateInput {
  /** O produto tem características de variação (cor/tamanho/...)? */
  hasVariants: boolean;
  /** Se tem variantes: o cliente já escolheu um valor para cada característica? */
  selectionComplete: boolean;
  /** Versão/variante escolhida está ativa? (undefined = não aplicável). */
  versionActive?: boolean;
  /** Stock da versão escolhida (ou do produto, sem variantes). undefined = sem controlo de stock. */
  stock?: number;
}

/**
 * Decide se "Comprar Agora" / "Adicionar ao Carrinho" podem aparecer
 * ativos, e com que texto — a MESMA decisão que a loja pública usa em
 * `produto-detail.tsx`. O editor tem de chamar esta função para mostrar o
 * seletor de variantes e o estado correto do botão, em vez de desenhar os
 * botões sempre ativos e sem seletor.
 */
export function resolveBuyState(input: ResolveBuyStateInput): BuyState {
  if (input.hasVariants && !input.selectionComplete) return { status: "needsSelection" };
  const inStock = input.stock === undefined || input.stock > 0;
  if (!inStock || input.versionActive === false) return { status: "outOfStock" };
  return { status: "available" };
}

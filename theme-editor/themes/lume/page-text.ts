/**
 * Textos ORIGINAIS do Lume (os que a loja pública mostra sem personalização).
 * Fonte única partilhada pelo editor (preview) e pela loja pública — se estes
 * textos mudarem aqui, mudam nos dois. Ficheiro só de dados (sem React): é
 * seguro importar no servidor.
 */

export type LumePageKey = "collection" | "wishlist" | "about" | "shipping" | "returns" | "terms" | "contact";

export interface PageTextDefaults {
  eyebrow: string;
  title: string;
  description: string;
}

/** `{loja}` é substituído pelo nome da loja. Vazio = a página não mostra esse texto. */
export const PAGE_TEXT: Record<LumePageKey, PageTextDefaults> = {
  collection: { eyebrow: "", title: "Produtos", description: "" },
  wishlist: { eyebrow: "A sua selecção", title: "Favoritos", description: "Guarde aqui os produtos que quer rever mais tarde." },
  about: { eyebrow: "A marca", title: "Sobre nós", description: "Conheça a {loja} — quem somos, o que fazemos e como pode contar connosco." },
  shipping: { eyebrow: "Informações da loja", title: "Envios e Entregas", description: "Tudo o que precisa de saber sobre a preparação, expedição e acompanhamento da sua encomenda." },
  returns: { eyebrow: "Comprar com confiança", title: "Trocas e Devoluções", description: "Criámos um processo simples e transparente para que possa comprar com tranquilidade." },
  terms: { eyebrow: "Transparência e segurança", title: "Termos e Privacidade", description: "Conheça as regras de utilização da loja e os compromissos que assumimos para proteger a sua informação." },
  contact: { eyebrow: "Fale connosco", title: "Contacto", description: "Envie uma mensagem ou escolha um dos canais diretos da loja." },
};

/** Id da seção de título de cada página no manifesto. */
export const HEADING_SECTION: Record<LumePageKey, string> = {
  collection: "collectionHeading",
  wishlist: "wishlistHeading",
  about: "aboutHeading",
  shipping: "shippingHeading",
  returns: "returnsHeading",
  terms: "termsHeading",
  contact: "contactHeading",
};

/** Textos de painéis e botões (originais do Lume). */
export const UI_TEXT = {
  searchTitle: "Pesquisar produtos",
  searchPlaceholder: "O que procura?",
  cartTitle: "O seu carrinho",
  cartDescription: "Revise os artigos antes de finalizar a compra.",
  cartEmptyTitle: "O carrinho está vazio",
  cartEmptyText: "Adicione produtos para começar o seu pedido.",
  cartCheckout: "Finalizar Compra",
  addToCart: "Adicionar ao Carrinho",
  buyNow: "Comprar Agora",
  recommendations: "Você também pode gostar",
  contactSubmit: "Enviar mensagem",
} as const;

/** Itens do menu lateral por omissão — os mesmos que a loja pública mostra hoje. */
export const DEFAULT_MENU_ITEMS = [
  { id: "home", label: "Início", link: { type: "themePage", value: "home" }, locked: true },
  { id: "about", label: "Sobre", link: { type: "themePage", value: "about" } },
  { id: "contact", label: "Contacto", link: { type: "themePage", value: "contact" } },
  { id: "wishlist", label: "Favoritos", link: { type: "themePage", value: "wishlist" } },
] as const;

/** Página do tema → rota do Lume público. */
export const THEME_PAGE_ROUTE: Record<string, string> = {
  home: "/",
  collection: "/produtos",
  wishlist: "/favoritos",
  about: "/sobre",
  contact: "/contacto",
  shipping: "/envios-e-entregas",
  returns: "/trocas-e-devolucoes",
  terms: "/termos-e-privacidade",
  account: "/conta",
  cart: "/checkout",
};

/**
 * Categorias que o Lume público mostra (os produtos reais com outro nome caem em
 * "Destaques" — ver lume-loja-context.tsx). O preview usa a mesma regra para
 * mostrar exatamente o que a loja mostra.
 */
export const LUME_CATEGORIES = ["Destaques", "Vestuário", "Acessórios"] as const;

export function lumeCategoryOf(name: string | undefined): (typeof LUME_CATEGORIES)[number] {
  const n = (name ?? "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  return n === "vestuario" ? "Vestuário" : n === "acessorios" ? "Acessórios" : "Destaques";
}

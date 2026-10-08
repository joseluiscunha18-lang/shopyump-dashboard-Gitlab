import type { ElementDef, LinkType, NavItem, OverlayDef, PageDef, SectionTypeDef, SettingDef } from "@/theme-editor/editor/contracts/types";
import { DEFAULT_MENU_ITEMS, HEADING_SECTION, PAGE_TEXT, UI_TEXT } from "./page-text";

/**
 * Extensão do manifesto do Lume para as funcionalidades novas do editor:
 * páginas internas, menu lateral, barra inferior, pesquisa, carrinho lateral e
 * "segundo toque para abrir".
 *
 * REGRA DE OURO (igual ao manifest.ts): só se oferece o que a LOJA PÚBLICA
 * aplica (lib/store/themes/lume/lib/personalizacao.ts). Textos com default ""
 * significam "usar o texto original do Lume" (ver page-text.ts).
 */

const B = "basic" as const;
const A = "advanced" as const;

const show = (d = true): SettingDef => ({ key: "show", label: "Mostrar", control: "toggle", tier: B, group: "content", default: d });
const NAV_LINKS: LinkType[] = ["themePage", "category", "url"];

export const extCapabilities: Record<string, boolean> = {
  bottomNavigation: true,
  sideMenu: true,
  submenus: false,
  search: true,
  wishlist: true,
  cart: true,
  cartDrawer: true,
  account: true,
  contactForm: true,
  announcementBar: true,
};

const base = { required: false, removable: false, duplicable: false, reorderable: false, hideable: true } as const;
/** Preset de contentor sem nada editável (o Lume público não aplica nenhuma das opções genéricas). */
const noContainer = (add: SettingDef[] = []) => ({
  preset: "container",
  omit: ["colorScheme", "align", "contentWidth", "spacing", "padding", "gap", "background", "radius", "shadow", "minHeight", "visibility", "animation", "anchorId"],
  add,
});
const textEl = (id: string, label: string, text: string, max = 120): ElementDef => ({
  id,
  kind: "text",
  label,
  settings: [{ key: "text", label: "Texto", control: "text", tier: B, group: "content", default: text, maxLength: max }],
});
const buttonEl = (id: string, label: string, text: string): ElementDef => ({
  id,
  kind: "button",
  label,
  settings: [{ key: "label", label: "Texto", control: "text", tier: B, group: "content", default: text, maxLength: 40 }],
});
const readonly = (key: string, label: string, text: string, target: SettingDef["externalTarget"]): SettingDef => ({
  key, label, control: "readonlyInfo", tier: B, group: "content", externalTarget: target, default: text,
});
const headingText = (id: string, label: string, hint: string): ElementDef => ({
  id,
  kind: "text",
  label,
  settings: [{ key: "text", label: "Texto", control: "text", tier: B, group: "content", default: "", maxLength: 160, note: hint }],
});

/** Ícones do cabeçalho: cada um é selecionável e tem a sua ação de abrir. */
const headerIcon = (id: string, label: string): ElementDef => ({
  id,
  kind: "icon",
  label,
  settings: [show()],
});
export const headerIconElements: ElementDef[] = [
  { ...headerIcon("menu", "Menu lateral"), openAction: { type: "overlay", id: "sideMenu" } },
  { ...headerIcon("search", "Pesquisa"), openAction: { type: "overlay", id: "searchOverlay" } },
  { ...headerIcon("wishlist", "Favoritos"), openAction: { type: "themePage", page: "wishlist" } },
  // Na loja real, sem sessão iniciada este ícone abre o modal de entrar/criar
  // conta (auth-modal.tsx) — nunca navega para a página "/conta". Por isso
  // aqui abre o overlay "authOverlay" (espelho do modal), não a themePage.
  { ...headerIcon("account", "Conta"), openAction: { type: "overlay", id: "authOverlay" } },
  // Só aparece na página de produto — ver `headerActionsFor` em
  // lib/store/shared/storefront-logic.ts, que o Renderer usa para decidir
  // isto, em vez do próprio Renderer decidir sozinho.
  { ...headerIcon("cart", "Carrinho"), openAction: { type: "overlay", id: "cartDrawer" } },
];

/** Segundo toque no cartão de produto: abre a página Produto com o produto tocado. */
export const productCardOpen = { type: "themePage", page: "product" } as const;

export const extSectionTypes: SectionTypeDef[] = [
  {
    ...base,
    type: "bottomNav",
    label: "Barra inferior",
    description: "Navegação fixa no fundo do ecrã (telemóvel).",
    icon: "panel-bottom",
    scope: "fixed",
    requires: "bottomNavigation",
    elements: [],
    settings: [
      { key: "showSearch", label: "Mostrar pesquisa", control: "toggle", tier: B, group: "content", default: true },
      { key: "showWishlist", label: "Mostrar favoritos", control: "toggle", tier: B, group: "content", requires: "wishlist", default: true },
      { key: "showCart", label: "Mostrar carrinho", control: "toggle", tier: B, group: "content", requires: "cart", default: true },
    ],
  },
  {
    ...base,
    hideable: false,
    type: "sideMenu",
    label: "Menu lateral",
    description: "Menu que abre pelo ícone de menu.",
    icon: "menu",
    scope: "overlay",
    requires: "sideMenu",
    elements: [],
    settings: [
      {
        key: "items",
        label: "Links do menu",
        control: "navList",
        tier: B,
        group: "content",
        default: DEFAULT_MENU_ITEMS as unknown as NavItem[],
        navList: { maxItems: 8, maxDepth: 1, minVisible: 1, labelMaxLength: 24, iconEnabled: false, linkTypes: NAV_LINKS },
      },
    ],
  },
  {
    ...base,
    hideable: false,
    type: "searchOverlay",
    label: "Pesquisa",
    description: "Painel de pesquisa de produtos.",
    icon: "search",
    scope: "overlay",
    requires: "search",
    elements: [textEl("title", "Título", UI_TEXT.searchTitle, 60), textEl("placeholder", "Texto do campo", UI_TEXT.searchPlaceholder, 60)],
    settings: noContainer(),
  },
  {
    ...base,
    hideable: false,
    type: "cartDrawer",
    label: "Carrinho lateral",
    description: "Painel do carrinho.",
    icon: "shopping-bag",
    scope: "overlay",
    requires: "cartDrawer",
    elements: [
      textEl("title", "Título", UI_TEXT.cartTitle, 60),
      textEl("description", "Descrição", UI_TEXT.cartDescription, 120),
      buttonEl("checkout", "Botão finalizar", UI_TEXT.cartCheckout),
    ],
    settings: noContainer(),
  },
  {
    ...base,
    type: "pageHeading",
    label: "Título da página",
    description: "Cabeçalho no topo da página.",
    icon: "heading",
    scope: "page",
    elements: [
      headingText("eyebrow", "Etiqueta", "Vazio = texto original do tema."),
      headingText("title", "Título", "Vazio = texto original do tema."),
      headingText("description", "Descrição", "Vazio = texto original do tema."),
    ],
    settings: noContainer(),
  },
  {
    ...base,
    type: "catalogGrid",
    label: "Grelha de produtos",
    description: "Produtos da página. O cartão segue o da página inicial.",
    icon: "layout-grid",
    scope: "page",
    allowedPages: ["collection", "wishlist"],
    elements: [{ id: "productCard", kind: "productCard", label: "Cartão de produto", openAction: productCardOpen, settings: [readonly("cardInfo", "Cartão", "O aspeto dos cartões é definido na secção Produtos da página inicial.", "products")] }],
    settings: noContainer([
      { key: "columns", label: "Colunas", control: "number", tier: B, group: "layout", responsive: true, default: { $r: { desktop: 4, tablet: 3, mobile: 2 } }, min: 1, max: 6 },
      readonly("productsInfo", "Produtos", "Os produtos são geridos em Produtos.", "products"),
    ]),
  },
  {
    ...base,
    type: "productGallery",
    label: "Galeria do produto",
    description: "Imagens do produto.",
    icon: "image",
    scope: "page",
    allowedPages: ["product"],
    elements: [],
    settings: noContainer([readonly("imagesInfo", "Imagens", "As imagens são geridas em Produtos.", "products")]),
  },
  {
    ...base,
    type: "productInfo",
    label: "Informações do produto",
    description: "Nome, preço e botões de compra.",
    icon: "tag",
    scope: "page",
    allowedPages: ["product"],
    elements: [buttonEl("buyNow", "Botão comprar agora", UI_TEXT.buyNow), buttonEl("addToCart", "Botão adicionar", UI_TEXT.addToCart)],
    settings: noContainer([readonly("productInfo", "Produto", "Nome, preço e stock são geridos em Produtos.", "products")]),
  },
  {
    ...base,
    type: "recommendations",
    label: "Você também pode gostar",
    description: "Produtos sugeridos no fim da página do produto.",
    icon: "sparkles",
    scope: "page",
    allowedPages: ["product"],
    elements: [{ id: "title", kind: "heading", label: "Título", settings: [show(), { key: "text", label: "Texto", control: "text", tier: B, group: "content", default: UI_TEXT.recommendations, maxLength: 60 }] }],
    settings: noContainer(),
  },
  {
    ...base,
    type: "contentBlock",
    label: "Conteúdo",
    description: "Texto da página (gerido em Páginas e políticas).",
    icon: "file-text",
    scope: "page",
    elements: [],
    settings: noContainer([readonly("contentInfo", "Conteúdo", "O texto desta página é gerido em Páginas e políticas.", "policies")]),
  },
  {
    ...base,
    type: "contactForm",
    label: "Formulário de contacto",
    description: "Mensagem e canais diretos.",
    icon: "mail",
    scope: "page",
    allowedPages: ["contact"],
    requires: "contactForm",
    elements: [buttonEl("submit", "Botão enviar", UI_TEXT.contactSubmit)],
    settings: noContainer([readonly("channelsInfo", "Canais", "WhatsApp, email e Instagram vêm de Informações da loja e Redes sociais.", "store-info")]),
  },
  {
    ...base,
    hideable: false,
    type: "authOverlay",
    label: "Entrar ou criar conta",
    description: "Modal de início de sessão (só leitura — espelha o que o cliente vê na loja real).",
    icon: "user",
    scope: "overlay",
    requires: "account",
    elements: [],
    settings: noContainer(),
  },
  {
    ...base,
    hideable: false,
    type: "checkoutPage",
    label: "Finalizar compra",
    description: "Página de pagamento (só leitura).",
    icon: "credit-card",
    scope: "page",
    elements: [],
    settings: noContainer(),
  },
  {
    ...base,
    hideable: false,
    type: "accountPage",
    label: "Conta",
    description: "Área do cliente (só leitura).",
    icon: "user",
    scope: "page",
    elements: [],
    settings: noContainer(),
  },
];

const chrome = { topSections: ["announcement", "header"], bottomSections: ["footer"], fixedSections: ["bottomNav"] };
const headed = (key: keyof typeof HEADING_SECTION) => ({ id: HEADING_SECTION[key], type: "pageHeading" });

export const extPages: PageDef[] = [
  { id: "collection", label: "Todos os produtos", supported: true, kind: "collection", group: "main", previewNeeds: "collection", ...chrome,
    sections: [headed("collection"), { id: "collectionProducts", type: "catalogGrid" }] },
  { id: "product", label: "Produto", supported: true, kind: "product", group: "main", previewNeeds: "product", ...chrome,
    sections: [{ id: "productGallery", type: "productGallery" }, { id: "productInfo", type: "productInfo" }, { id: "recommendations", type: "recommendations" }] },
  { id: "wishlist", label: "Favoritos", supported: true, kind: "wishlist", group: "main", requires: "wishlist", ...chrome,
    sections: [headed("wishlist"), { id: "wishlistProducts", type: "catalogGrid" }] },
  { id: "cart", label: "Finalizar compra", supported: true, kind: "cart", group: "main", requires: "cart", ...chrome,
    sections: [{ id: "checkoutPage", type: "checkoutPage" }] },
  { id: "account", label: "Conta", supported: true, kind: "account", group: "main", requires: "account", ...chrome,
    sections: [{ id: "accountPage", type: "accountPage" }] },
  ...(["about", "shipping", "returns", "terms"] as const).map((key) => ({
    id: key,
    label: PAGE_TEXT[key].title,
    supported: true,
    kind: "content" as const,
    group: "info" as const,
    ...chrome,
    sections: [headed(key), { id: `${key}Content`, type: "contentBlock" }],
  })),
  { id: "contact", label: "Contacto", supported: true, kind: "content", group: "info", ...chrome,
    sections: [headed("contact"), { id: "contactForm", type: "contactForm" }] },
];

export const extOverlays: OverlayDef[] = [
  { id: "sideMenu", label: "Menu lateral", sectionIds: ["sideMenu"], trigger: "sections.header.elements.menu", side: "left", requires: "sideMenu" },
  { id: "searchOverlay", label: "Pesquisa", sectionIds: ["searchOverlay"], trigger: "sections.header.elements.search", side: "full", requires: "search" },
  { id: "cartDrawer", label: "Carrinho lateral", sectionIds: ["cartDrawer"], side: "right", requires: "cartDrawer" },
  { id: "authOverlay", label: "Entrar ou criar conta", sectionIds: ["authOverlay"], trigger: "sections.header.elements.account", side: "full", requires: "account" },
];

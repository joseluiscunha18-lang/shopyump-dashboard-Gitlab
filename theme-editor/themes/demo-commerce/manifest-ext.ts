// Extensão V1: navegação, páginas internas e painéis do tema Demo Commerce.
import type { ElementDef, LinkType, NavItem, OverlayDef, PageDef, SectionTypeDef, SettingDef } from "@/theme-editor/editor/contracts/types";

const B = "basic" as const;
const A = "advanced" as const;

const NAV_LINKS: LinkType[] = ["themePage", "category", "page", "url"];
const show = (d = true): SettingDef => ({ key: "show", label: "Mostrar", control: "toggle", tier: B, group: "content", default: d });

export const extCapabilities: Record<string, boolean> = {
  bottomNavigation: true,
  sideMenu: true,
  submenus: true,
  search: true,
  searchFilters: true,
  wishlist: true,
  cart: true,
  cartDrawer: true,
  account: true,
  contactForm: true,
  announcementBar: true,
  cartRecommendations: false,
  productReviews: false,
};

/** Ícones do cabeçalho: cada um é um elemento selecionável. */
const headerIcon = (id: string, label: string, icon: string, requires?: string, extra: SettingDef[] = []): ElementDef => ({
  id,
  kind: "icon",
  label,
  settings: {
    preset: "icon",
    omit: ["style", "bg"],
    override: { icon: { default: icon }, size: { default: 20, min: 16, max: 32 }, color: { default: "token:text" } },
    add: [show(), ...extra, ...(requires ? [] : [])],
  },
});

export const headerIconElements: ElementDef[] = [
  { ...headerIcon("menu", "Menu lateral", "menu"), openAction: { type: "overlay", id: "sideMenu" } },
  { ...headerIcon("search", "Pesquisa", "search"), openAction: { type: "themePage", page: "search" } },
  { ...headerIcon("wishlist", "Favoritos", "heart"), openAction: { type: "themePage", page: "wishlist" } },
  { ...headerIcon("account", "Conta", "user"), openAction: { type: "themePage", page: "account" } },
  {
    ...headerIcon("cart", "Carrinho", "shopping-bag", undefined, [
      { key: "showBadge", label: "Mostrar contador", control: "toggle", tier: B, group: "content", default: true },
    ]),
    openAction: { type: "overlay", id: "cartDrawer" },
  },
];

/** Segundo toque no cartão: abre a página Produto com o produto tocado. */
export const productCardOpen = { type: "themePage", page: "product" } as const;

const bottomNavDefault: NavItem[] = [
  { id: "home", label: "Início", icon: "home", link: { type: "themePage", value: "home" }, locked: true },
  { id: "wishlist", label: "Favoritos", icon: "heart", link: { type: "themePage", value: "wishlist" } },
  { id: "cart", label: "Carrinho", icon: "shopping-bag", link: { type: "themePage", value: "cart" } },
  { id: "account", label: "Conta", icon: "user", link: { type: "themePage", value: "account" } },
];

const sideMenuDefault: NavItem[] = [
  { id: "home", label: "Início", link: { type: "themePage", value: "home" }, locked: true },
  { id: "cats", label: "Categorias", auto: "categories", autoCount: 6 },
  { id: "new", label: "Novidades", link: { type: "themePage", value: "collection" } },
  { id: "sale", label: "Promoções", link: { type: "themePage", value: "collection" } },
  { id: "about", label: "Sobre", link: { type: "themePage", value: "about" } },
  { id: "contact", label: "Contacto", link: { type: "themePage", value: "contact" } },
];

const base = {
  required: false,
  removable: false,
  duplicable: false,
  reorderable: false,
  hideable: true,
} as const;

const container = (add: SettingDef[] = [], omit: string[] = []) => ({ preset: "container", omit, add });

const productCardEl: ElementDef = {
  id: "productCard",
  kind: "productCard",
  label: "Cartão de produto",
  openAction: productCardOpen,
  settings: [
    { key: "showName", label: "Mostrar nome", control: "toggle", tier: B, group: "content", default: true },
    { key: "showPrice", label: "Mostrar preço", control: "toggle", tier: B, group: "content", default: true },
    { key: "showComparePrice", label: "Mostrar preço anterior", control: "toggle", tier: B, group: "content", default: true },
    { key: "aspectRatio", label: "Proporção da imagem", control: "aspectRatio", tier: A, group: "layout", default: "4/5", options: [{ value: "1/1", label: "1:1" }, { value: "4/5", label: "4:5" }, { value: "3/4", label: "3:4" }] },
    { key: "nameSize", label: "Tamanho do nome", control: "slider", tier: A, group: "typography", default: 14, min: 11, max: 24, unit: "px" },
    { key: "productsInfo", label: "Produtos", control: "readonlyInfo", tier: B, group: "content", externalTarget: "products", default: "Nome, preço e imagem são geridos em Produtos." },
  ],
};

const gridSettings: SettingDef[] = [
  { key: "layout", label: "Disposição", control: "segmented", tier: B, group: "layout", default: "grid", options: [{ value: "grid", label: "Grelha" }, { value: "list", label: "Lista" }] },
  { key: "columns", label: "Colunas", control: "number", tier: B, group: "layout", responsive: true, default: { $r: { desktop: 4, tablet: 3, mobile: 2 } }, min: 1, max: 6 },
];

const heading = (text: string, extra: Record<string, unknown> = {}): ElementDef => ({
  id: "title", kind: "heading", label: "Título", settings: { preset: "heading", override: { text: { default: text }, ...extra } },
});

export const extSectionTypes: SectionTypeDef[] = [
  {
    ...base,
    type: "productGallery",
    label: "Galeria do produto",
    description: "Imagens do produto.",
    icon: "image",
    scope: "page",
    allowedPages: ["product"],
    elements: [],
    settings: container([
      { key: "aspectRatio", label: "Proporção da imagem", control: "aspectRatio", tier: B, group: "layout", default: "4/5", options: [{ value: "1/1", label: "1:1" }, { value: "4/5", label: "4:5" }, { value: "3/4", label: "3:4" }] },
      { key: "showThumbs", label: "Mostrar miniaturas", control: "toggle", tier: B, group: "content", default: true },
      { key: "imageRadius", label: "Arredondamento", control: "radius", tier: A, group: "appearance", default: 8, min: 0, max: 32, unit: "px" },
      { key: "imagesInfo", label: "Imagens", control: "readonlyInfo", tier: B, group: "content", externalTarget: "products", default: "As imagens são geridas em Produtos." },
    ]),
  },
  {
    ...base,
    type: "productInfo",
    label: "Informações do produto",
    description: "Nome, preço e compra.",
    icon: "tag",
    scope: "page",
    allowedPages: ["product"],
    elements: [
      { id: "addToCart", kind: "button", label: "Botão adicionar", settings: { preset: "button", omit: ["link"], override: { label: { default: "Adicionar ao carrinho" } } } },
    ],
    settings: container([
      { key: "nameSize", label: "Tamanho do nome", control: "slider", tier: B, group: "typography", default: 24, min: 16, max: 40, unit: "px" },
      { key: "priceSize", label: "Tamanho do preço", control: "slider", tier: B, group: "typography", default: 20, min: 12, max: 36, unit: "px" },
      { key: "showComparePrice", label: "Mostrar preço anterior", control: "toggle", tier: B, group: "content", default: true },
      { key: "showStock", label: "Mostrar disponibilidade", control: "toggle", tier: B, group: "content", default: true },
      { key: "align", label: "Alinhamento", control: "align", tier: A, group: "layout", default: "left" },
      { key: "productInfo", label: "Produto", control: "readonlyInfo", tier: B, group: "content", externalTarget: "products", default: "Nome, preço e stock são geridos em Produtos." },
    ]),
  },
  {
    ...base,
    type: "productDescription",
    label: "Descrição",
    description: "Texto do produto.",
    icon: "align-left",
    scope: "page",
    allowedPages: ["product"],
    elements: [heading("Descrição")],
    settings: container([
      { key: "descInfo", label: "Descrição", control: "readonlyInfo", tier: B, group: "content", externalTarget: "products", default: "A descrição é gerida em Produtos." },
    ]),
  },
  {
    ...base,
    type: "bottomNav",
    label: "Barra inferior",
    description: "Navegação fixa no fundo do ecrã.",
    icon: "panel-bottom",
    scope: "fixed",
    requires: "bottomNavigation",
    elements: [],
    settings: [
      { key: "items", label: "Itens", control: "navList", tier: B, group: "content", default: bottomNavDefault, navList: { maxItems: 5, maxDepth: 1, minVisible: 2, labelMaxLength: 16, iconEnabled: true, linkTypes: NAV_LINKS } },
      { key: "showLabels", label: "Mostrar nomes", control: "toggle", tier: B, group: "content", default: true },
      { key: "style", label: "Estilo", control: "segmented", tier: B, group: "layout", default: "flat", options: [{ value: "flat", label: "Plana" }, { value: "floating", label: "Flutuante" }] },
      { key: "bg", label: "Fundo", control: "color", tier: B, group: "appearance", default: "token:background" },
      { key: "activeColor", label: "Cor do item ativo", control: "color", tier: B, group: "appearance", default: "token:primary" },
      { key: "inactiveColor", label: "Cor do item inativo", control: "color", tier: B, group: "appearance", default: "#8C8C8C" },
      { key: "activeIndicator", label: "Indicador do ativo", control: "segmented", tier: A, group: "appearance", default: "pill", options: [{ value: "none", label: "Nenhum" }, { value: "pill", label: "Pílula" }, { value: "dot", label: "Ponto" }, { value: "line", label: "Linha" }] },
      { key: "iconSize", label: "Tamanho dos ícones", control: "slider", tier: A, group: "layout", default: 24, min: 18, max: 32, unit: "px" },
      { key: "showCartBadge", label: "Contador no carrinho", control: "toggle", tier: A, group: "behavior", default: true },
      { key: "border", label: "Borda", control: "slider", tier: A, group: "appearance", default: 1, min: 0, max: 4, unit: "px" },
      { key: "shadow", label: "Sombra", control: "shadow", tier: A, group: "appearance", default: "sm" },
      { key: "radius", label: "Arredondamento", control: "radius", tier: A, group: "appearance", default: 20, min: 0, max: 40, unit: "px", visibleWhen: { key: "style", equals: "floating" } },
      { key: "padding", label: "Espaçamento", control: "slider", tier: A, group: "spacing", default: 8, min: 0, max: 24, unit: "px" },
      { key: "behavior", label: "Ao rolar", control: "segmented", tier: A, group: "behavior", default: "always", options: [{ value: "always", label: "Sempre visível" }, { value: "hideOnScroll", label: "Esconder ao descer" }] },
      { key: "visibility", label: "Mostrar em", control: "visibilityByDevice", tier: A, group: "responsive", default: { desktop: false, tablet: true, mobile: true } },
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
    elements: [
      { id: "logo", kind: "logo", label: "Logótipo", settings: [show(), { key: "width", label: "Largura", control: "slider", tier: B, group: "layout", default: 110, min: 40, max: 200, unit: "px" }] },
      { id: "account", kind: "text", label: "Conta", settings: [show()] },
      { id: "contactButton", kind: "button", label: "Botão de WhatsApp", settings: [show(), { key: "label", label: "Texto", control: "text", tier: B, group: "content", default: "Fale connosco", maxLength: 30 }, { key: "info", label: "Número", control: "readonlyInfo", tier: B, group: "content", externalTarget: "store-info", default: "O número é gerido em Informações da loja." }] },
    ],
    settings: [
      { key: "items", label: "Itens", control: "navList", tier: B, group: "content", default: sideMenuDefault, navList: { maxItems: 10, maxDepth: 2, labelMaxLength: 24, iconEnabled: false, linkTypes: NAV_LINKS } },
      { key: "side", label: "Lado", control: "segmented", tier: B, group: "layout", default: "left", mobilePeek: true, options: [{ value: "left", label: "Esquerda" }, { value: "right", label: "Direita" }] },
      { key: "bg", label: "Fundo", control: "color", tier: B, group: "appearance", default: "token:background", mobilePeek: true },
      { key: "textColor", label: "Texto", control: "color", tier: B, group: "appearance", default: "token:text", assist: { contrastWith: "bg" } },
      { key: "width", label: "Largura", control: "slider", tier: B, group: "layout", default: 300, min: 240, max: 360, unit: "px", mobilePeek: true },
      { key: "itemSize", label: "Tamanho dos itens", control: "slider", tier: A, group: "typography", default: 16, min: 12, max: 22, unit: "px" },
      { key: "itemGap", label: "Espaço entre itens", control: "slider", tier: A, group: "spacing", default: 12, min: 4, max: 24, unit: "px" },
      { key: "divider", label: "Divisores", control: "segmented", tier: B, group: "appearance", default: "line", mobilePeek: true, options: [{ value: "none", label: "Nenhum" }, { value: "line", label: "Linha" }] },
      { key: "scrim", label: "Fundo escurecido", control: "slider", tier: A, group: "appearance", default: 40, min: 0, max: 80, unit: "%" },
    ],
  },
  {
    ...base,
    type: "pageHeading",
    label: "Título da página",
    description: "Título e subtítulo no topo da página.",
    icon: "heading",
    scope: "page",
    elements: [
      heading("", { htmlTag: { default: "h1" }, size: { default: 30 } }),
      { id: "subtitle", kind: "text", label: "Subtítulo", settings: { preset: "text", override: { text: { default: "" }, show: { default: false } } } },
    ],
    settings: container([{ key: "headAlign", label: "Alinhamento", control: "align", tier: B, group: "layout", responsive: true, default: "left" }], ["animation"]),
  },
  {
    ...base,
    hideable: false,
    type: "emptyState",
    label: "Estado vazio",
    description: "Mostrado quando não há itens.",
    icon: "inbox",
    scope: "page",
    elements: [
      { id: "icon", kind: "icon", label: "Ícone", settings: { preset: "icon", override: { icon: { default: "package" }, size: { default: 40 } } } },
      heading("Ainda não há nada aqui", { htmlTag: { default: "h2" }, size: { default: 22 }, align: { default: "center" } }),
      { id: "text", kind: "text", label: "Texto", settings: { preset: "text", override: { text: { default: "Explore os nossos produtos e encontre algo de que goste." }, align: { default: "center" } } } },
      { id: "button", kind: "button", label: "Botão", settings: { preset: "button", override: { label: { default: "Ver produtos" } } } },
    ],
    settings: container([], ["animation"]),
  },
  {
    ...base,
    type: "collectionToolbar",
    label: "Barra da coleção",
    description: "Ordenação, filtros e contagem.",
    icon: "sliders-horizontal",
    scope: "page",
    elements: [],
    settings: container([
      { key: "showSort", label: "Mostrar ordenação", control: "toggle", tier: B, group: "content", default: true },
      { key: "showFilters", label: "Mostrar filtros", control: "toggle", tier: B, group: "content", default: true, requires: "searchFilters" },
      { key: "showCount", label: "Mostrar nº de produtos", control: "toggle", tier: B, group: "content", default: true },
      { key: "showLayoutSwitch", label: "Alternar grelha/lista", control: "toggle", tier: A, group: "content", default: false },
    ], ["animation"]),
  },
  {
    ...base,
    type: "searchBar",
    label: "Barra de pesquisa",
    description: "Campo de pesquisa.",
    icon: "search",
    scope: "page",
    elements: [],
    settings: container([
      { key: "placeholder", label: "Texto do campo", control: "text", tier: B, group: "content", default: "Pesquisar produtos", maxLength: 40 },
      { key: "fieldStyle", label: "Estilo", control: "segmented", tier: B, group: "appearance", default: "outline", options: [{ value: "outline", label: "Contorno" }, { value: "filled", label: "Preenchido" }, { value: "line", label: "Linha" }] },
      { key: "barWidth", label: "Largura", control: "segmented", tier: B, group: "layout", default: "full", options: [{ value: "full", label: "Total" }, { value: "centered", label: "Centrada" }] },
      { key: "showButton", label: "Mostrar botão", control: "toggle", tier: A, group: "content", default: false },
      { key: "showSuggestions", label: "Mostrar categorias sugeridas", control: "toggle", tier: A, group: "content", default: true },
    ], ["animation"]),
  },
  {
    ...base,
    type: "searchResults",
    label: "Resultados",
    description: "Produtos encontrados.",
    icon: "layout-grid",
    scope: "page",
    elements: [productCardEl],
    settings: container([...gridSettings, { key: "showCount", label: "Mostrar nº de resultados", control: "toggle", tier: B, group: "content", default: true }]),
  },
  {
    ...base,
    type: "wishlistGrid",
    label: "Lista de favoritos",
    description: "Produtos guardados.",
    icon: "heart",
    scope: "page",
    requires: "wishlist",
    elements: [productCardEl],
    settings: container([
      ...gridSettings,
      { key: "removeStyle", label: "Remover", control: "segmented", tier: B, group: "appearance", default: "icon", options: [{ value: "icon", label: "Ícone" }, { value: "text", label: "Texto" }] },
    ]),
  },
  {
    ...base,
    type: "cartItems",
    label: "Produtos no carrinho",
    description: "Linhas do carrinho.",
    icon: "shopping-bag",
    scope: "page",
    requires: "cart",
    elements: [],
    settings: container([
      { key: "showImage", label: "Mostrar imagem", control: "toggle", tier: B, group: "content", default: true },
      { key: "imageSize", label: "Tamanho da imagem", control: "slider", tier: A, group: "layout", default: 80, min: 56, max: 120, unit: "px" },
      { key: "showVariant", label: "Mostrar variante", control: "toggle", tier: B, group: "content", default: true },
      { key: "quantityStyle", label: "Quantidade", control: "segmented", tier: B, group: "appearance", default: "buttons", options: [{ value: "buttons", label: "Botões +/−" }, { value: "select", label: "Seletor" }] },
      { key: "removeStyle", label: "Remover", control: "segmented", tier: B, group: "appearance", default: "icon", options: [{ value: "icon", label: "Ícone" }, { value: "text", label: "Texto" }] },
      { key: "divider", label: "Divisores", control: "toggle", tier: A, group: "appearance", default: true },
    ]),
  },
  {
    ...base,
    type: "cartSummary",
    label: "Resumo do carrinho",
    description: "Totais e finalizar compra.",
    icon: "receipt",
    scope: "page",
    requires: "cart",
    elements: [
      { id: "checkoutButton", kind: "button", label: "Finalizar compra", settings: { preset: "button", override: { label: { default: "Finalizar compra" } } } },
      { id: "continueShopping", kind: "button", label: "Continuar a comprar", settings: { preset: "button", override: { label: { default: "Continuar a comprar" }, variant: { default: "text" } } } },
      { id: "shippingNote", kind: "text", label: "Nota de envio", settings: { preset: "text", override: { text: { default: "Entrega em 3 a 5 dias úteis.", note: "Este texto não altera o valor do envio." }, show: { default: false }, size: { default: 13 } } } },
      { id: "secureNote", kind: "text", label: "Nota de segurança", settings: { preset: "text", override: { text: { default: "Pagamento 100% seguro." }, size: { default: 13 } } } },
    ],
    settings: container([
      { key: "showSubtotal", label: "Mostrar subtotal", control: "toggle", tier: B, group: "content", default: true },
      { key: "showDiscount", label: "Mostrar linha de desconto quando existir", control: "toggle", tier: B, group: "content", default: true },
      { key: "valuesInfo", label: "Valores", control: "readonlyInfo", tier: B, group: "content", externalTarget: "shipping", default: "Subtotal, desconto, envio e total vêm da loja e não se editam aqui." },
    ]),
  },
  {
    ...base,
    type: "accountPanel",
    label: "Conta",
    description: "Entrar ou ver pedidos.",
    icon: "user",
    scope: "page",
    requires: "account",
    elements: [
      { id: "loginButton", kind: "button", label: "Botão entrar", settings: { preset: "button", override: { label: { default: "Entrar" } } } },
      { id: "registerLink", kind: "button", label: "Criar conta", settings: { preset: "button", override: { label: { default: "Criar conta" }, variant: { default: "text" } } } },
    ],
    settings: container([
      { key: "intro", label: "Texto de entrada", control: "text", tier: B, group: "content", default: "Entre para ver os seus pedidos.", maxLength: 80 },
      { key: "welcome", label: "Boas-vindas", control: "text", tier: B, group: "content", default: "Olá, {nome}", maxLength: 40 },
      { key: "accountInfo", label: "Dados", control: "readonlyInfo", tier: B, group: "content", default: "Os dados reais da conta são geridos pelo sistema." },
    ]),
  },
  {
    ...base,
    type: "contentBlock",
    label: "Texto da página",
    description: "Conteúdo gerido em Páginas e políticas.",
    icon: "file-text",
    scope: "page",
    elements: [],
    settings: container([
      { key: "width", label: "Largura", control: "segmented", tier: B, group: "layout", default: "narrow", options: [{ value: "narrow", label: "Estreita" }, { value: "normal", label: "Normal" }] },
      { key: "textSize", label: "Tamanho do texto", control: "slider", tier: A, group: "typography", default: 16, min: 13, max: 20, unit: "px" },
      { key: "policyInfo", label: "Conteúdo", control: "readonlyInfo", tier: B, group: "content", externalTarget: "policies", default: "O texto desta página é gerido em Páginas e políticas." },
    ]),
  },
  {
    ...base,
    type: "contactChannels",
    label: "Canais de contacto",
    description: "WhatsApp, telefone, e-mail, morada.",
    icon: "phone",
    scope: "page",
    elements: [],
    settings: container([
      { key: "showWhatsapp", label: "WhatsApp", control: "toggle", tier: B, group: "content", default: true },
      { key: "showPhone", label: "Telefone", control: "toggle", tier: B, group: "content", default: true },
      { key: "showEmail", label: "E-mail", control: "toggle", tier: B, group: "content", default: true },
      { key: "showAddress", label: "Morada", control: "toggle", tier: B, group: "content", default: true },
      { key: "showHours", label: "Horário", control: "toggle", tier: B, group: "content", default: true },
      { key: "layout", label: "Disposição", control: "segmented", tier: B, group: "layout", default: "cards", options: [{ value: "cards", label: "Cartões" }, { value: "list", label: "Lista" }] },
      { key: "storeInfo", label: "Dados", control: "readonlyInfo", tier: B, group: "content", externalTarget: "store-info", default: "Os dados são geridos em Informações da loja." },
    ]),
  },
  {
    ...base,
    type: "contactForm",
    label: "Formulário de contacto",
    description: "Envio de mensagem à loja.",
    icon: "mail",
    scope: "page",
    requires: "contactForm",
    elements: [
      heading("Envie-nos uma mensagem", { size: { default: 22 } }),
      { id: "submit", kind: "button", label: "Botão enviar", settings: { preset: "button", override: { label: { default: "Enviar mensagem" } } } },
    ],
    settings: container([
      { key: "showPhoneField", label: "Campo de telefone", control: "toggle", tier: B, group: "content", default: false, note: "As mensagens chegam ao e-mail da loja." },
    ]),
  },
];

const chrome = { topSections: ["announcement", "header"], bottomSections: ["footer"], fixedSections: ["bottomNav"] };
const filled = (a: string, b: string) => [{ id: "filled", label: a }, { id: "empty", label: b }];

export const extPages: PageDef[] = [
  { id: "product", label: "Produto", supported: true, kind: "product", group: "main", previewNeeds: "product", ...chrome,
    sections: [{ id: "productGallery", type: "productGallery" }, { id: "productInfo", type: "productInfo" }, { id: "productDescription", type: "productDescription" }, { id: "relatedProducts", type: "searchResults" }] },
  { id: "collection", label: "Coleção", supported: true, kind: "collection", group: "main", previewNeeds: "collection", ...chrome,
    sections: [{ id: "collectionHeading", type: "pageHeading" }, { id: "collectionToolbar", type: "collectionToolbar" }, { id: "collectionProducts", type: "searchResults" }] },
  { id: "search", label: "Pesquisa", supported: true, kind: "search", group: "main", previewNeeds: "search", requires: "search", previewStates: [{ id: "results", label: "Com resultados" }, { id: "empty", label: "Sem resultados" }], ...chrome,
    sections: [{ id: "searchBar", type: "searchBar" }, { id: "searchResults", type: "searchResults" }, { id: "noResults", type: "emptyState" }] },
  { id: "wishlist", label: "Favoritos", supported: true, kind: "wishlist", group: "main", requires: "wishlist", previewStates: filled("Com favoritos", "Vazio"), ...chrome,
    sections: [{ id: "wishlistHeading", type: "pageHeading" }, { id: "wishlistGrid", type: "wishlistGrid" }, { id: "wishlistEmpty", type: "emptyState" }] },
  { id: "cart", label: "Carrinho", supported: true, kind: "cart", group: "main", requires: "cart", previewStates: filled("Com produtos", "Vazio"), ...chrome,
    sections: [{ id: "cartHeading", type: "pageHeading" }, { id: "cartItems", type: "cartItems" }, { id: "cartSummary", type: "cartSummary" }, { id: "cartEmpty", type: "emptyState" }] },
  { id: "account", label: "Conta", supported: true, kind: "account", group: "main", requires: "account", previewStates: [{ id: "guest", label: "Sem sessão" }, { id: "user", label: "Com sessão" }], ...chrome,
    sections: [{ id: "accountHeading", type: "pageHeading" }, { id: "accountPanel", type: "accountPanel" }] },
  ...(["about:Sobre", "shipping:Entregas", "returns:Devoluções", "terms:Termos"].map((s) => {
    const [id, label] = s.split(":");
    return { id, label, supported: true, kind: "content" as const, group: "info" as const, ...chrome,
      sections: [{ id: `${id}Heading`, type: "pageHeading" }, { id: `${id}Content`, type: "contentBlock" }] };
  })),
  { id: "contact", label: "Contacto", supported: true, kind: "content", group: "info", ...chrome,
    sections: [{ id: "contactHeading", type: "pageHeading" }, { id: "contactChannels", type: "contactChannels" }, { id: "contactForm", type: "contactForm" }] },
];

/** Títulos padrão por instância de pageHeading. */
export const headingDefaults: Record<string, string> = {
  collectionHeading: "Coleção",
  wishlistHeading: "Favoritos",
  cartHeading: "Carrinho",
  accountHeading: "A minha conta",
  aboutHeading: "Sobre nós",
  shippingHeading: "Entregas",
  returnsHeading: "Devoluções",
  termsHeading: "Termos e condições",
  contactHeading: "Contacto",
};

export const extOverlays: OverlayDef[] = [
  { id: "sideMenu", label: "Menu lateral", sectionIds: ["sideMenu"], trigger: "sections.header.elements.menu", side: "left", requires: "sideMenu" },
  { id: "cartDrawer", label: "Carrinho lateral", sectionIds: ["cartItems", "cartSummary", "cartEmpty"], trigger: "sections.header.elements.cart", side: "right", requires: "cartDrawer" },
];

/** Chaves comerciais que nenhum manifesto pode expor (regra de proteção). */
export const FORBIDDEN_KEYS = ["price", "stock", "taxRate", "discountValue", "shippingCost", "paymentStatus"];

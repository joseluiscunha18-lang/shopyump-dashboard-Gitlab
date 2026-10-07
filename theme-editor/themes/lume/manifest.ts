import type { SettingDef, ThemeManifest } from "@/theme-editor/editor/contracts/types";
import * as P from "./presets";
import { extCapabilities, extOverlays, extPages, extSectionTypes, headerIconElements, productCardOpen } from "./manifest-ext";

/**
 * Manifesto do tema LUME — o tema padrão da plataforma Shopyump.
 *
 * Os valores por omissão reproduzem o visual real do Lume
 * (lib/store/themes/lume + app/theme-lume.css), convertidos de oklch para hex
 * porque o editor guarda cores em hex. Por isso, sem nenhuma personalização,
 * o preview do editor é igual à loja pública.
 */

const B = "basic" as const;
const A = "advanced" as const;

/**
 * REGRA DE OURO deste manifesto: só se oferece ao lojista o que a LOJA PÚBLICA
 * (lib/store/themes/lume + lib/store/themes/lume/lib/personalizacao.ts) realmente
 * aplica. Um controlo que muda o editor mas não a loja é uma mentira — por isso
 * os presets são aparados com listas "keep" (tudo o resto é omitido).
 */
const CONTAINER_KEYS = ["colorScheme", "align", "contentWidth", "spacing", "padding", "gap", "background", "radius", "shadow", "minHeight", "visibility", "animation", "anchorId"];
const HEADING_KEYS = ["text", "show", "align", "color", "size", "htmlTag", "font", "weight", "lineHeight", "letterSpacing", "transform", "maxLines", "marginBottom", "opacity", "visibility"];
const TEXT_KEYS = ["text", "show", "align", "color", "size", "font", "weight", "lineHeight", "letterSpacing", "transform", "maxLines", "marginBottom", "opacity", "visibility"];
const BUTTON_KEYS = ["show", "label", "link", "variant", "size", "bg", "textColor", "radius", "width", "weight", "transform", "icon", "visibility"];
const except = (all: string[], keep: string[]) => all.filter((k) => !keep.includes(k));

const colors: SettingDef[] = [
  { key: "primary", label: "Cor principal", control: "color", tier: B, group: "appearance", default: "#202020" },
  { key: "background", label: "Fundo", control: "color", tier: B, group: "appearance", default: "#FFFFFF" },
  { key: "text", label: "Texto", control: "color", tier: B, group: "appearance", default: "#202020", assist: { contrastWith: "background" } },
  { key: "secondary", label: "Texto secundário", control: "color", tier: B, group: "appearance", default: "#696969" },
  { key: "buttonBg", label: "Fundo dos botões", control: "color", tier: B, group: "appearance", default: "token:primary" },
  { key: "buttonText", label: "Texto dos botões", control: "color", tier: B, group: "appearance", default: "#FFFFFF", assist: { contrastWith: "buttonBg" } },
  { key: "heroFrom", label: "Banner: cor inicial", control: "color", tier: B, group: "appearance", default: "#F9F1E5" },
  { key: "heroTo", label: "Banner: cor final", control: "color", tier: B, group: "appearance", default: "#D2D8DF" },
  { key: "border", label: "Bordas", control: "color", tier: A, group: "appearance", default: "#D8D8D8" },
  { key: "cardBg", label: "Fundo dos cartões", control: "color", tier: A, group: "appearance", default: "#FFFFFF" },
  { key: "surfaceAlt", label: "Fundo secundário", control: "color", tier: A, group: "appearance", default: "#EFEFEF" },
  { key: "gallery", label: "Fundo das fotos de produto", control: "color", tier: A, group: "appearance", default: "#F3F3F3" },
];

const typography: SettingDef[] = [
  { key: "headingFont", label: "Fonte dos títulos", control: "font", tier: B, group: "typography", default: "manrope" },
  { key: "bodyFont", label: "Fonte do texto", control: "font", tier: B, group: "typography", default: "manrope" },
  { key: "bodyWeight", label: "Peso do texto", control: "fontWeight", tier: A, group: "typography", default: 400 },
  {
    key: "headingTransform",
    label: "Transformação dos títulos",
    control: "segmented",
    tier: A,
    group: "typography",
    default: "none",
    options: [
      { value: "none", label: "Normal" },
      { value: "uppercase", label: "MAIÚSC." },
      { value: "capitalize", label: "Capitalizar" },
    ],
  },
];

const style: SettingDef[] = [
  { key: "preset", label: "Estilo geral", control: "stylePreset", tier: B, group: "appearance", default: "lume" },
  { key: "radius", label: "Arredondamento", control: "radius", tier: B, group: "appearance", default: 16, min: 0, max: 32, unit: "px" },
  { key: "imageRadius", label: "Arredondamento das imagens", control: "radius", tier: A, group: "appearance", default: 16, min: 0, max: 32, unit: "px" },
  { key: "borderWidth", label: "Espessura das bordas", control: "slider", tier: A, group: "appearance", default: 1, min: 0, max: 4, unit: "px" },
  { key: "shadowStrength", label: "Sombras", control: "shadow", tier: A, group: "appearance", default: "none" },
  {
    key: "imageHover",
    label: "Efeito ao passar",
    control: "segmented",
    tier: A,
    group: "behavior",
    default: "zoom",
    options: [
      { value: "none", label: "Nenhum" },
      { value: "zoom", label: "Zoom suave" },
    ],
  },
];

const layout: SettingDef[] = [
  {
    key: "contentWidth",
    label: "Largura do conteúdo",
    control: "segmented",
    tier: B,
    group: "layout",
    default: 1152,
    options: [
      { value: 960, label: "Estreita" },
      { value: 1152, label: "Normal" },
      { value: 1344, label: "Larga" },
      { value: 0, label: "Total" },
    ],
  },
  { key: "gridGap", label: "Espaço entre itens", control: "slider", tier: A, group: "spacing", responsive: true, default: { $r: { desktop: 20, mobile: 12 } }, min: 4, max: 48, unit: "px" },
];

/** Botão do Lume: pílula (arredondamento total). */
const pill = { radius: { default: 999 } };

const baseManifest: ThemeManifest = {
  schemaVersion: 1,
  id: "lume",
  name: "Lume",
  version: "1.1.0",
  rendererId: "lume",
  capabilities: {
    colorSchemes: true,
    animations: false,
    wishlist: true,
    floatingWhatsApp: true,
    ...extCapabilities,
  },
  fonts: [
    { id: "manrope", label: "Manrope", family: "'Manrope', system-ui, sans-serif", weights: [400, 500, 600, 700, 800], category: "sans" },
    { id: "inter", label: "Inter", family: "'Inter', system-ui, sans-serif", weights: [300, 400, 500, 600, 700], category: "sans" },
    { id: "dm-sans", label: "DM Sans", family: "'DM Sans', system-ui, sans-serif", weights: [400, 500, 700], category: "sans" },
    { id: "poppins", label: "Poppins", family: "'Poppins', system-ui, sans-serif", weights: [300, 400, 500, 600, 700], category: "sans" },
    { id: "montserrat", label: "Montserrat", family: "'Montserrat', system-ui, sans-serif", weights: [300, 400, 500, 600, 700], category: "sans" },
    { id: "work-sans", label: "Work Sans", family: "'Work Sans', system-ui, sans-serif", weights: [400, 500, 600, 700], category: "sans" },
    { id: "playfair", label: "Playfair Display", family: "'Playfair Display', Georgia, serif", weights: [400, 500, 600, 700], category: "serif" },
    { id: "lora", label: "Lora", family: "'Lora', Georgia, serif", weights: [400, 500, 600, 700], category: "serif" },
  ],
  colorSchemes: [
    { id: "light", label: "Claro", colors: { background: "#FFFFFF", text: "#202020", primary: "#202020", buttonBg: "#202020", buttonText: "#FFFFFF" } },
    { id: "soft", label: "Suave", colors: { background: "#F3F3F3", text: "#202020", primary: "#202020", buttonBg: "#202020", buttonText: "#FFFFFF" } },
    { id: "dark", label: "Escuro", colors: { background: "#202020", text: "#FFFFFF", primary: "#FFFFFF", buttonBg: "#FFFFFF", buttonText: "#202020" } },
  ],
  palettes: [
    { id: "lume", label: "Lume", colors: { primary: "#202020", background: "#FFFFFF", text: "#202020", secondary: "#696969", buttonBg: "#202020", buttonText: "#FFFFFF", heroFrom: "#F9F1E5", heroTo: "#D2D8DF", surfaceAlt: "#EFEFEF" } },
    { id: "warm", label: "Quente", colors: { primary: "#8A5A2B", background: "#FFFBF5", text: "#2A1B10", secondary: "#8A7A6C", buttonBg: "#8A5A2B", buttonText: "#FFFFFF", heroFrom: "#F7EDE1", heroTo: "#E9D5BC", surfaceAlt: "#F7EDE1" } },
    { id: "ocean", label: "Oceano", colors: { primary: "#12506B", background: "#FFFFFF", text: "#0F2730", secondary: "#5F7480", buttonBg: "#12506B", buttonText: "#FFFFFF", heroFrom: "#EAF4F8", heroTo: "#C5DDE8", surfaceAlt: "#EAF4F8" } },
    { id: "forest", label: "Floresta", colors: { primary: "#1F4D32", background: "#FCFDFB", text: "#15251B", secondary: "#5C8A6A", buttonBg: "#1F4D32", buttonText: "#FFFFFF", heroFrom: "#EBF2EC", heroTo: "#CFE0D4", surfaceAlt: "#EBF2EC" } },
    { id: "rose", label: "Rosa suave", colors: { primary: "#9B4B63", background: "#FFF9FA", text: "#2E1B21", secondary: "#8A6A73", buttonBg: "#9B4B63", buttonText: "#FFFFFF", heroFrom: "#FBECEF", heroTo: "#F1CFD8", surfaceAlt: "#FBECEF" } },
  ],
  stylePresets: [
    { id: "lume", label: "Lume", description: "O visual original: cantos redondos, sem sombras.", values: { radius: 16, imageRadius: 16, shadowStrength: "none", borderWidth: 1 } },
    { id: "soft", label: "Suave", description: "Mais arredondado, sombra leve.", values: { radius: 24, imageRadius: 24, shadowStrength: "sm", borderWidth: 1 } },
    { id: "minimal", label: "Reto", description: "Linhas retas, sem sombras.", values: { radius: 0, imageRadius: 0, shadowStrength: "none", borderWidth: 1 } },
  ],
  global: [
    { id: "colors", label: "Cores", icon: "palette", settings: colors },
    { id: "typography", label: "Tipografia", icon: "type", settings: typography },
    { id: "style", label: "Estilo", icon: "sparkles", settings: style },
    { id: "layout", label: "Layout", icon: "layout", settings: layout },
  ],
  pages: [
    {
      id: "home",
      label: "Início",
      supported: true,
      kind: "home",
      group: "main",
      fixedSections: ["bottomNav"],
      topSections: ["announcement", "header"],
      sections: [
        { id: "hero", type: "hero" },
        { id: "products", type: "products" },
        { id: "whatsappCta", type: "whatsappCta" },
      ],
      bottomSections: ["footer"],
    },
    ...extPages,
  ],
  overlays: extOverlays,
  blockTypes: [],
  presets: {
    container: P.container,
    heading: P.heading,
    text: P.text,
    image: P.image,
    button: P.button,
    icon: P.icon,
    card: P.card,
  },
  icons: ["truck", "shield-check", "message-circle", "credit-card", "gift", "heart", "star", "package", "refresh-cw", "clock", "phone", "mail", "map-pin", "sparkles", "tag", "shopping-bag", "arrow-right"],
  sectionTypes: [
    ...extSectionTypes,
    /* ------------------------------ Barra de anúncio ------------------------------ */
    {
      type: "announcement",
      label: "Barra de anúncio",
      description: "Mensagem fina no topo da loja.",
      icon: "megaphone",
      scope: "global",
      required: false,
      removable: true,
      duplicable: false,
      reorderable: false,
      hideable: true,
      maxInstances: 1,
      elements: [
        {
          id: "message",
          kind: "text",
          label: "Mensagem",
          settings: {
            preset: "text",
            omit: except(TEXT_KEYS, ["text", "color", "size", "transform"]),
            override: {
              text: { default: "Entregas em todo Moçambique" },
              size: { default: 10 },
              color: { default: "#FFFFFF" },
              transform: { default: "uppercase" },
            },
          },
        },
      ],
      settings: {
        preset: "container",
        omit: except(CONTAINER_KEYS, ["colorScheme"]),
        override: { colorScheme: { default: "dark" } },
        add: [{ key: "height", label: "Altura", control: "slider", tier: B, group: "layout", default: 36, min: 24, max: 64, unit: "px" }],
      },
    },

    /* ------------------------------ Cabeçalho ------------------------------ */
    {
      type: "header",
      label: "Cabeçalho",
      description: "Nome da loja, menu e ícones.",
      icon: "panel-top",
      scope: "global",
      required: true,
      removable: false,
      duplicable: false,
      reorderable: false,
      hideable: false,
      elements: [
        {
          id: "name",
          kind: "text",
          label: "Nome da loja",
          settings: {
            preset: "text",
            omit: except(TEXT_KEYS, ["color", "size", "weight"]),
            override: { size: { default: 18 }, weight: { default: 800 }, color: { default: "token:text" } },
          },
        },
        ...headerIconElements,
      ],
      settings: {
        preset: "container",
        omit: [...CONTAINER_KEYS],
        add: [
          { key: "sticky", label: "Cabeçalho fixo", control: "toggle", tier: B, group: "behavior", default: true },
          { key: "height", label: "Altura", control: "slider", tier: A, group: "layout", default: 64, min: 48, max: 96, unit: "px" },
          { key: "borderBottom", label: "Linha inferior", control: "toggle", tier: A, group: "appearance", default: false },
        ],
      },
    },

    /* ------------------------------ Banner principal ------------------------------ */
    {
      type: "hero",
      label: "Banner principal",
      description: "Título grande com botão e ilustração.",
      icon: "image",
      scope: "page",
      allowedPages: ["home"],
      required: true,
      removable: false,
      duplicable: false,
      reorderable: true,
      hideable: true,
      elements: [
        {
          id: "title",
          kind: "heading",
          label: "Título",
          settings: {
            preset: "heading",
            omit: except(HEADING_KEYS, ["text", "color", "size", "weight"]),
            override: {
              text: { default: "BEM-VINDO À LOJA" },
              size: { default: { $r: { desktop: 48, mobile: 22 } } },
              weight: { default: 800 },
              color: { default: "token:text" },
            },
          },
        },
        {
          id: "subtitle",
          kind: "text",
          label: "Descrição",
          settings: {
            preset: "text",
            omit: except(TEXT_KEYS, ["text", "show", "color", "size"]),
            override: {
              text: { default: "Descubra a nova colecção." },
              show: { default: false },
              color: { default: "token:secondary" },
              size: { default: { $r: { desktop: 18, mobile: 14 } } },
            },
          },
        },
        {
          id: "button",
          kind: "button",
          label: "Botão",
          settings: {
            preset: "button",
            omit: except(BUTTON_KEYS, ["label", "bg", "textColor"]),
            override: {
              label: { default: "Ver Produtos" },
              bg: { default: "#FFFFFF" },
              textColor: { default: "#202020" },
            },
          },
        },
      ],
      settings: {
        preset: "container",
        omit: [...CONTAINER_KEYS],
        add: [
          { key: "height", label: "Altura", control: "slider", tier: B, group: "layout", responsive: true, default: { $r: { desktop: 403, mobile: 263 } }, min: 200, max: 800, unit: "px" },
          { key: "showIllustration", label: "Mostrar ilustração", control: "toggle", tier: B, group: "appearance", default: true },
        ],
      },
    },

    /* ------------------------------ Produtos ------------------------------ */
    {
      type: "products",
      label: "Produtos",
      description: "Grelha de produtos da loja.",
      icon: "shopping-bag",
      scope: "page",
      allowedPages: ["home"],
      required: false,
      removable: true,
      duplicable: false,
      reorderable: true,
      hideable: true,
      maxInstances: 1,
      dataSource: { kind: "products", modes: ["all", "manual"], sort: ["recent", "priceAsc", "priceDesc"], maxItems: { min: 2, max: 24 } },
      elements: [
        {
          id: "title",
          kind: "heading",
          label: "Título",
          settings: {
            preset: "heading",
            omit: except(HEADING_KEYS, ["text", "color", "size", "weight"]),
            override: {
              text: { default: "Produtos" },
              size: { default: { $r: { desktop: 24, mobile: 20 } } },
              weight: { default: 700 },
              color: { default: "token:text" },
            },
          },
        },
        {
          id: "viewAll",
          kind: "button",
          label: "Botão explorar mais",
          settings: {
            preset: "button",
            omit: except(BUTTON_KEYS, ["label"]),
            override: { label: { default: "Explorar mais" } },
          },
        },
        {
          id: "productCard",
          kind: "productCard",
          label: "Cartão de produto",
          openAction: productCardOpen,
          settings: [
            { key: "showName", label: "Mostrar nome", control: "toggle", tier: B, group: "content", default: true },
            { key: "showPrice", label: "Mostrar preço", control: "toggle", tier: B, group: "content", default: true },
            { key: "showBadge", label: "Mostrar etiqueta (esgotado)", control: "toggle", tier: B, group: "content", default: true },
            { key: "showWishlist", label: "Mostrar favorito", control: "toggle", tier: B, group: "content", requires: "wishlist", default: true },
            { key: "aspectRatio", label: "Proporção da imagem", control: "aspectRatio", tier: A, group: "layout", default: "1/1", options: [{ value: "1/1", label: "1:1" }, { value: "4/5", label: "4:5" }, { value: "3/4", label: "3:4" }] },
            { key: "align", label: "Alinhamento", control: "align", tier: A, group: "layout", default: "left" },
            { key: "nameSize", label: "Tamanho do nome", control: "slider", tier: A, group: "typography", default: 14, min: 11, max: 24, unit: "px" },
            { key: "priceSize", label: "Tamanho do preço", control: "slider", tier: A, group: "typography", default: 14, min: 12, max: 32, unit: "px" },
            { key: "imageBg", label: "Fundo da foto", control: "color", tier: A, group: "appearance", default: "token:gallery" },
            { key: "imageBorder", label: "Borda da foto", control: "toggle", tier: A, group: "appearance", default: true },
            { key: "productsInfo", label: "Produtos", control: "readonlyInfo", tier: B, group: "content", externalTarget: "products", default: "Nome, preço e imagem são geridos em Produtos." },
          ],
        },
      ],
      settings: {
        preset: "container",
        omit: [...CONTAINER_KEYS],
        add: [
          { key: "mode", label: "Origem", control: "segmented", tier: B, group: "content", default: "all", options: [{ value: "all", label: "Todos" }, { value: "manual", label: "Manual" }] },
          { key: "picked", label: "Produtos", control: "productPicker", tier: B, group: "content", visibleWhen: { key: "mode", equals: "manual" }, default: [] },
          { key: "count", label: "Quantidade", control: "number", tier: B, group: "content", default: 6, min: 2, max: 24 },
          { key: "sort", label: "Ordenar por", control: "select", tier: B, group: "content", default: "recent", options: [{ value: "recent", label: "Mais recentes" }, { value: "priceAsc", label: "Preço ↑" }, { value: "priceDesc", label: "Preço ↓" }] },
          { key: "columns", label: "Colunas", control: "number", tier: B, group: "layout", responsive: true, default: { $r: { desktop: 3, tablet: 3, mobile: 2 } }, min: 1, max: 6 },
        ],
      },
    },

    /* ------------------------------ Contacto por WhatsApp ------------------------------ */
    {
      type: "whatsappCta",
      label: "Contacto por WhatsApp",
      description: "Cartão com botão para falar no WhatsApp.",
      icon: "message-circle",
      scope: "page",
      allowedPages: ["home"],
      required: false,
      removable: true,
      duplicable: false,
      reorderable: true,
      hideable: true,
      maxInstances: 1,
      elements: [
        {
          id: "title",
          kind: "heading",
          label: "Título",
          settings: {
            preset: "heading",
            omit: except(HEADING_KEYS, ["text", "color", "size", "weight"]),
            override: {
              text: { default: "Ficou com alguma dúvida sobre os produtos?" },
              size: { default: { $r: { desktop: 18, mobile: 16 } } },
              weight: { default: 600 },
              color: { default: "token:text" },
            },
          },
        },
        {
          id: "text",
          kind: "text",
          label: "Descrição",
          settings: {
            preset: "text",
            omit: except(TEXT_KEYS, ["text", "color", "size"]),
            override: { text: { default: "Fale diretamente connosco." }, size: { default: 14 }, color: { default: "token:secondary" } },
          },
        },
        {
          id: "button",
          kind: "button",
          label: "Botão",
          settings: {
            preset: "button",
            omit: except(BUTTON_KEYS, ["label"]),
            override: { label: { default: "Falar no WhatsApp" } },
          },
        },
      ],
      settings: {
        preset: "container",
        omit: [...CONTAINER_KEYS],
        add: [
          { key: "whatsappInfo", label: "Número de WhatsApp", control: "readonlyInfo", tier: B, group: "content", externalTarget: "store-info", default: "O número é gerido em Informações da loja. Sem número, esta secção não aparece na loja." },
          {
            key: "cardStyle",
            label: "Cartão",
            control: "segmented",
            tier: B,
            group: "appearance",
            default: "filled",
            options: [
              { value: "filled", label: "Preenchido" },
              { value: "border", label: "Só borda" },
            ],
          },
        ],
      },
    },

    /* ------------------------------ Rodapé ------------------------------ */
    {
      type: "footer",
      label: "Rodapé",
      description: "Informações, redes sociais e direitos.",
      icon: "panel-bottom",
      scope: "global",
      required: true,
      removable: false,
      duplicable: false,
      reorderable: false,
      hideable: false,
      elements: [
        {
          id: "heading",
          kind: "heading",
          label: "Título da coluna",
          settings: {
            preset: "heading",
            omit: except(HEADING_KEYS, ["text"]),
            override: { text: { default: "INFORMAÇÕES" } },
          },
        },
        {
          id: "policyLinks",
          kind: "policyLinks",
          label: "Links de informação",
          settings: [
            { key: "shipping", label: "Envios e Entregas", control: "toggle", tier: B, group: "content", default: true },
            { key: "returns", label: "Trocas e Devoluções", control: "toggle", tier: B, group: "content", default: true },
            { key: "terms", label: "Termos e Privacidade", control: "toggle", tier: B, group: "content", default: true },
            { key: "policiesInfo", label: "Conteúdo", control: "readonlyInfo", tier: B, group: "content", externalTarget: "policies", default: "O conteúdo é gerido em Páginas e políticas." },
          ],
        },
        {
          id: "socialLinks",
          kind: "socialLinks",
          label: "Redes sociais",
          settings: [
            { key: "instagram", label: "Instagram", control: "toggle", tier: B, group: "content", default: true },
            { key: "facebook", label: "Facebook", control: "toggle", tier: B, group: "content", default: true },
            { key: "tiktok", label: "TikTok", control: "toggle", tier: B, group: "content", default: true },
            { key: "socialInfo", label: "Endereços", control: "readonlyInfo", tier: B, group: "content", externalTarget: "social-links", default: "Só aparecem as redes que preencheu em Redes sociais." },
          ],
        },
        {
          id: "copyright",
          kind: "text",
          label: "Direitos de autor",
          settings: {
            preset: "text",
            omit: except(TEXT_KEYS, ["text"]),
            override: { text: { default: "© {ano} {loja}. Todos os direitos reservados.", maxLength: 120 } },
          },
        },
        {
          id: "credit",
          kind: "text",
          label: "Crédito Shopyump",
          settings: [{ key: "show", label: "Mostrar “Criado com Shopyump”", control: "toggle", tier: B, group: "content", default: true }],
        },
      ],
      settings: {
        preset: "container",
        omit: [...CONTAINER_KEYS],
        add: [{ key: "borderTop", label: "Linha superior", control: "toggle", tier: A, group: "appearance", default: true }],
      },
    },
  ],
};

/** Botões com "Destino" abrem esse destino no segundo toque (ver openAction). */
export const lumeManifest: ThemeManifest = baseManifest;

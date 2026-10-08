import type { Customization, Device } from "@/theme-editor/editor/contracts/types";
import { lumeManifest as M } from "@/theme-editor/themes/lume/manifest";
import { resolveColor, resolveValue, visibleSectionIds } from "@/theme-editor/editor/core/resolve";
import { elementPath, sectionPath } from "@/theme-editor/editor/core/paths";
import { settingsForPath } from "@/theme-editor/editor/core/resolve";
import { DEFAULT_MENU_ITEMS, HEADING_SECTION, PAGE_TEXT, THEME_PAGE_ROUTE, UI_TEXT, type LumePageKey } from "@/theme-editor/themes/lume/page-text";
import { sectionTypeOf } from "@/theme-editor/editor/core/resolve";
import { BUCKETS } from "@/lib/storageBuckets";
import { LUME_COLOR_VARS } from "./color-vars";
import { bottomNavVars, isBottomNavTone } from "./bottom-nav-style";
import { resolveBottomNavItems, BOTTOM_NAV_DEFAULTS, type BottomNavItemConfig } from "@/lib/store/shared/storefront-logic";

/**
 * PERSONALIZAÇÃO DO TEMA LUME NA LOJA PÚBLICA
 *
 * Converte a customização guardada pelo editor (`lojas.tema_personalizacao`)
 * num objeto simples e serializável que o tema público (client) aplica.
 *
 * PRINCÍPIO: só se emite o que DIFERE do tema por omissão. Calcula-se o valor
 * resolvido da customização do lojista e o da customização vazia, e compara-se.
 * Resultado: uma loja sem personalização (ou com `null`) fica EXATAMENTE como o
 * Lume original — e nunca há regressão visual por valores por omissão
 * diferentes entre o editor e a loja.
 *
 * SEGURANÇA: o JSON vem da base de dados (escrito pelo dono da loja, mas pode
 * ter sido forjado). Nada daqui é injetado "às cegas": cores só passam se forem
 * hexadecimais válidos, números são limitados a intervalos seguros, fontes só
 * as do manifesto e textos só vão para o React como texto (escapado).
 *
 * Este ficheiro corre no SERVIDOR (ver lume/index.tsx) — o manifesto e o código
 * de resolução do editor não vão para o bundle do navegador.
 */

export interface LumePersonalizacao {
  /** Variáveis CSS (cores, raio) aplicadas no wrapper `.theme-lume`. */
  vars: Record<string, string>;
  /** Folha de estilo extra, toda limitada a `.theme-lume`. */
  css: string;
  /** Google Fonts a carregar (null = só a Manrope, já carregada pela app). */
  fontsHref: string | null;
  /** Textos que o lojista alterou (ausente = usar o texto original do tema). */
  text: Partial<{
    announcement: string;
    heroTitle: string;
    heroSubtitle: string;
    heroButton: string;
    productsTitle: string;
    viewAll: string;
    whatsTitle: string;
    whatsText: string;
    whatsButton: string;
    footerHeading: string;
    copyright: string;
    /** Mensagem já escrita quando o cliente abre o WhatsApp pelo cartão. */
    whatsMessage: string;
  }>;
  /** Título/etiqueta/descrição das páginas internas (só o que o lojista escreveu). */
  pages: Partial<Record<LumePageKey, Partial<{ eyebrow: string; title: string; description: string }>>>;
  /** Textos de painéis e botões alterados (ausente = original). */
  ui: Partial<{
    searchTitle: string;
    searchPlaceholder: string;
    cartTitle: string;
    cartDescription: string;
    cartCheckout: string;
    addToCart: string;
    buyNow: string;
    recommendations: string;
    contactSubmit: string;
  }>;
  showRecommendations: boolean;
  /** Links do menu lateral (null = os originais da loja). */
  menuItems: { label: string; kind: "page" | "category" | "url"; value: string }[] | null;
  showHeroSubtitle: boolean;
  showCredit: boolean;
  announcementVisible: boolean;
  /**
   * Barra inferior: só presente se o lojista a mudou (ausente = a original, com os
   * 4 itens). `visible:false` = removida (o cabeçalho passa a mostrar Pesquisa e
   * Favoritos em telemóvel). `items` já vêm ordenados, sem os ocultos.
   */
  bottomNav: { visible: boolean; items: BottomNavItemConfig[] } | null;
  /** Logótipo do cabeçalho (null = mostra só o nome da loja). */
  logo: { url: string; height: number; showName: boolean } | null;
  /** Banner: imagem de fundo (null = fundo em cores + ilustração) e alinhamento. */
  hero: { image: { url: string; x: number; y: number; overlay: number } | null; center: boolean };
  /** Destino dos botões, só quando o lojista o mudou (ausente = destino original). */
  links: Partial<Record<"heroButton" | "viewAll", LumeLink>>;
  /** Ordem da página inicial: ids das seções de base ("hero"…) e das adicionadas (chaves de `extras`). */
  homeOrder: string[];
  /** Seções adicionadas pelo lojista, já resolvidas e validadas. */
  extras: Record<string, LumeExtraSection>;
  /** Presente só se o lojista mexeu na origem/quantidade/ordem dos produtos. */
  productsQuery: { mode: "all" | "manual"; picked: string[]; count: number; sort: "recent" | "priceAsc" | "priceDesc" } | null;
}

export type HomeSectionId = "hero" | "products" | "whatsappCta";

/** Destino de um botão, já validado. `page` = id de página do tema (ver THEME_PAGE_ROUTE). */
export interface LumeLink {
  kind: "page" | "category" | "url" | "whatsapp";
  value: string;
  message?: string;
}

export interface LumeExtraButton {
  show: boolean;
  label: string;
  link: LumeLink | null;
  variant: "solid" | "outline" | "text";
  bg: string;
  fg: string;
  radius: number;
  size: "sm" | "md" | "lg";
}

export interface LumeExtraSection {
  id: string;
  type: "categories" | "imageText" | "richText";
  /** Cores do fundo escolhido (claro/suave/escuro), já em hex. */
  bg: string;
  fg: string;
  title: { show: boolean; text: string; sizeD: number; sizeM: number };
  text?: { show: boolean; text: string };
  button?: LumeExtraButton;
  image?: { url: string | null; ratio: string };
  side?: "left" | "right";
  align?: "left" | "center";
  columns?: { d: number; m: number };
  shape?: "square" | "round";
  showCount?: boolean;
}
const DEFAULT_HOME_ORDER: HomeSectionId[] = ["hero", "products", "whatsappCta"];

/* ------------------------------ validação ------------------------------ */

const MAX_JSON_BYTES = 64 * 1024;
const HEX = /^#(?:[0-9a-f]{3}|[0-9a-f]{4}|[0-9a-f]{6}|[0-9a-f]{8})$/i;

export function isValidLumeCustomization(raw: unknown): raw is Customization {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return false;
  const c = raw as Record<string, unknown>;
  if (c.themeId !== "lume" || c.schemaVersion !== 1) return false;
  for (const k of ["global", "structure", "sections"]) {
    if (!c[k] || typeof c[k] !== "object" || Array.isArray(c[k])) return false;
  }
  try {
    return JSON.stringify(raw).length <= MAX_JSON_BYTES;
  } catch {
    return false;
  }
}

const num = (v: unknown, min: number, max: number): number | null => {
  const n = typeof v === "number" ? v : Number.NaN;
  return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : null;
};
const hex = (v: unknown): string | null => (typeof v === "string" && HEX.test(v) ? v : null);
const str = (v: unknown, max = 200): string | null => (typeof v === "string" ? v.slice(0, max) : null);
const bool = (v: unknown): boolean => v === true;

/**
 * Caminho de uma imagem enviada no editor: `<id-da-loja>/<logo|banner|image>-<uuid>.<ext>`.
 * Só caminhos com esta forma exata viram URL (nada vindo do JSON é concatenado "às cegas").
 */
const MEDIA_PATH = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\/(logo|banner|image)-[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(jpg|png|webp)$/i;
function mediaUrl(ref: unknown): string | null {
  const id = ref && typeof ref === "object" ? (ref as { mediaId?: unknown }).mediaId : null;
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (typeof id !== "string" || !MEDIA_PATH.test(id) || !base) return null;
  return `${base.replace(/\/$/, "")}/storage/v1/object/public/${BUCKETS.lojas}/${id}`;
}

/** Destino de um botão (LinkRef do editor) → destino seguro da loja pública. */
function resolveLink(ref: unknown): LumeLink | null {
  if (!ref || typeof ref !== "object") return null;
  const r = ref as { type?: unknown; value?: unknown; message?: unknown };
  const v = typeof r.value === "string" ? r.value : "";
  switch (r.type) {
    case "home":
      return { kind: "page", value: "home" };
    case "products":
      return { kind: "page", value: "collection" };
    case "themePage":
      return v in THEME_PAGE_ROUTE && v !== "cart" ? { kind: "page", value: v } : null;
    case "category":
      return v ? { kind: "category", value: v.slice(0, 80) } : null;
    case "url":
      return /^https?:\/\//i.test(v) && v.length <= 300 ? { kind: "url", value: v } : null;
    case "whatsapp":
      return { kind: "whatsapp", value: "", message: str(r.message, 300)?.trim() || undefined };
    default:
      return null;
  }
}

/* ------------------------------ resolução ------------------------------ */

type Bag = Record<string, any>;
type Resolved = { d: Bag; m: Bag };

function emptyCustomization(): Customization {
  return { schemaVersion: 1, themeId: "lume", themeVersion: M.version, global: {}, structure: { pages: {} }, sections: {} };
}

/** Valores finais (defaults + overrides) de um nó, para desktop e para telemóvel. */
function read(custom: Customization, path: string): Resolved {
  const defs = settingsForPath(M, custom, path);
  const d: Bag = {};
  const m: Bag = {};
  for (const def of defs) {
    d[def.key] = resolveValue(M, custom, path, def, "desktop" as Device);
    m[def.key] = resolveValue(M, custom, path, def, "mobile" as Device);
  }
  return { d, m };
}

function readColors(custom: Customization): Record<string, string> {
  const raw = read(custom, "global.colors").d;
  const out: Record<string, string> = {};
  for (const k of Object.keys(raw)) out[k] = resolveColor(raw[k], raw);
  return out;
}

interface Snapshot {
  colors: Record<string, string>;
  typo: Bag;
  style: Bag;
  layout: Resolved;
  announcement: { s: Resolved; message: Resolved };
  header: { s: Resolved; name: Resolved; logo: Resolved; search: Resolved; wishlist: Resolved; account: Resolved };
  hero: { s: Resolved; title: Resolved; subtitle: Resolved; button: Resolved };
  products: { s: Resolved; title: Resolved; viewAll: Resolved; card: Resolved };
  whats: { s: Resolved; title: Resolved; text: Resolved; button: Resolved; cardStyle: unknown };
  footer: { s: Resolved; heading: Resolved; policy: Resolved; social: Resolved; copyright: Resolved; credit: Resolved };
  scheme: { background: string; text: string };
  bottomNav: Resolved;
  sideMenu: Resolved;
  search: { title: Resolved; placeholder: Resolved };
  cart: { title: Resolved; description: Resolved; checkout: Resolved };
  product: { buyNow: Resolved; addToCart: Resolved; recs: Resolved };
  contactSubmit: Resolved;
  catalog: Resolved;
  wishlistGrid: Resolved;
  headings: Record<string, { eyebrow: Resolved; title: Resolved; description: Resolved }>;
}

function snapshot(custom: Customization): Snapshot {
  const colors = readColors(custom);
  const sec = (id: string) => read(custom, sectionPath(id));
  const el = (id: string, e: string) => read(custom, elementPath(id, e));
  const announcement = sec("announcement");
  const schemeId = announcement.d.colorScheme ?? "dark";
  const schemeDef = M.colorSchemes.find((s) => s.id === schemeId);
  const scheme = schemeId === "light" || !schemeDef
    ? { background: colors.background, text: colors.text }
    : { background: String(schemeDef.colors.background), text: String(schemeDef.colors.text) };
  return {
    colors,
    typo: read(custom, "global.typography").d,
    style: read(custom, "global.style").d,
    layout: read(custom, "global.layout"),
    announcement: { s: announcement, message: el("announcement", "message") },
    header: { s: sec("header"), name: el("header", "name"), logo: el("header", "logo"), search: el("header", "search"), wishlist: el("header", "wishlist"), account: el("header", "account") },
    hero: { s: sec("hero"), title: el("hero", "title"), subtitle: el("hero", "subtitle"), button: el("hero", "button") },
    products: { s: sec("products"), title: el("products", "title"), viewAll: el("products", "viewAll"), card: el("products", "productCard") },
    whats: { s: sec("whatsappCta"), title: el("whatsappCta", "title"), text: el("whatsappCta", "text"), button: el("whatsappCta", "button"), cardStyle: sec("whatsappCta").d.cardStyle },
    footer: {
      s: sec("footer"),
      heading: el("footer", "heading"),
      policy: el("footer", "policyLinks"),
      social: el("footer", "socialLinks"),
      copyright: el("footer", "copyright"),
      credit: el("footer", "credit"),
    },
    scheme,
    bottomNav: sec("bottomNav"),
    sideMenu: sec("sideMenu"),
    search: { title: el("searchOverlay", "title"), placeholder: el("searchOverlay", "placeholder") },
    cart: { title: el("cartDrawer", "title"), description: el("cartDrawer", "description"), checkout: el("cartDrawer", "checkout") },
    product: { buyNow: el("productInfo", "buyNow"), addToCart: el("productInfo", "addToCart"), recs: el("recommendations", "title") },
    contactSubmit: el("contactForm", "submit"),
    catalog: sec("collectionProducts"),
    wishlistGrid: sec("wishlistProducts"),
    headings: Object.fromEntries(
      Object.values(HEADING_SECTION).map((sid) => [sid, { eyebrow: el(sid, "eyebrow"), title: el(sid, "title"), description: el(sid, "description") }]),
    ),
  } as Snapshot;
}

const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);

/* ------------------------------ construção ------------------------------ */

const SM = "@media (min-width: 640px)"; // breakpoint `sm:` do Tailwind, usado pelo Lume como "desktop"
const XS = "@media (max-width: 639.98px)";

export function buildLumePersonalizacao(raw: unknown): LumePersonalizacao | null {
  if (!isValidLumeCustomization(raw)) return null;
  const custom = raw as Customization;
  const cur = snapshot(custom);
  const def = snapshot(emptyCustomization());

  const vars: Record<string, string> = {};
  const rules: string[] = [];
  const W = ".theme-lume";
  const rule = (selector: string, decls: string[]) => {
    if (decls.length) rules.push(`${W} ${selector}{${decls.join(";")}}`);
  };
  const setVars = (names: string[], value: string | null) => {
    if (value) for (const n of names) vars[n] = value;
  };

  /* ---- cores ---- */
  const c = cur.colors;
  const d = def.colors;
  // Mesmo mapa que o editor usa (ver color-vars.ts) — só se emite o que difere do tema original.
  const colorMap = LUME_COLOR_VARS;
  for (const [key, names] of Object.entries(colorMap)) {
    if (c[key] !== d[key]) setVars(names, hex(c[key]));
  }
  const from = hex(c.heroFrom);
  const to = hex(c.heroTo);
  if ((c.heroFrom !== d.heroFrom || c.heroTo !== d.heroTo) && from && to) {
    vars["--hero-gradient"] = `linear-gradient(120deg, ${from}, ${to})`;
  }
  // Fundo da foto do produto (segue a cor global "gallery" por omissão).
  const imgBg = resolveColor(cur.products.card.d.imageBg, c);
  const imgBgDef = resolveColor(def.products.card.d.imageBg, d);
  if (imgBg !== imgBgDef) setVars(["--product-gallery"], hex(imgBg));
  // Barra de anúncio.
  if (cur.scheme.background !== def.scheme.background) setVars(["--topbar"], hex(cur.scheme.background));
  if (cur.scheme.text !== def.scheme.text) setVars(["--topbar-foreground"], hex(cur.scheme.text));

  /* ---- estilo ---- */
  const radius = num(cur.style.radius, 0, 40);
  if (radius !== null && cur.style.radius !== def.style.radius) vars["--radius"] = `${radius}px`;
  const imgRadius = num(cur.style.imageRadius, 0, 40);
  const frame = ".product-frame,.theme-lume .product-gallery-slide";
  if (imgRadius !== null && cur.style.imageRadius !== def.style.imageRadius) rule(frame, [`border-radius:${imgRadius}px`]);
  const bw = num(cur.style.borderWidth, 0, 6);
  if (bw !== null && cur.style.borderWidth !== def.style.borderWidth) rule(frame, [`border-width:${bw}px`]);
  if (cur.products.card.d.imageBorder === false) rule(frame, ["border-width:0"]);
  const shadows: Record<string, string> = { sm: "0 1px 3px rgba(0,0,0,.08)", md: "0 6px 18px rgba(0,0,0,.10)", lg: "0 16px 40px rgba(0,0,0,.16)", none: "none" };
  if (cur.style.shadowStrength !== def.style.shadowStrength && shadows[cur.style.shadowStrength]) rule(frame, [`box-shadow:${shadows[cur.style.shadowStrength]}`]);
  if (cur.style.imageHover === "none") rule(".product-frame img", ["transition:none", "transform:none!important", "translate:none!important", "scale:none!important"]);

  /* ---- tipografia ---- */
  const fontFamilies = new Map(M.fonts.map((f) => [f.id, f]));
  const googleFamilies: string[] = [];
  const addFont = (id: string) => {
    const f = fontFamilies.get(id);
    if (f && f.id !== "manrope") googleFamilies.push(`family=${f.label.replace(/ /g, "+")}:wght@${f.weights.join(";")}`);
  };
  const body = fontFamilies.get(cur.typo.bodyFont);
  const head = fontFamilies.get(cur.typo.headingFont);
  if (cur.typo.bodyFont !== def.typo.bodyFont && body) {
    vars["--font-sans"] = body.family;
    rule("", [`font-family:${body.family}`]);
    addFont(body.id);
  }
  if (cur.typo.headingFont !== def.typo.headingFont && head) {
    rule("h1,.theme-lume h2,.theme-lume h3,.theme-lume h4", [`font-family:${head.family}`]);
    addFont(head.id);
  }
  const bodyWeight = num(cur.typo.bodyWeight, 300, 900);
  if (bodyWeight !== null && cur.typo.bodyWeight !== def.typo.bodyWeight) rule("", [`font-weight:${bodyWeight}`]);
  if (cur.typo.headingTransform !== def.typo.headingTransform && ["none", "uppercase", "capitalize"].includes(cur.typo.headingTransform))
    rule("h1,.theme-lume h2,.theme-lume h3", [`text-transform:${cur.typo.headingTransform}`]);
  const fontsHref = googleFamilies.length ? `https://fonts.googleapis.com/css2?${[...new Set(googleFamilies)].join("&")}&display=swap` : null;

  /* ---- layout ---- */
  const cw = num(cur.layout.d.contentWidth, 0, 2400);
  if (cw !== null && cur.layout.d.contentWidth !== def.layout.d.contentWidth) rule(".max-w-6xl", [`max-width:${cw === 0 ? "none" : `${cw}px`}`]);
  const responsiveRule = (selector: string, prop: (v: number) => string[], curR: Resolved, defR: Resolved, key: string, min: number, max: number) => {
    const m = num(curR.m[key], min, max);
    const dk = num(curR.d[key], min, max);
    // Telemóvel só até ao breakpoint e "desktop" só a partir dele — sem isto, uma regra de
    // telemóvel vazaria para o desktop (a regra do tema original tem menos especificidade).
    if (m !== null && !same(curR.m[key], defR.m[key])) rules.push(`${XS}{${W} ${selector}{${prop(m).join(";")}}}`);
    if (dk !== null && !same(curR.d[key], defR.d[key])) rules.push(`${SM}{${W} ${selector}{${prop(dk).join(";")}}}`);
  };
  responsiveRule("[data-sy=product-grid],.theme-lume [data-sy=catalog-grid],.theme-lume [data-sy=wishlist-grid]", (v) => [`column-gap:${v}px`, `row-gap:${Math.round(v * 1.6)}px`], cur.layout, def.layout, "gridGap", 0, 80);

  /* ---- texto (cor/tamanho/peso) de elementos ---- */
  const textRules = (selector: string, curR: Resolved, defR: Resolved) => {
    const color = resolveColor(curR.d.color, c);
    if (curR.d.color !== undefined && color !== resolveColor(defR.d.color, d) && hex(color)) rule(selector, [`color:${color}`]);
    const w = num(curR.d.weight, 100, 900);
    if (w !== null && curR.d.weight !== defR.d.weight) rule(selector, [`font-weight:${w}`]);
    if (curR.d.transform && curR.d.transform !== defR.d.transform && ["none", "uppercase", "capitalize"].includes(curR.d.transform))
      rule(selector, [`text-transform:${curR.d.transform}`]);
    if (curR.d.size !== undefined) responsiveRule(selector, (v) => [`font-size:${v}px`], curR, defR, "size", 8, 96);
  };
  /* ---- botões (banner, "Explorar mais", WhatsApp): cor, estilo, cantos, tamanho ---- */
  const SIZES = { sm: "height:34px;padding:0 16px;font-size:13px", md: "height:40px;padding:0 20px;font-size:14px", lg: "height:48px;padding:0 28px;font-size:15px" } as const;
  const buttonRules = (selector: string, curR: Resolved, defR: Resolved) => {
    const a = curR.d;
    const b = defR.d;
    if (a.show === false) {
      rule(selector, ["display:none!important"]);
      return;
    }
    const bgNow = resolveColor(a.bg, c);
    const fgNow = resolveColor(a.textColor, c);
    const variant = ["solid", "outline", "text"].includes(a.variant) ? (a.variant as string) : (b.variant as string);
    const colorsChanged = bgNow !== resolveColor(b.bg, d) || fgNow !== resolveColor(b.textColor, d);
    if (variant !== b.variant || colorsChanged) {
      const bg = hex(bgNow);
      const fg = hex(fgNow);
      const decls: string[] = [];
      if (variant === "solid") {
        if (bg) decls.push(`background:${bg}!important`);
      } else if (variant === "outline") {
        decls.push("background:transparent!important");
        if (bg) decls.push(`border-color:${bg}`);
      } else {
        decls.push("background:transparent!important", "border-color:transparent", "box-shadow:none", "text-decoration:underline", "height:auto", "padding:6px 0");
      }
      if (fg) decls.push(`color:${fg}`);
      rule(selector, decls);
    }
    const r = num(a.radius, 0, 999);
    if (r !== null && a.radius !== b.radius) rule(selector, [`border-radius:${r}px`]);
    if (variant !== "text" && a.size !== b.size && a.size in SIZES) rule(selector, [SIZES[a.size as keyof typeof SIZES]]);
  };
  buttonRules("[data-sy=hero-button]", cur.hero.button, def.hero.button);
  buttonRules("[data-sy=viewall-button]", cur.products.viewAll, def.products.viewAll);
  buttonRules("[data-sy=whats-button]", cur.whats.button, def.whats.button);

  /* ---- banner com imagem: cor do texto por cima da imagem (as cores do lojista, se mudou, vêm depois e ganham) ---- */
  const heroImageUrl = mediaUrl(cur.hero.s.d.image);
  if (heroImageUrl && cur.hero.s.d.textTone !== "dark") {
    rule("[data-sy=hero-title]", ["color:#fff"]);
    rule("[data-sy=hero-subtitle]", ["color:rgba(255,255,255,.85)"]);
  }
  if (cur.hero.s.d.align === "center") {
    rule("[data-sy=hero]>div", ["display:flex!important", "justify-content:center"]);
    rule("[data-sy=hero-content]", ["text-align:center", "margin:0 auto", "max-width:36rem"]);
  }

  textRules("[data-sy=announcement]", cur.announcement.message, def.announcement.message);
  textRules("[data-sy=store-name]", cur.header.name, def.header.name);
  textRules("[data-sy=hero-title]", cur.hero.title, def.hero.title);
  textRules("[data-sy=hero-subtitle]", cur.hero.subtitle, def.hero.subtitle);
  textRules("[data-sy=products-title]", cur.products.title, def.products.title);
  textRules("[data-sy=whats-title]", cur.whats.title, def.whats.title);
  textRules("[data-sy=whats-text]", cur.whats.text, def.whats.text);

  /* ---- estrutura: anúncio, cabeçalho, banner ---- */
  const ah = num(cur.announcement.s.d.height, 24, 64);
  if (ah !== null && cur.announcement.s.d.height !== def.announcement.s.d.height)
    rule("[data-sy=announcement]", [`min-height:${ah}px`, "display:flex", "align-items:center", "justify-content:center", "padding-top:0", "padding-bottom:0"]);
  if (cur.header.s.d.sticky === false) rule("[data-sy=header]", ["position:relative"]);
  if (cur.header.s.d.borderBottom === true) rule("[data-sy=header]", ["border-bottom:1px solid var(--border)"]);
  const hh = num(cur.header.s.d.height, 48, 96);
  if (hh !== null && cur.header.s.d.height !== def.header.s.d.height) rule("[data-sy=header]>div", [`height:${hh}px`]);
  if (cur.header.search.d.show === false) rule("[data-sy=header-search]", ["display:none!important"]);
  if (cur.header.wishlist.d.show === false) rule("[data-sy=header-wishlist]", ["display:none!important"]);
  if (cur.header.account.d.show === false) rule("[data-sy=header-account]", ["display:none!important"]);
  /* ---- barra inferior ---- */
  // Itens (ordem, nomes, ocultos) e "remover a barra" não são CSS: a loja decide o
  // que desenha (ver `bottomNav` abaixo). Aqui só as cores e o espaço que sobra.
  const navTone = isBottomNavTone(cur.bottomNav.d.tone) ? cur.bottomNav.d.tone : "dark";
  const navVars = bottomNavVars(navTone);
  rule("[data-sy=bottom-nav]", Object.entries(navVars).map(([k, v]) => `${k}:${v}`));
  const navRemoved = custom.sections.bottomNav?.hidden === true;
  // Sem barra, o rodapé deixa de precisar do espaço reservado para ela (só telemóvel).
  if (navRemoved) rules.push(`${XS}{${W} [data-sy=footer]{padding-bottom:2.5rem}}`);
  /* ---- grelhas de coleção e favoritos ---- */
  responsiveRule("[data-sy=catalog-grid]", (v) => [`grid-template-columns:repeat(${Math.round(v)},minmax(0,1fr))`], cur.catalog, def.catalog, "columns", 1, 6);
  responsiveRule("[data-sy=wishlist-grid]", (v) => [`grid-template-columns:repeat(${Math.round(v)},minmax(0,1fr))`], cur.wishlistGrid, def.wishlistGrid, "columns", 1, 6);
  responsiveRule("[data-sy=hero]>div", (v) => [`min-height:${v}px`], cur.hero.s, def.hero.s, "height", 100, 1000);
  if (cur.hero.s.d.showIllustration === false) rule("[data-sy=hero-illustration]", ["display:none"]);

  /* ---- produtos ---- */
  const card = cur.products.card.d;
  const cardDef = def.products.card.d;
  responsiveRule("[data-sy=product-grid]", (v) => [`grid-template-columns:repeat(${Math.round(v)},minmax(0,1fr))`], cur.products.s, def.products.s, "columns", 1, 6);
  if (card.showName === false) rule("[data-sy=product-name]", ["display:none"]);
  if (card.showPrice === false) rule("[data-sy=product-price]", ["display:none"]);
  if (card.showBadge === false) rule("[data-sy=product-badge]", ["display:none"]);
  if (card.showWishlist === false) rule("[data-sy=product-fav]", ["display:none"]);
  if (card.aspectRatio !== cardDef.aspectRatio && ["1/1", "4/5", "3/4"].includes(card.aspectRatio)) rule("[data-sy=product-grid] .product-frame", [`aspect-ratio:${card.aspectRatio}`]);
  if (card.align !== cardDef.align && ["left", "center", "right"].includes(card.align)) rule("[data-sy=product-info]", [`text-align:${card.align}`]);
  const ns = num(card.nameSize, 8, 40);
  if (ns !== null && card.nameSize !== cardDef.nameSize) rule("[data-sy=product-name]", [`font-size:${ns}px`]);
  const ps = num(card.priceSize, 8, 48);
  if (ps !== null && card.priceSize !== cardDef.priceSize) rule("[data-sy=product-price]", [`font-size:${ps}px`]);

  /* ---- WhatsApp e rodapé ---- */
  if (cur.whats.cardStyle === "border") rule("[data-sy=whats-card]", ["background:transparent"]);
  if (cur.footer.s.d.borderTop === false) rule("[data-sy=footer-inner]", ["border-top:0"]);
  if (cur.footer.policy.d.shipping === false) rule("[data-sy=link-envios]", ["display:none"]);
  if (cur.footer.policy.d.returns === false) rule("[data-sy=link-trocas]", ["display:none"]);
  if (cur.footer.policy.d.terms === false) rule("[data-sy=link-termos]", ["display:none"]);
  for (const net of ["instagram", "facebook", "tiktok"] as const) {
    if (cur.footer.social.d[net] === false) rule(`[data-sy=social-${net}]`, ["display:none"]);
  }

  /* ---- textos ---- */
  const text: LumePersonalizacao["text"] = {};
  const changed = (a: Resolved, b: Resolved, key: string, max = 200): string | undefined => {
    if (same(a.d[key], b.d[key])) return undefined;
    return str(a.d[key], max) ?? undefined;
  };
  text.announcement = changed(cur.announcement.message, def.announcement.message, "text", 120);
  text.heroTitle = changed(cur.hero.title, def.hero.title, "text", 120);
  text.heroSubtitle = changed(cur.hero.subtitle, def.hero.subtitle, "text", 240);
  text.heroButton = changed(cur.hero.button, def.hero.button, "label", 60);
  text.productsTitle = changed(cur.products.title, def.products.title, "text", 120);
  text.viewAll = changed(cur.products.viewAll, def.products.viewAll, "label", 60);
  text.whatsTitle = changed(cur.whats.title, def.whats.title, "text", 160);
  text.whatsText = changed(cur.whats.text, def.whats.text, "text", 240);
  text.whatsButton = changed(cur.whats.button, def.whats.button, "label", 60);
  const wm = str(cur.whats.button.d.message, 200)?.trim();
  if (wm) text.whatsMessage = wm;
  text.footerHeading = changed(cur.footer.heading, def.footer.heading, "text", 60);
  text.copyright = changed(cur.footer.copyright, def.footer.copyright, "text", 160);
  for (const k of Object.keys(text) as (keyof typeof text)[]) if (text[k] === undefined) delete text[k];

  /* ---- páginas internas ---- */
  const pages: LumePersonalizacao["pages"] = {};
  for (const [key, sid] of Object.entries(HEADING_SECTION) as [LumePageKey, string][]) {
    const h = cur.headings[sid];
    const out: Partial<{ eyebrow: string; title: string; description: string }> = {};
    for (const f of ["eyebrow", "title", "description"] as const) {
      const t = str(h[f].d.text, 160)?.trim();
      if (t) out[f] = t;
    }
    if (Object.keys(out).length) pages[key] = out;
  }
  void PAGE_TEXT;

  /* ---- painéis e botões ---- */
  const ui: LumePersonalizacao["ui"] = {};
  const uiText = (r: Resolved, key: string, original: string, max: number): string | undefined => {
    const t = str(r.d[key], max)?.trim();
    return t && t !== original ? t : undefined;
  };
  ui.searchTitle = uiText(cur.search.title, "text", UI_TEXT.searchTitle, 60);
  ui.searchPlaceholder = uiText(cur.search.placeholder, "text", UI_TEXT.searchPlaceholder, 60);
  ui.cartTitle = uiText(cur.cart.title, "text", UI_TEXT.cartTitle, 60);
  ui.cartDescription = uiText(cur.cart.description, "text", UI_TEXT.cartDescription, 120);
  ui.cartCheckout = uiText(cur.cart.checkout, "label", UI_TEXT.cartCheckout, 40);
  ui.addToCart = uiText(cur.product.addToCart, "label", UI_TEXT.addToCart, 40);
  ui.buyNow = uiText(cur.product.buyNow, "label", UI_TEXT.buyNow, 40);
  ui.recommendations = uiText(cur.product.recs, "text", UI_TEXT.recommendations, 60);
  ui.contactSubmit = uiText(cur.contactSubmit, "label", UI_TEXT.contactSubmit, 40);
  for (const k of Object.keys(ui) as (keyof typeof ui)[]) if (ui[k] === undefined) delete ui[k];

  /* ---- menu lateral ---- */
  const rawItems = cur.sideMenu.d.items;
  let menuItems: LumePersonalizacao["menuItems"] = null;
  if (Array.isArray(rawItems) && !same(rawItems, DEFAULT_MENU_ITEMS)) {
    const list: NonNullable<LumePersonalizacao["menuItems"]> = [];
    for (const it of rawItems.slice(0, 8)) {
      if (!it || typeof it !== "object" || it.hidden) continue;
      const label = str(it.label, 24)?.trim();
      const link = it.link as { type?: string; value?: unknown } | undefined;
      if (!label || !link || typeof link.value !== "string") continue;
      if (link.type === "themePage") list.push({ label, kind: "page", value: link.value });
      else if (link.type === "category") list.push({ label, kind: "category", value: link.value.slice(0, 80) });
      else if (link.type === "url" && /^(https?:\/\/|\/)/i.test(link.value) && !link.value.startsWith("//")) list.push({ label, kind: "url", value: link.value.slice(0, 300) });
    }
    menuItems = list.length ? list : null;
  }

  /* ---- seções da página inicial (de base + adicionadas pelo lojista) ---- */
  const ids = visibleSectionIds(M, custom, "home");
  const hidden = (id: string) => bool((custom.sections as Record<string, { hidden?: boolean }>)[id]?.hidden);
  const EXTRA_TYPES = ["categories", "imageText", "richText"] as const;
  type ExtraType = (typeof EXTRA_TYPES)[number];
  const extraType = (id: string): ExtraType | null => {
    const t = sectionTypeOf(M, custom, id)?.type;
    return EXTRA_TYPES.includes(t as ExtraType) ? (t as ExtraType) : null;
  };
  const toneColors = (tone: unknown): { bg: string; fg: string } => {
    const sd = M.colorSchemes.find((x) => x.id === tone);
    const bg = hex(tone === "light" || !sd ? c.background : sd.colors.background) ?? "#FFFFFF";
    const fg = hex(tone === "light" || !sd ? c.text : sd.colors.text) ?? "#202020";
    return { bg, fg };
  };
  const extras: Record<string, LumeExtraSection> = {};
  const order: string[] = [];
  for (const id of ids.page) {
    if (hidden(id)) continue;
    if (id === "hero" || id === "products" || id === "whatsappCta") {
      order.push(id);
      continue;
    }
    const type = extraType(id);
    if (!type) continue;
    const sv = read(custom, sectionPath(id));
    const title = read(custom, elementPath(id, "title"));
    const tone = toneColors(sv.d.tone);
    const ex: LumeExtraSection = {
      id,
      type,
      ...tone,
      title: { show: title.d.show !== false, text: str(title.d.text, 80) ?? "", sizeD: num(title.d.size, 12, 72) ?? 24, sizeM: num(title.m.size, 12, 72) ?? 20 },
    };
    if (type !== "categories") {
      const t = read(custom, elementPath(id, "text"));
      ex.text = { show: t.d.show !== false, text: str(t.d.text, 600) ?? "" };
      const b = read(custom, elementPath(id, "button")).d;
      const variant = ["solid", "outline", "text"].includes(b.variant) ? b.variant : "solid";
      ex.button = {
        show: b.show === true,
        label: str(b.label, 32)?.trim() || "Saber mais",
        link: resolveLink(b.link) ?? { kind: "page", value: "collection" },
        variant,
        bg: hex(resolveColor(b.bg, c)) ?? "#202020",
        fg: hex(resolveColor(b.textColor, c)) ?? "#FFFFFF",
        radius: num(b.radius, 0, 999) ?? 999,
        size: ["sm", "md", "lg"].includes(b.size) ? b.size : "md",
      };
    }
    if (type === "imageText") {
      const im = read(custom, elementPath(id, "image")).d;
      ex.image = { url: mediaUrl(im.image), ratio: ["1/1", "4/5", "16/9"].includes(im.ratio) ? im.ratio : "4/5" };
      ex.side = sv.d.side === "right" ? "right" : "left";
    }
    if (type === "richText") ex.align = sv.d.align === "left" ? "left" : "center";
    if (type === "categories") {
      ex.columns = { d: num(sv.d.columns, 2, 6) ?? 4, m: num(sv.m.columns, 1, 4) ?? 2 };
      ex.shape = sv.d.shape === "round" ? "round" : "square";
      ex.showCount = sv.d.showCount !== false;
    }
    extras[id] = ex;
    order.push(id);
  }
  const homeOrder = same(order, DEFAULT_HOME_ORDER) ? DEFAULT_HOME_ORDER : order;
  const announcementVisible = ids.top.includes("announcement") && !hidden("announcement");

  // Barra inferior: lista só quando difere da original (loja sem mexer = null).
  const navRaw = (custom.sections.bottomNav?.settings ?? {}) as Bag;
  const navItems = resolveBottomNavItems(navRaw.items, navRaw);
  const navDefault = BOTTOM_NAV_DEFAULTS.map(({ key, label }) => ({ key, label }));
  const navVisible = custom.sections.bottomNav?.hidden !== true;
  const bottomNav = !navVisible || !same(navItems, navDefault) ? { visible: navVisible, items: navItems } : null;

  /* ---- logótipo, banner e destinos ---- */
  const logoUrl = mediaUrl(cur.header.logo.d.image);
  const logo = logoUrl ? { url: logoUrl, height: num(cur.header.logo.d.height, 16, 56) ?? 32, showName: bool(cur.header.logo.d.showName) } : null;
  const heroImage = heroImageUrl
    ? {
        url: heroImageUrl,
        x: num(cur.hero.s.d.focalPoint?.x, 0, 100) ?? 50,
        y: num(cur.hero.s.d.focalPoint?.y, 0, 100) ?? 50,
        overlay: num(cur.hero.s.d.overlay, 0, 80) ?? 0,
      }
    : null;
  const links: LumePersonalizacao["links"] = {};
  if (!same(cur.hero.button.d.link, def.hero.button.d.link)) {
    const l = resolveLink(cur.hero.button.d.link);
    if (l) links.heroButton = l;
  }
  if (!same(cur.products.viewAll.d.link, def.products.viewAll.d.link)) {
    const l = resolveLink(cur.products.viewAll.d.link);
    if (l) links.viewAll = l;
  }

  const ps0 = cur.products.s.d;
  const psDef = def.products.s.d;
  const queryChanged = ps0.mode !== psDef.mode || ps0.count !== psDef.count || ps0.sort !== psDef.sort || !same(ps0.picked, psDef.picked);
  const sorts = ["recent", "priceAsc", "priceDesc"];
  const productsQuery = queryChanged
    ? {
        mode: (ps0.mode === "manual" ? "manual" : "all") as "all" | "manual",
        picked: Array.isArray(ps0.picked) ? ps0.picked.filter((x: unknown): x is string => typeof x === "string").slice(0, 48) : [],
        count: num(ps0.count, 2, 24) ?? 6,
        sort: (sorts.includes(ps0.sort) ? ps0.sort : "recent") as "recent" | "priceAsc" | "priceDesc",
      }
    : null;

  return {
    vars,
    css: rules.join("\n"),
    fontsHref,
    text,
    pages,
    ui,
    showRecommendations: cur.product.recs.d.show !== false,
    menuItems,
    showHeroSubtitle: bool(cur.hero.subtitle.d.show),
    showCredit: cur.footer.credit.d.show !== false,
    announcementVisible,
    bottomNav,
    logo,
    hero: { image: heroImage, center: cur.hero.s.d.align === "center" },
    links,
    homeOrder,
    extras,
    productsQuery,
  };
}

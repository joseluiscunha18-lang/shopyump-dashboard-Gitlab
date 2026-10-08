import { createContext, Fragment, useContext, type CSSProperties, type ReactNode } from "react";
import * as Icons from "lucide-react";
import {
  Editable,
  FixedShell,
  OverlayShell,
  SectionShell,
  useColors,
  useEditorPreview,
  useGlobalGroup,
  useMediaUrl,
  useNodeValues,
  useTheme,
} from "@/theme-editor/editor/sdk";
import { HEADING_SECTION, LUME_CATEGORIES, PAGE_TEXT, THEME_PAGE_ROUTE, UI_TEXT, lumeCategoryOf, type LumePageKey } from "./page-text";
import { resolveColor, sectionTypeOf, visibleSectionIds } from "@/theme-editor/editor/core/resolve";
import { elementPath, sectionPath } from "@/theme-editor/editor/core/paths";
import type { PageKind, ProductLite } from "@/theme-editor/editor/contracts/types";
import { getVisiblePolicyLinks, headerActionsFor, resolveHeaderMode } from "@/lib/store/shared/storefront-logic";

/**
 * Renderer do tema LUME para o editor e para o preview do "Personalizar loja".
 *
 * Desenha o mesmo visual do tema público (lib/store/themes/lume), mas lê TUDO
 * da customização (cores, tipografia, textos, secções) através do SDK do editor.
 *
 * IMPORTANTE: nada aqui usa as classes semânticas do Tailwind (bg-background,
 * text-foreground…). Dentro de `.ed-root` essas variáveis têm os valores do
 * editor, não os do Lume — por isso as cores vêm sempre dos tokens resolvidos.
 */

/* ------------------------------ page kind ------------------------------ */

/**
 * O `PageKind` da página que está a ser desenhada neste momento — o MESMO
 * vocabulário que `PageDef.kind` já usa no manifesto. `LumeRenderer`
 * define-o uma vez (a partir do `pageId`); qualquer secção (cabeçalho,
 * rodapé, ...) que precise de saber "em que página estou" lê-o daqui em vez
 * de inventar a sua própria deteção. É o que liga este Renderer às mesmas
 * funções de `lib/store/shared/storefront-logic.ts` que a loja pública usa.
 */
const PageKindCtx = createContext<PageKind>("home");
function usePageKind(): PageKind {
  return useContext(PageKindCtx);
}

/* ------------------------------ helpers ------------------------------ */

function LucideIcon({ name, ...rest }: { name: string } & Record<string, unknown>) {
  const key = name
    .split("-")
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
    .join("");
  const Cmp = (Icons as unknown as Record<string, React.ComponentType<any>>)[key] ?? Icons.Circle;
  return <Cmp {...rest} />;
}

function useScheme(schemeId: string) {
  const { manifest } = useTheme();
  const colors = useColors();
  const scheme = manifest.colorSchemes.find((s) => s.id === schemeId);
  if (!scheme || schemeId === "light")
    return { background: colors.background, text: colors.text, primary: colors.primary, buttonBg: colors.buttonBg, buttonText: colors.buttonText };
  return scheme.colors;
}

function textStyle(v: Record<string, any>, colors: Record<string, string>, fonts: Record<string, string>): CSSProperties {
  const s: CSSProperties = {
    color: v.color === undefined ? undefined : resolveColor(v.color, colors),
    fontSize: v.size,
    fontWeight: v.weight,
    lineHeight: v.lineHeight,
    letterSpacing: v.letterSpacing ? `${v.letterSpacing}em` : undefined,
    textTransform: v.transform && v.transform !== "none" ? v.transform : undefined,
    textAlign: v.align && v.align !== "inherit" ? v.align : undefined,
    marginBottom: v.marginBottom,
    opacity: typeof v.opacity === "number" ? v.opacity / 100 : undefined,
    fontFamily: v.font && v.font !== "inherit" ? fonts[v.font] : undefined,
  };
  if (v.maxLines) {
    s.display = "-webkit-box";
    (s as any).WebkitLineClamp = v.maxLines;
    (s as any).WebkitBoxOrient = "vertical";
    s.overflow = "hidden";
  }
  return s;
}

/**
 * Botão do Lume. Nunca fica invisível: sem cor definida usa o botão principal do
 * tema (antes, `resolveColor(undefined)` dava "transparent" e o texto sumia).
 * Cheio: fundo = `bg`. Contorno: linha = `bg`, texto = `textColor`. Só texto: sublinhado.
 */
export function buttonStyle(v: Record<string, any>, colors: Record<string, string>): CSSProperties {
  const bg = resolveColor(v.bg ?? "token:buttonBg", colors);
  const fg = resolveColor(v.textColor ?? "token:buttonText", colors);
  const size = v.size === "sm" ? { h: 34, px: 16, fs: 13 } : v.size === "lg" ? { h: 48, px: 28, fs: 15 } : { h: 40, px: 20, fs: 14 };
  const base: CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    height: size.h,
    padding: `0 ${size.px}px`,
    borderRadius: v.radius ?? 999,
    fontWeight: v.weight ?? 600,
    fontSize: size.fs,
    textTransform: v.transform && v.transform !== "none" ? v.transform : undefined,
    width: v.width === "full" ? "100%" : undefined,
    cursor: "default",
    whiteSpace: "nowrap",
    color: fg,
  };
  if (v.variant === "outline") return { ...base, background: "transparent", border: `1px solid ${bg}` };
  if (v.variant === "text") return { ...base, background: "transparent", border: "1px solid transparent", height: "auto", padding: "6px 0", textDecoration: "underline" };
  return { ...base, background: bg, border: `1px solid ${colors.border}` };
}

function shadowOf(preset: unknown): string | undefined {
  switch (preset) {
    case "sm":
      return "0 1px 3px rgba(0,0,0,.08)";
    case "md":
      return "0 6px 18px rgba(0,0,0,.10)";
    case "lg":
      return "0 16px 40px rgba(0,0,0,.16)";
    default:
      return undefined;
  }
}

/** Mesmo formato do tema público: `Intl pt-PT` + moeda. */
function formatPrice(value: number, currency: string): string {
  return `${new Intl.NumberFormat("pt-PT").format(value)} ${currency}`;
}

/* ------------------------------ atoms ------------------------------ */

function TextEl({ path, label, fallbackTag = "p", text, tone }: { path: string; label: string; fallbackTag?: string; text?: string; tone?: { color: string; whenDefault: string } }) {
  const v = useNodeValues(path);
  const colors = useColors();
  const { manifest } = useTheme();
  const fonts = Object.fromEntries(manifest.fonts.map((f) => [f.id, f.family]));
  if (v.show === false) return null;
  const Tag = (v.htmlTag || fallbackTag) as any;
  return (
    <Editable path={path} label={label} as="div">
      <Tag style={{ ...textStyle(v, colors, fonts), ...(tone && v.color === tone.whenDefault ? { color: tone.color } : null) }}>{text ?? v.text}</Tag>
    </Editable>
  );
}

function ButtonEl({ path, label }: { path: string; label: string }) {
  const v = useNodeValues(path);
  const colors = useColors();
  if (v.show === false) return null;
  return (
    <Editable path={path} label={label} as="span" style={{ display: "inline-block" }}>
      <span style={buttonStyle(v, colors)}>
        {v.icon ? <LucideIcon name={v.icon} size={16} /> : null}
        {v.label}
      </span>
    </Editable>
  );
}

/* ------------------------------ frame ------------------------------ */

function useSectionFrame(sectionId: string) {
  const v = useNodeValues(sectionPath(sectionId));
  const layout = useGlobalGroup("layout");
  const scheme = useScheme(v.colorScheme ?? "light");
  const colors = useColors();
  const { device } = useTheme();
  const mobile = device === "mobile";
  // Mesmos espaçamentos da loja pública (px-4/sm:px-6 …), sem controlo do lojista.
  const pad = (mTop: number, mBottom: number, dTop: number, dBottom: number, mSide = 16, dSide = 24): CSSProperties => ({
    paddingTop: mobile ? mTop : dTop,
    paddingBottom: mobile ? mBottom : dBottom,
    paddingLeft: mobile ? mSide : dSide,
    paddingRight: mobile ? mSide : dSide,
  });
  return { v, scheme, colors, layout, pad, mobile };
}

/* ------------------------------ sections ------------------------------ */

function AnnouncementSection({ id }: { id: string }) {
  const { v, scheme } = useSectionFrame(id);
  return (
    <SectionShell
      path={sectionPath(id)}
      label="Barra de anúncio"
      style={{
        background: scheme.background,
        color: scheme.text,
        minHeight: v.height,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "0 16px",
        textAlign: "center",
        fontWeight: 600,
      }}
    >
      <TextEl path={elementPath(id, "message")} label="Mensagem" fallbackTag="span" />
    </SectionShell>
  );
}

function HeaderIcon({ sectionId, el, label, children }: { sectionId: string; el: string; label: string; children: ReactNode }) {
  const v = useNodeValues(elementPath(sectionId, el));
  if (v.show === false) return null;
  return (
    <Editable path={elementPath(sectionId, el)} label={label} as="span" style={{ display: "inline-flex", padding: 8 }}>
      {children}
    </Editable>
  );
}

function HeaderSection({ id }: { id: string }) {
  const { v, layout, colors, mobile } = useSectionFrame(id);
  const { store } = useTheme();
  const name = useNodeValues(elementPath(id, "name"));
  const logo = useNodeValues(elementPath(id, "logo"));
  const logoUrl = useMediaUrl(logo.image);
  const fonts = Object.fromEntries(useTheme().manifest.fonts.map((f) => [f.id, f.family]));
  const sz = 18;
  // Mesma regra que a loja pública usa (store-shell.tsx): o cabeçalho muda
  // consoante a página. Sem isto, o editor mostrava sempre "Conta", mesmo a
  // editar a página de Produto — onde a loja real mostra o Carrinho.
  const actions = headerActionsFor(resolveHeaderMode(usePageKind()));

  return (
    <SectionShell
      path={sectionPath(id)}
      label="Cabeçalho"
      style={{
        position: v.sticky ? "sticky" : "relative",
        top: 0,
        zIndex: 40,
        background: colors.cardBg,
        color: colors.text,
        borderBottom: v.borderBottom ? `1px solid ${colors.border}` : undefined,
      }}
    >
      <div
        style={{
          position: "relative",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          height: v.height,
          maxWidth: layout.contentWidth || undefined,
          margin: "0 auto",
          padding: mobile ? "0 8px" : "0 24px",
        }}
      >
        <HeaderIcon sectionId={id} el="menu" label="Menu lateral">
          <Icons.Menu size={sz + 2} strokeWidth={2.25} />
        </HeaderIcon>
        <div style={{ position: "absolute", left: "50%", transform: "translateX(-50%)", maxWidth: "55%", display: "flex", alignItems: "center", gap: 8 }}>
          {logoUrl ? (
            <Editable path={elementPath(id, "logo")} label="Logótipo" as="span" style={{ display: "inline-flex" }}>
              <img src={logoUrl} alt={store.name} style={{ height: logo.height ?? 32, width: "auto", maxWidth: "100%", display: "block", objectFit: "contain" }} />
            </Editable>
          ) : null}
          {!logoUrl || logo.showName ? (
            <Editable path={elementPath(id, "name")} label="Nome da loja" as="span" style={{ display: "inline-block" }}>
              <span style={{ ...textStyle(name, colors, fonts), whiteSpace: "nowrap", display: "block" }}>{store.name}</span>
            </Editable>
          ) : null}
        </div>
        <span style={{ display: "inline-flex", alignItems: "center" }}>
          {actions.cart ? (
            <HeaderIcon sectionId={id} el="cart" label="Carrinho">
              <Icons.ShoppingCart size={sz} strokeWidth={2.25} />
            </HeaderIcon>
          ) : (
            <>
              {!mobile && actions.search ? (
                <HeaderIcon sectionId={id} el="search" label="Pesquisa">
                  <Icons.Search size={sz} strokeWidth={2.25} />
                </HeaderIcon>
              ) : null}
              {!mobile && actions.wishlist ? (
                <HeaderIcon sectionId={id} el="wishlist" label="Favoritos">
                  <Icons.Heart size={sz} strokeWidth={2.25} />
                </HeaderIcon>
              ) : null}
              {actions.account ? (
                <HeaderIcon sectionId={id} el="account" label="Conta">
                  <Icons.User size={sz} strokeWidth={2.25} />
                </HeaderIcon>
              ) : null}
            </>
          )}
        </span>
      </div>
    </SectionShell>
  );
}

/** Ilustração de linhas do banner (a mesma do tema público). */
function HeroIllustration({ color, mobile }: { color: string; mobile: boolean }) {
  return (
    <svg
      viewBox="0 0 480 360"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      style={{ height: "auto", width: mobile ? 190 : "100%", maxWidth: mobile ? "100%" : 440, color, opacity: mobile ? 0.3 : 0.55 }}
    >
      <circle cx="330" cy="180" r="150" strokeWidth="1.5" />
      <circle cx="86" cy="52" r="30" strokeWidth="1.5" />
      <path d="M293 88c0-11 16-11 16 0 0 7-8 7-8 14v9" />
      <path d="M301 111 226 162h150z" />
      <rect x="238" y="208" width="130" height="112" rx="18" />
      <path d="M270 208v-22a33 33 0 0 1 66 0v22" />
    </svg>
  );
}

function HeroSection({ id }: { id: string }) {
  const { v, layout, colors, mobile } = useSectionFrame(id);
  const imageUrl = useMediaUrl(v.image);
  const center = v.align === "center";
  const light = !!imageUrl && v.textTone !== "dark";
  const fp = v.focalPoint ?? { x: 50, y: 50 };
  const titleTone = light ? { color: "#FFFFFF", whenDefault: "token:text" } : undefined;
  const subTone = light ? { color: "rgba(255,255,255,.85)", whenDefault: "token:secondary" } : undefined;

  return (
    <SectionShell
      path={sectionPath(id)}
      label="Banner principal"
      style={{ position: "relative", overflow: "hidden", background: `linear-gradient(120deg, ${colors.heroFrom}, ${colors.heroTo})` }}
    >
      {imageUrl ? (
        <>
          <img src={imageUrl} alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", objectPosition: `${fp.x}% ${fp.y}%` }} />
          <div style={{ position: "absolute", inset: 0, background: `rgba(0,0,0,${(v.overlay ?? 0) / 100})` }} />
        </>
      ) : null}
      <div
        style={{
          position: "relative",
          display: mobile || center ? "flex" : "grid",
          justifyContent: center ? "center" : undefined,
          gridTemplateColumns: mobile || center ? undefined : "minmax(0,1.05fr) minmax(300px,0.95fr)",
          alignItems: "center",
          gap: 40,
          minHeight: v.height,
          maxWidth: layout.contentWidth || undefined,
          margin: "0 auto",
          padding: mobile ? "56px 20px" : "64px 48px",
        }}
      >
        <div style={{ position: "relative", zIndex: 1, maxWidth: mobile && !center ? "80%" : 576, alignSelf: "center", textAlign: center ? "center" : undefined }}>
          <div style={mobile && !center ? { whiteSpace: "nowrap" } : undefined}>
            <TextEl path={elementPath(id, "title")} label="Título" fallbackTag="h1" tone={titleTone} />
          </div>
          <div style={{ marginTop: 8 }}>
            <TextEl path={elementPath(id, "subtitle")} label="Descrição" tone={subTone} />
          </div>
          <div style={{ marginTop: mobile ? 24 : 32, display: "flex", justifyContent: center ? "center" : undefined }}>
            <ButtonEl path={elementPath(id, "button")} label="Botão" />
          </div>
        </div>
        {v.showIllustration && !imageUrl && !center ? (
          <div
            aria-hidden
            style={
              mobile
                ? { position: "absolute", top: 0, bottom: 0, right: 0, width: "44%", display: "flex", alignItems: "center", justifyContent: "flex-end", pointerEvents: "none" }
                : { display: "flex", alignItems: "center", justifyContent: "flex-end", height: "100%", pointerEvents: "none" }
            }
          >
            <HeroIllustration color={colors.secondary} mobile={mobile} />
          </div>
        ) : null}
      </div>
    </SectionShell>
  );
}

function ProductCard({ product, cardPath, v, colors, imageRadius, borderWidth, shadow, currency, wishlist }: {
  product: ProductLite;
  cardPath: string;
  v: Record<string, any>;
  colors: Record<string, string>;
  imageRadius: number;
  borderWidth: number;
  shadow: unknown;
  currency: string;
  wishlist: boolean;
}) {
  const align = v.align === "center" ? "center" : v.align === "right" ? "right" : "left";
  const photo = product.images[0];
  return (
    <Editable path={cardPath} label="Cartão de produto" openContext={{ productId: product.id }} style={{ minWidth: 0 }}>
      <article style={{ minWidth: 0 }}>
        <div style={{ position: "relative" }}>
          <div
            style={{
              position: "relative",
              overflow: "hidden",
              aspectRatio: v.aspectRatio && v.aspectRatio !== "auto" ? v.aspectRatio : "1/1",
              background: resolveColor(v.imageBg, colors),
              borderRadius: imageRadius,
              border: v.imageBorder && borderWidth ? `${borderWidth}px solid rgba(32,32,32,.1)` : undefined,
              boxShadow: shadowOf(shadow),
            }}
          >
            {photo ? (
              <img
                src={photo}
                alt={product.name}
                loading="lazy"
                style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
              />
            ) : (
              <div style={{ width: "100%", height: "100%", display: "grid", placeItems: "center", color: colors.secondary }}>
                <Icons.ImageIcon size={28} />
              </div>
            )}
          </div>
          {!product.inStock && v.showBadge ? (
            <span
              style={{
                position: "absolute",
                left: 8,
                top: 8,
                zIndex: 1,
                borderRadius: 999,
                background: colors.text,
                color: colors.background,
                padding: "4px 10px",
                fontSize: 10,
                fontWeight: 600,
                letterSpacing: "0.04em",
                textTransform: "uppercase",
              }}
            >
              Esgotado
            </span>
          ) : null}
          {wishlist && v.showWishlist ? (
            <span
              style={{
                position: "absolute",
                right: 8,
                top: 8,
                zIndex: 1,
                width: 32,
                height: 32,
                display: "grid",
                placeItems: "center",
                borderRadius: 999,
                background: "rgba(255,255,255,.85)",
                border: `1px solid ${colors.border}`,
                color: colors.text,
              }}
            >
              <Icons.Heart size={14} />
            </span>
          ) : null}
        </div>
        <div style={{ marginTop: 12, minWidth: 0, textAlign: align }}>
          {v.showName ? (
            <p style={{ fontSize: v.nameSize, fontWeight: 500, lineHeight: 1.25, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", margin: 0 }}>{product.name}</p>
          ) : null}
          {v.showPrice ? (
            <p style={{ marginTop: 4, fontSize: v.priceSize, fontWeight: 700, color: colors.text, margin: v.showName ? "4px 0 0" : 0 }}>
              {formatPrice(product.price, currency)}
            </p>
          ) : null}
        </div>
      </article>
    </Editable>
  );
}

function ProductsSection({ id }: { id: string }) {
  const { v, colors, pad, layout, mobile } = useSectionFrame(id);
  const { products, store, manifest } = useTheme();
  const card = useNodeValues(elementPath(id, "productCard"));
  const styleG = useGlobalGroup("style");
  let list = products;
  if (v.mode === "manual" && (v.picked ?? []).length)
    list = (v.picked as string[]).map((pid) => products.find((p) => p.id === pid)!).filter(Boolean);
  if (v.sort === "priceAsc") list = [...list].sort((a, b) => a.price - b.price);
  if (v.sort === "priceDesc") list = [...list].sort((a, b) => b.price - a.price);
  list = list.slice(0, v.count);
  const cols = v.columns ?? 2;

  return (
    <SectionShell path={sectionPath(id)} label="Produtos" style={{ ...pad(32, 24, 44, 32), background: colors.background, color: colors.text }}>
      <div style={{ maxWidth: layout.contentWidth || undefined, margin: "0 auto" }}>
        <TextEl path={elementPath(id, "title")} label="Título" fallbackTag="h2" />
        {list.length === 0 ? (
          <p style={{ opacity: 0.6, fontSize: 14 }}>Nenhum produto para mostrar.</p>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: `repeat(${cols}, minmax(0,1fr))`, columnGap: layout.gridGap, rowGap: Math.round(layout.gridGap * (mobile ? 2 : 1.6)), marginTop: 20 }}>
            {list.map((p) => (
              <ProductCard
                key={p.id}
                product={p}
                cardPath={elementPath(id, "productCard")}
                v={card}
                colors={colors}
                imageRadius={styleG.imageRadius}
                borderWidth={styleG.borderWidth}
                shadow={styleG.shadowStrength}
                currency={store.currency}
                wishlist={!!manifest.capabilities.wishlist}
              />
            ))}
          </div>
        )}
        <div style={{ display: "flex", justifyContent: "center", marginTop: 24 }}>
          <ButtonEl path={elementPath(id, "viewAll")} label="Botão explorar mais" />
        </div>
      </div>
    </SectionShell>
  );
}

function WhatsappCtaSection({ id }: { id: string }) {
  const { v, colors, pad } = useSectionFrame(id);
  const { store, device, mode } = useTheme();
  const styleG = useGlobalGroup("style");
  const hasNumber = !!store.whatsapp?.trim();
  if (!hasNumber && mode === "live") return null;
  const mobile = device === "mobile";
  const filled = v.cardStyle !== "border";

  return (
    <SectionShell path={sectionPath(id)} label="Contacto por WhatsApp" style={{ ...pad(24, 24, 32, 36, 20, 24), background: colors.background, color: colors.text }}>
      <div
        style={{
          maxWidth: 768,
          margin: "0 auto",
          display: "flex",
          flexDirection: mobile ? "column" : "row",
          alignItems: "center",
          justifyContent: mobile ? "center" : "space-between",
          gap: mobile ? 12 : 24,
          textAlign: mobile ? "center" : "left",
          padding: mobile ? "20px" : "24px 32px",
          borderRadius: styleG.radius,
          border: `1px solid ${colors.border}`,
          background: filled ? `color-mix(in srgb, ${colors.surfaceAlt} 40%, transparent)` : "transparent",
        }}
      >
        <div>
          <TextEl path={elementPath(id, "title")} label="Título" fallbackTag="h2" />
          <div style={{ marginTop: 4 }}>
            <TextEl path={elementPath(id, "text")} label="Descrição" />
          </div>
          {!hasNumber ? (
            <p style={{ marginTop: 8, fontSize: 12, color: colors.secondary }}>Ainda não aparece na loja: adicione o seu WhatsApp em Informações da loja.</p>
          ) : null}
        </div>
        <ButtonEl path={elementPath(id, "button")} label="Botão" />
      </div>
    </SectionShell>
  );
}

function TikTokIcon({ size }: { size: number }) {
  return <Icons.Music2 size={size} />;
}

function FooterSection({ id }: { id: string }) {
  const { v, colors, layout } = useSectionFrame(id);
  const { store, device } = useTheme();
  const social = useNodeValues(elementPath(id, "socialLinks"));
  const copyright = useNodeValues(elementPath(id, "copyright"));
  const credit = useNodeValues(elementPath(id, "credit"));
  const mobile = device === "mobile";

  // ANTES: `policy.shipping`/`policy.returns`/`policy.terms` eram 3 toggles
  // só do editor, sem relação com as Definições reais da loja — por isso o
  // editor podia mostrar "Envios e Entregas" com a loja a tê-lo desligado,
  // e até deixava desligar "Trocas e Devoluções", que é sempre obrigatório.
  // Agora lê-se `store.paginas` (vem das Definições reais) através da MESMA
  // função que a loja pública usa — ver lib/store/shared/storefront-logic.ts.
  const links = getVisiblePolicyLinks(store.paginas ?? { entrega: { mostrar: true }, termos: { mostrar: true } }).map(
    (link) => link.label
  );

  const nets: { key: "instagram" | "facebook" | "tiktok"; label: string; Icon: React.ComponentType<any> }[] = [
    { key: "instagram", label: "Instagram", Icon: Icons.Instagram },
    { key: "facebook", label: "Facebook", Icon: Icons.Facebook },
    { key: "tiktok", label: "TikTok", Icon: TikTokIcon as React.ComponentType<any> },
  ];
  const visibleNets = nets.filter((n) => social[n.key] && store.social[n.key]);

  const copyText = String(copyright.text ?? "")
    .replace("{ano}", String(new Date().getFullYear()))
    .replace("{loja}", store.name);

  return (
    <SectionShell path={sectionPath(id)} label="Rodapé" style={{ background: colors.background, color: colors.text, padding: device === "mobile" ? "16px 20px 32px" : "24px 32px 32px" }}>
      <div style={{ maxWidth: layout.contentWidth || undefined, margin: "0 auto", borderTop: v.borderTop ? `1px solid ${colors.border}` : undefined, paddingTop: mobile ? 24 : 28 }}>
        <div style={{ display: "grid", gridTemplateColumns: mobile ? "minmax(0,1fr) auto" : "1fr 1fr", gap: mobile ? 12 : 32, alignItems: "start" }}>
          <div>
            <TextEl path={elementPath(id, "heading")} label="Título da coluna" fallbackTag="h2" />
            <Editable path={elementPath(id, "policyLinks")} label="Links de informação" as="ul" style={{ listStyle: "none", margin: "12px 0 0", padding: 0, display: "grid", gap: 6 }}>
              {links.map((l) => (
                <li key={l} style={{ fontSize: 14, color: colors.secondary }}>
                  {l}
                </li>
              ))}
            </Editable>
          </div>
          {visibleNets.length ? (
            <Editable path={elementPath(id, "socialLinks")} label="Redes sociais" as="div" style={{ display: "flex", gap: mobile ? 4 : 8 }}>
              {visibleNets.map(({ key, label, Icon }) => (
                <span
                  key={key}
                  aria-label={label}
                  style={{ width: mobile ? 32 : 36, height: mobile ? 32 : 36, display: "grid", placeItems: "center", borderRadius: 999, border: `1px solid ${colors.border}`, background: colors.cardBg, color: colors.text }}
                >
                  <Icon size={16} />
                </span>
              ))}
            </Editable>
          ) : null}
        </div>
        <div style={{ marginTop: 24, borderTop: `1px solid ${colors.border}99`, paddingTop: 20, display: "flex", flexDirection: "column", alignItems: mobile ? "center" : "flex-start", gap: 4, textAlign: mobile ? "center" : "left" }}>
          <TextEl path={elementPath(id, "copyright")} label="Direitos de autor" text={copyText} fallbackTag="p" />
          {credit.show !== false ? (
            <Editable path={elementPath(id, "credit")} label="Crédito Shopyump" as="p" style={{ fontSize: 12, color: colors.secondary, margin: 0 }}>
              Criado com Shopyump
            </Editable>
          ) : null}
        </div>
      </div>
    </SectionShell>
  );
}

/* ------------------------------ Extensão: páginas, painéis e barra inferior ------------------------------ */

const pageKeyOfHeading = (sectionId: string): LumePageKey | undefined =>
  (Object.entries(HEADING_SECTION).find(([, sid]) => sid === sectionId)?.[0] as LumePageKey | undefined);

function usePreviewProduct(): ProductLite | undefined {
  const { products } = useTheme();
  const { productId } = useEditorPreview();
  return products.find((p) => p.id === productId) ?? products[0];
}

function PageHeadingSection({ id }: { id: string }) {
  const { colors, layout, mobile } = useSectionFrame(id);
  const { store } = useTheme();
  const eyebrow = useNodeValues(elementPath(id, "eyebrow"));
  const title = useNodeValues(elementPath(id, "title"));
  const description = useNodeValues(elementPath(id, "description"));
  const key = pageKeyOfHeading(id);
  const dflt = key ? PAGE_TEXT[key] : { eyebrow: "", title: "", description: "" };
  const fill = (t: string) => t.replace("{loja}", store.name);
  const pick = (v: Record<string, any>, d: string) => fill(v.text && String(v.text).trim() ? String(v.text) : d);
  const e = pick(eyebrow, dflt.eyebrow);
  const t = pick(title, dflt.title);
  const d = pick(description, dflt.description);
  const institutional = key === "shipping" || key === "returns" || key === "terms";
  const collection = key === "collection";

  return (
    <SectionShell
      path={sectionPath(id)}
      label="Título da página"
      style={{ borderBottom: collection ? undefined : `1px solid ${colors.border}`, background: institutional ? `color-mix(in srgb, ${colors.surfaceAlt} 40%, transparent)` : colors.cardBg, color: colors.text }}
    >
      <div style={{ maxWidth: institutional ? 896 : layout.contentWidth || undefined, margin: "0 auto", padding: collection ? (mobile ? "28px 16px 0" : "40px 24px 0") : institutional ? (mobile ? "48px 20px" : "80px 32px") : mobile ? "36px 20px" : "48px 24px" }}>
        {e ? (
          <Editable path={elementPath(id, "eyebrow")} label="Etiqueta" as="div">
            <p style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", color: colors.secondary }}>{e}</p>
          </Editable>
        ) : null}
        <Editable path={elementPath(id, "title")} label="Título" as="div">
          <h1 style={{ marginTop: e ? 8 : 0, fontSize: institutional ? (mobile ? 30 : 48) : collection ? (mobile ? 24 : 30) : 24, fontWeight: institutional ? 800 : 700 }}>{t}</h1>
        </Editable>
        {d ? (
          <Editable path={elementPath(id, "description")} label="Descrição" as="div">
            <p style={{ marginTop: 8, fontSize: institutional ? 16 : 14, color: colors.secondary, maxWidth: 640 }}>{d}</p>
          </Editable>
        ) : null}
        {collection ? (
          <span style={{ position: "absolute", right: mobile ? 16 : 24, top: mobile ? 28 : 40, display: "inline-flex", alignItems: "center", gap: 6, border: `1px solid ${colors.border}`, borderRadius: 999, padding: "4px 12px", fontSize: 12, fontWeight: 600 }}>
            <Icons.Settings2 size={14} /> Filtrar
          </span>
        ) : null}
      </div>
    </SectionShell>
  );
}

function CatalogGridSection({ id }: { id: string }) {
  const { v, colors, layout, mobile } = useSectionFrame(id);
  const { products, store, manifest } = useTheme();
  const card = useNodeValues(elementPath("products", "productCard"));
  const styleG = useGlobalGroup("style");
  const list = products.slice(0, id === "wishlistProducts" ? 4 : 8);
  return (
    <SectionShell path={sectionPath(id)} label="Grelha de produtos" style={{ background: colors.background, color: colors.text, padding: mobile ? "24px 16px 32px" : "28px 24px 32px" }}>
      <div style={{ maxWidth: layout.contentWidth || undefined, margin: "0 auto", display: "grid", gridTemplateColumns: `repeat(${v.columns ?? 2}, minmax(0,1fr))`, columnGap: layout.gridGap, rowGap: Math.round(layout.gridGap * 1.6) }}>
        {list.map((p) => (
          <ProductCard
            key={p.id}
            product={p}
            cardPath={elementPath(id, "productCard")}
            v={card}
            colors={colors}
            imageRadius={styleG.imageRadius}
            borderWidth={styleG.borderWidth}
            shadow={styleG.shadowStrength}
            currency={store.currency}
            wishlist={!!manifest.capabilities.wishlist}
          />
        ))}
      </div>
    </SectionShell>
  );
}

function ProductGallerySection({ id }: { id: string }) {
  const { colors, mobile } = useSectionFrame(id);
  const styleG = useGlobalGroup("style");
  const product = usePreviewProduct();
  const img = product?.images[0];
  return (
    <SectionShell path={sectionPath(id)} label="Galeria do produto" style={{ background: colors.background, padding: mobile ? "16px 16px 0" : "28px 24px 0" }}>
      <div style={{ maxWidth: 520, margin: "0 auto" }}>
        <div style={{ aspectRatio: "1/1", background: colors.gallery, borderRadius: styleG.imageRadius, border: `1px solid rgba(32,32,32,.1)`, overflow: "hidden", display: "grid", placeItems: "center" }}>
          {img ? <img src={img} alt={product?.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <Icons.ImageIcon size={32} color={colors.secondary} />}
        </div>
      </div>
    </SectionShell>
  );
}

function ProductInfoSection({ id }: { id: string }) {
  const { colors, mobile } = useSectionFrame(id);
  const { store } = useTheme();
  const product = usePreviewProduct();
  if (!product) return null;
  return (
    <SectionShell path={sectionPath(id)} label="Informações do produto" style={{ background: colors.background, color: colors.text, padding: mobile ? "16px" : "20px 24px" }}>
      <div style={{ maxWidth: 520, margin: "0 auto", display: "grid", gap: 10 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700 }}>{product.name}</h1>
        <p style={{ fontSize: 18, fontWeight: 700 }}>{formatPrice(product.price, store.currency)}</p>
        <div style={{ display: "grid", gap: 10, marginTop: 6 }}>
          <ButtonEl path={elementPath(id, "buyNow")} label="Botão comprar agora" />
          <ButtonEl path={elementPath(id, "addToCart")} label="Botão adicionar" />
        </div>
        <p style={{ fontSize: 14, color: colors.secondary }}>{product.shortDescription ?? "Uma peça versátil, confortável e fácil de combinar."}</p>
      </div>
    </SectionShell>
  );
}

function RecommendationsSection({ id }: { id: string }) {
  const { colors, mobile, layout } = useSectionFrame(id);
  const { products, store, manifest } = useTheme();
  const title = useNodeValues(elementPath(id, "title"));
  const card = useNodeValues(elementPath("products", "productCard"));
  const styleG = useGlobalGroup("style");
  const current = usePreviewProduct();
  const list = products.filter((p) => p.id !== current?.id).slice(0, 4);
  return (
    <SectionShell path={sectionPath(id)} label="Você também pode gostar" style={{ background: colors.background, color: colors.text, padding: mobile ? "32px 16px" : "48px 24px" }}>
      <div style={{ maxWidth: layout.contentWidth || undefined, margin: "0 auto" }}>
        {title.show !== false ? (
          <Editable path={elementPath(id, "title")} label="Título" as="div">
            <h2 style={{ fontSize: mobile ? 20 : 24, fontWeight: 700 }}>{title.text || UI_TEXT.recommendations}</h2>
          </Editable>
        ) : null}
        <div style={{ marginTop: 20, display: "grid", gridTemplateColumns: "repeat(2, minmax(0,1fr))", gap: layout.gridGap }}>
          {list.map((p) => (
            <ProductCard key={p.id} product={p} cardPath={sectionPath(id)} v={card} colors={colors} imageRadius={styleG.imageRadius} borderWidth={styleG.borderWidth} shadow={styleG.shadowStrength} currency={store.currency} wishlist={!!manifest.capabilities.wishlist} />
          ))}
        </div>
      </div>
    </SectionShell>
  );
}

function ContentBlockSection({ id }: { id: string }) {
  const { colors, mobile } = useSectionFrame(id);
  return (
    <SectionShell path={sectionPath(id)} label="Conteúdo" style={{ background: colors.background, color: colors.text, padding: mobile ? "32px 20px" : "48px 32px" }}>
      <div style={{ maxWidth: 768, margin: "0 auto", display: "grid", gap: 12 }}>
        {[88, 100, 72, 94].map((w, i) => (
          <span key={i} style={{ display: "block", height: 10, width: `${w}%`, borderRadius: 999, background: colors.surfaceAlt }} />
        ))}
        <p style={{ fontSize: 12, color: colors.secondary }}>O texto desta página é gerido em Páginas e políticas.</p>
      </div>
    </SectionShell>
  );
}

function ContactFormSection({ id }: { id: string }) {
  const { colors, mobile, layout, v } = useSectionFrame(id);
  const { store } = useTheme();
  void v;
  const field = (label: string, tall = false) => (
    <div style={{ display: "grid", gap: 6, fontSize: 14, fontWeight: 600 }}>
      {label}
      <span style={{ display: "block", height: tall ? 96 : 40, border: `1px solid ${colors.border}`, borderRadius: 8, background: colors.cardBg }} />
    </div>
  );
  return (
    <SectionShell path={sectionPath(id)} label="Formulário de contacto" style={{ background: colors.background, color: colors.text, padding: mobile ? "32px 20px" : "40px 24px" }}>
      <div style={{ maxWidth: layout.contentWidth || undefined, margin: "0 auto", display: "grid", gap: 32, gridTemplateColumns: mobile ? "1fr" : "1fr .8fr" }}>
        <div style={{ display: "grid", gap: 16 }}>
          {field("Nome")}
          {field("Email")}
          {field("Mensagem", true)}
          <ButtonEl path={elementPath(id, "submit")} label="Botão enviar" />
        </div>
        <div style={{ display: "grid", gap: 4, alignContent: "start" }}>
          {store.whatsapp ? <p style={{ borderBottom: `1px solid ${colors.border}`, padding: "16px 0", fontSize: 14 }}>WhatsApp · {store.whatsapp}</p> : null}
          {store.email ? <p style={{ borderBottom: `1px solid ${colors.border}`, padding: "16px 0", fontSize: 14 }}>Email · {store.email}</p> : null}
        </div>
      </div>
    </SectionShell>
  );
}

/**
 * Conta: espelho exato do que o cliente vê na loja sem sessão iniciada
 * (rotas/conta.tsx). Não é editável: nem o título nem o botão — por isso não
 * usa SectionShell/Editable (nada aqui se pode selecionar).
 */
function AccountPreview({ id }: { id: string }) {
  const { colors, layout, mobile } = useSectionFrame(id);
  const btn = buttonStyle({ variant: "solid", radius: 999 }, colors);
  return (
    <div style={{ background: colors.background, color: colors.text }}>
      <div style={{ borderBottom: `1px solid ${colors.border}`, background: colors.cardBg }}>
        <div style={{ maxWidth: layout.contentWidth || undefined, margin: "0 auto", padding: mobile ? "36px 20px" : "48px 24px" }}>
          <p style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", color: colors.secondary }}>Área pessoal</p>
          <h1 style={{ marginTop: 8, fontSize: 24, fontWeight: 700 }}>A minha conta</h1>
          <p style={{ marginTop: 8, maxWidth: 576, fontSize: 14, lineHeight: "24px", color: colors.secondary }}>Inicie sessão para ver pedidos, dados e favoritos.</p>
        </div>
      </div>
      <div style={{ maxWidth: layout.contentWidth || undefined, margin: "0 auto", minHeight: 360, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", padding: mobile ? "56px 16px" : "56px 24px" }}>
        <span style={{ display: "grid", placeItems: "center", width: 56, height: 56, borderRadius: 999, background: colors.surfaceAlt }}>
          <Icons.User size={24} />
        </span>
        <h2 style={{ marginTop: 16, fontSize: 18, fontWeight: 600 }}>Ainda não iniciou sessão</h2>
        <p style={{ marginTop: 8, maxWidth: 384, fontSize: 14, color: colors.secondary }}>Entre com o seu e-mail — enviamos um código de 6 dígitos, sem palavra-passe.</p>
        <span style={{ ...btn, height: 36, padding: "0 16px", marginTop: 20, fontWeight: 500 }}>Entrar ou criar conta</span>
      </div>
    </div>
  );
}

function ReadOnlyPageSection({ id, kind }: { id: string; kind: "checkout" | "account" }) {
  const { colors, mobile } = useSectionFrame(id);
  if (kind === "account") return <AccountPreview id={id} />;
  return (
    <SectionShell path={sectionPath(id)} label={kind === "checkout" ? "Finalizar compra" : "Conta"} style={{ background: colors.background, color: colors.text, padding: mobile ? "28px 16px" : "40px 24px", minHeight: 360 }}>
      <div style={{ maxWidth: 640, margin: "0 auto", display: "grid", gap: 12 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700 }}>{kind === "checkout" ? "Finalizar compra" : "A minha conta"}</h1>
        {[1, 2, 3].map((n) => (
          <span key={n} style={{ display: "block", height: 44, border: `1px solid ${colors.border}`, borderRadius: 8, background: colors.cardBg }} />
        ))}
        <p style={{ fontSize: 12, color: colors.secondary }}>Esta página é só de leitura: pagamentos e dados do cliente não se editam aqui.</p>
      </div>
    </SectionShell>
  );
}

/** Barra inferior (só telemóvel): a "pílula" escura do Lume. */
function BottomNavSection({ id }: { id: string }) {
  const v = useNodeValues(sectionPath(id));
  const { device, manifest, onNavigateLink } = useTheme();
  if (device !== "mobile") return null;
  const cap = manifest.capabilities;
  const items = [
    { key: "home", label: "Início", Icon: Icons.Home, on: true, link: { type: "home" } as unknown },
    { key: "search", label: "Pesquisar", Icon: Icons.Search, on: v.showSearch !== false && !!cap.search, link: null },
    { key: "wishlist", label: "Favoritos", Icon: Icons.Heart, on: v.showWishlist !== false && !!cap.wishlist, link: { type: "themePage", value: "wishlist" } as unknown },
    { key: "cart", label: "Carrinho", Icon: Icons.ShoppingCart, on: v.showCart !== false && !!cap.cart, link: null },
  ].filter((i) => i.on);
  return (
    <FixedShell path={sectionPath(id)} label="Barra inferior" style={{ display: "flex", justifyContent: "center", padding: "0 0 16px", pointerEvents: "none" }}>
      <nav aria-label="Navegação principal" style={{ pointerEvents: "auto", display: "flex", alignItems: "center", gap: 4, padding: 6, borderRadius: 999, background: "linear-gradient(180deg,#303030,#1a1a19)", boxShadow: "0 18px 30px rgba(20,20,18,.3), inset 0 1px 0 rgba(255,255,255,.12)" }}>
        {items.map(({ key, label, Icon, link }, i) => (
          <span
            key={key}
            aria-label={label}
            onClickCapture={() => link && onNavigateLink?.(link)}
            style={{ display: "grid", placeItems: "center", width: 48, height: 44, borderRadius: 999, color: i === 0 ? "#141412" : "#f5f5f5", background: i === 0 ? "#fafafa" : "transparent" }}
          >
            <Icon size={20} />
          </span>
        ))}
      </nav>
    </FixedShell>
  );
}

function SideMenuSection({ id }: { id: string }) {
  const v = useNodeValues(sectionPath(id));
  const colors = useColors();
  const { store, categories, onNavigateLink } = useTheme();
  const items = ((v.items ?? []) as any[]).filter((i) => !i.hidden);
  const go = (link: unknown) => (e: React.MouseEvent) => {
    e.stopPropagation();
    onNavigateLink?.(link);
  };
  return (
    <OverlayShell id="sideMenu" path={sectionPath(id)} label="Menu lateral" side="left" width={300} scrim={35} style={{ background: colors.background, color: colors.text, padding: 20 }}>
      <p style={{ fontSize: 20, fontWeight: 800, marginBottom: 32 }}>{store.name}</p>
      <nav style={{ display: "grid", gap: 2 }}>
        {items.map((it) => (
          <span key={it.id} onClick={go(it.link)} style={{ cursor: "pointer", padding: "8px 12px", borderRadius: 6, fontSize: 18, color: colors.secondary, fontWeight: it.link?.value === "home" ? 700 : 500 }}>
            {it.label}
            {it.link?.type === "category" ? null : null}
          </span>
        ))}
      </nav>
      <span hidden>{categories.length}</span>
    </OverlayShell>
  );
}

function SearchOverlaySection({ id }: { id: string }) {
  const colors = useColors();
  const { products, store } = useTheme();
  const title = useNodeValues(elementPath(id, "title"));
  const placeholder = useNodeValues(elementPath(id, "placeholder"));
  return (
    <OverlayShell id="searchOverlay" path={sectionPath(id)} label="Pesquisa" side="full" scrim={0} style={{ background: colors.background, color: colors.text, padding: 20 }}>
      <div style={{ maxWidth: 672, margin: "0 auto" }}>
        <Editable path={elementPath(id, "title")} label="Título" as="div">
          <h2 style={{ fontSize: 18, fontWeight: 600 }}>{title.text || UI_TEXT.searchTitle}</h2>
        </Editable>
        <Editable path={elementPath(id, "placeholder")} label="Texto do campo" as="div" style={{ marginTop: 24 }}>
          <span style={{ display: "flex", alignItems: "center", gap: 8, height: 48, padding: "0 12px", border: `1px solid ${colors.border}`, borderRadius: 8, color: colors.secondary, fontSize: 14 }}>
            <Icons.Search size={16} /> {placeholder.text || UI_TEXT.searchPlaceholder}
          </span>
        </Editable>
        <div style={{ marginTop: 24, display: "grid", gap: 12 }}>
          {products.slice(0, 3).map((p) => (
            <div key={p.id} style={{ display: "grid", gridTemplateColumns: "56px 1fr", gap: 12, alignItems: "center", borderBottom: `1px solid ${colors.border}`, paddingBottom: 12 }}>
              <span style={{ width: 56, height: 56, borderRadius: 8, overflow: "hidden", background: colors.gallery }}>{p.images[0] ? <img src={p.images[0]} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : null}</span>
              <span style={{ fontSize: 14 }}><strong style={{ display: "block", fontWeight: 600 }}>{p.name}</strong>{formatPrice(p.price, store.currency)}</span>
            </div>
          ))}
        </div>
      </div>
    </OverlayShell>
  );
}

function CartDrawerSection({ id }: { id: string }) {
  const colors = useColors();
  const { products, store } = useTheme();
  const title = useNodeValues(elementPath(id, "title"));
  const description = useNodeValues(elementPath(id, "description"));
  const lines = products.slice(0, 2);
  const subtotal = lines.reduce((n, p) => n + p.price, 0);
  return (
    <OverlayShell id="cartDrawer" path={sectionPath(id)} label="Carrinho lateral" side="right" width={340} scrim={35} style={{ background: colors.background, color: colors.text, display: "flex", flexDirection: "column" }}>
      <div style={{ borderBottom: `1px solid ${colors.border}`, padding: "20px" }}>
        <Editable path={elementPath(id, "title")} label="Título" as="div"><h2 style={{ fontSize: 18, fontWeight: 600 }}>{title.text || UI_TEXT.cartTitle}</h2></Editable>
        <Editable path={elementPath(id, "description")} label="Descrição" as="div"><p style={{ marginTop: 4, fontSize: 14, color: colors.secondary }}>{description.text || UI_TEXT.cartDescription}</p></Editable>
      </div>
      <div style={{ flex: 1, padding: 20, display: "grid", gap: 16, alignContent: "start" }}>
        {lines.map((p) => (
          <div key={p.id} style={{ display: "grid", gridTemplateColumns: "76px 1fr", gap: 12, borderBottom: `1px solid ${colors.border}`, paddingBottom: 16 }}>
            <span style={{ width: 76, height: 76, borderRadius: 8, overflow: "hidden", background: colors.gallery }}>{p.images[0] ? <img src={p.images[0]} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : null}</span>
            <span style={{ fontSize: 14 }}><strong style={{ display: "block", fontWeight: 600 }}>{p.name}</strong><span style={{ fontSize: 12, color: colors.secondary }}>{formatPrice(p.price, store.currency)}</span></span>
          </div>
        ))}
      </div>
      <div style={{ borderTop: `1px solid ${colors.border}`, padding: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16, fontSize: 14 }}>
          <span style={{ color: colors.secondary }}>Subtotal</span>
          <strong style={{ fontSize: 18 }}>{formatPrice(subtotal, store.currency)}</strong>
        </div>
        <ButtonEl path={elementPath(id, "checkout")} label="Botão finalizar" />
      </div>
    </OverlayShell>
  );
}

/**
 * Entrar/criar conta: espelho exato do modal que o cliente vê na loja sem
 * sessão iniciada (auth-modal.tsx). Não é editável: nem o título nem o botão
 * — por isso não usa Editable nos elementos internos (só o painel em si é
 * selecionável, sem definições, via noContainer()).
 */
function AuthOverlaySection({ id }: { id: string }) {
  const colors = useColors();
  const btn = buttonStyle({ variant: "solid", radius: 999 }, colors);
  return (
    <OverlayShell id="authOverlay" path={sectionPath(id)} label="Entrar ou criar conta" side="full" scrim={35} style={{ background: colors.background, color: colors.text, padding: 20 }}>
      <div style={{ maxWidth: 420, margin: "40px auto 0" }}>
        <div style={{ paddingRight: 32 }}>
          <h2 style={{ fontSize: 20, fontWeight: 700 }}>Entrar ou criar conta</h2>
          <p style={{ marginTop: 8, fontSize: 14, lineHeight: "20px", color: colors.secondary }}>Digite o seu e-mail para aceder à sua conta ou criar uma nova.</p>
        </div>
        <div style={{ marginTop: 20, display: "grid", gap: 6 }}>
          <span style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", color: colors.secondary }}>E-mail</span>
          <span style={{ display: "block", height: 48, border: `1px solid ${colors.border}`, borderRadius: 8, background: colors.cardBg }} />
        </div>
        <span style={{ display: "flex", alignItems: "flex-start", gap: 8, marginTop: 14, fontSize: 12, lineHeight: "16px", color: colors.secondary }}>
          <span style={{ width: 16, height: 16, borderRadius: 4, border: `1px solid ${colors.border}`, flexShrink: 0 }} />
          Quero receber novidades e ofertas
        </span>
        <span style={{ ...btn, display: "block", textAlign: "center", height: 48, lineHeight: "48px", marginTop: 20, fontWeight: 600 }}>Continuar com e-mail</span>
      </div>
    </OverlayShell>
  );
}

/* ------------------------------ Seções adicionáveis ------------------------------ */

function SectionFrame({ id, label, tone, children }: { id: string; label: string; tone: string; children: ReactNode }) {
  const { layout, mobile } = useSectionFrame(id);
  const sch = useScheme(tone);
  return (
    <SectionShell path={sectionPath(id)} label={label} style={{ background: sch.background, color: sch.text, padding: mobile ? "32px 16px" : "48px 24px" }}>
      <div style={{ maxWidth: layout.contentWidth || undefined, margin: "0 auto" }}>{children}</div>
    </SectionShell>
  );
}

function CategoriesSection({ id }: { id: string }) {
  const { v, mobile, colors } = useSectionFrame(id);
  const { products, categories, mode } = useTheme();
  const nameOf = (categoryId: string) => categories.find((c) => c.id === categoryId)?.name ?? categoryId;
  // Mesma regra da loja pública: 3 categorias fixas, com a 1.ª foto de cada uma.
  const list = LUME_CATEGORIES.map((name) => {
    const items = products.filter((p) => lumeCategoryOf(nameOf(p.categoryId)) === name);
    return { id: name, name, productCount: items.length, cover: items.find((p) => p.images[0])?.images[0] };
  }).filter((c) => c.productCount > 0);
  if (list.length === 0 && mode === "live") return null;
  const round = v.shape === "round";
  return (
    <SectionFrame id={id} label="Categorias" tone={v.tone ?? "light"}>
      <div style={{ fontWeight: 700 }}><TextEl path={elementPath(id, "title")} label="Título" fallbackTag="h2" /></div>
      {list.length === 0 ? (
        <p style={{ marginTop: 12, fontSize: 14, opacity: 0.6 }}>Ainda não tem categorias. Elas aparecem quando criar produtos.</p>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: `repeat(${v.columns ?? (mobile ? 2 : 4)}, minmax(0,1fr))`, gap: mobile ? 12 : 20, marginTop: 20 }}>
          {list.map((c) => {
            const cover = c.cover;
            return (
              <div key={c.id} style={{ textAlign: "center", minWidth: 0 }}>
                <div style={{ aspectRatio: "1/1", overflow: "hidden", borderRadius: round ? 999 : 16, background: colors.gallery, border: `1px solid ${colors.border}` }}>
                  {cover ? <img src={cover} alt={c.name} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} /> : null}
                </div>
                <p style={{ marginTop: 8, fontSize: 14, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.name}</p>
                {v.showCount ? <p style={{ fontSize: 12, opacity: 0.6 }}>{c.productCount} {c.productCount === 1 ? "produto" : "produtos"}</p> : null}
              </div>
            );
          })}
        </div>
      )}
    </SectionFrame>
  );
}

function ImageTextSection({ id }: { id: string }) {
  const { v, mobile, colors } = useSectionFrame(id);
  const styleG = useGlobalGroup("style");
  const img = useNodeValues(elementPath(id, "image"));
  const url = useMediaUrl(img.image);
  const right = v.side === "right";
  return (
    <SectionFrame id={id} label="Imagem e texto" tone={v.tone ?? "light"}>
      <div style={{ display: "grid", gridTemplateColumns: mobile ? "1fr" : "1fr 1fr", gap: mobile ? 20 : 48, alignItems: "center" }}>
        <Editable path={elementPath(id, "image")} label="Imagem" style={{ order: !mobile && right ? 2 : 0 }}>
          <div style={{ aspectRatio: img.ratio ?? "4/5", overflow: "hidden", background: colors.gallery, borderRadius: styleG.imageRadius, display: "grid", placeItems: "center", color: colors.secondary }}>
            {url ? <img src={url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} /> : <Icons.ImageIcon size={32} />}
          </div>
        </Editable>
        <div>
          <div style={{ fontWeight: 700 }}><TextEl path={elementPath(id, "title")} label="Título" fallbackTag="h2" /></div>
          <div style={{ marginTop: 12 }}><TextEl path={elementPath(id, "text")} label="Texto" /></div>
          <div style={{ marginTop: 20 }}><ButtonEl path={elementPath(id, "button")} label="Botão" /></div>
        </div>
      </div>
    </SectionFrame>
  );
}

function RichTextSection({ id }: { id: string }) {
  const { v } = useSectionFrame(id);
  const center = v.align !== "left";
  return (
    <SectionFrame id={id} label="Texto livre" tone={v.tone ?? "light"}>
      <div style={{ maxWidth: 720, margin: center ? "0 auto" : undefined, textAlign: center ? "center" : "left" }}>
        <div style={{ fontWeight: 700 }}><TextEl path={elementPath(id, "title")} label="Título" fallbackTag="h2" /></div>
        <div style={{ marginTop: 12 }}><TextEl path={elementPath(id, "text")} label="Texto" /></div>
        <div style={{ marginTop: 20, display: "flex", justifyContent: center ? "center" : undefined }}><ButtonEl path={elementPath(id, "button")} label="Botão" /></div>
      </div>
    </SectionFrame>
  );
}

/* ------------------------------ registry + root ------------------------------ */

const SECTION_COMPONENTS: Record<string, (p: { id: string }) => React.ReactElement | null> = {
  announcement: AnnouncementSection,
  header: HeaderSection,
  hero: HeroSection,
  products: ProductsSection,
  whatsappCta: WhatsappCtaSection,
  categories: CategoriesSection,
  imageText: ImageTextSection,
  richText: RichTextSection,
  footer: FooterSection,
  bottomNav: BottomNavSection,
  pageHeading: PageHeadingSection,
  catalogGrid: CatalogGridSection,
  productGallery: ProductGallerySection,
  productInfo: ProductInfoSection,
  recommendations: RecommendationsSection,
  contentBlock: ContentBlockSection,
  contactForm: ContactFormSection,
  checkoutPage: ({ id }) => <ReadOnlyPageSection id={id} kind="checkout" />,
  accountPage: ({ id }) => <ReadOnlyPageSection id={id} kind="account" />,
};

const OVERLAY_COMPONENTS: Record<string, (p: { id: string }) => React.ReactElement | null> = {
  sideMenu: SideMenuSection,
  searchOverlay: SearchOverlaySection,
  cartDrawer: CartDrawerSection,
  authOverlay: AuthOverlaySection,
};

/**
 * `only`: se indicado, desenha apenas estas seções (ex.: a miniatura da página
 * "Personalizar loja" mostra só a primeira seção da página). Sem `only`,
 * desenha a página completa, a barra fixa e os painéis abertos.
 */
export function LumeRenderer({ pageId, only }: { pageId: string; only?: string[] }) {
  const { manifest, customization } = useTheme();
  const preview = useEditorPreview();
  const pageKind: PageKind = manifest.pages.find((p) => p.id === pageId)?.kind ?? "home";
  const colors = useColors();
  const typo = useGlobalGroup("typography");
  const ids = visibleSectionIds(manifest, customization, pageId);
  const every = [...ids.top, ...ids.page, ...ids.bottom];
  const all = only ? every.filter((id) => only.includes(id)) : every;
  const fonts = Object.fromEntries(manifest.fonts.map((f) => [f.id, f.family]));
  const overlays = only ? [] : (manifest.overlays ?? []).filter((o) => !o.requires || manifest.capabilities[o.requires]);

  const rootStyle = {
    "--sy-font-heading": fonts[typo.headingFont],
    "--sy-color-background": colors.background,
    background: colors.background,
    color: colors.text,
    fontFamily: fonts[typo.bodyFont],
    fontWeight: typo.bodyWeight,
    fontSize: 16,
    lineHeight: 1.5,
    position: preview.pinFixedSections ? "relative" : undefined,
    paddingBottom: preview.pinFixedSections ? preview.fixedHeight : undefined,
    minHeight: preview.pinFixedSections ? preview.viewportH : undefined,
  } as CSSProperties;

  const render = (id: string) => {
    const type = sectionTypeOf(manifest, customization, id);
    const Cmp = type ? SECTION_COMPONENTS[type.type] : undefined;
    if (!Cmp || customization.sections[id]?.hidden) return null;
    return <Fragment key={id}><Cmp id={id} /></Fragment>;
  };

  return (
    <PageKindCtx.Provider value={pageKind}>
      <div className="sy-root" style={rootStyle}>
        <style>{`.sy-root h1,.sy-root h2,.sy-root h3,.sy-root h4{font-family:var(--sy-font-heading);line-height:1.25;text-transform:${typo.headingTransform === "none" ? "none" : typo.headingTransform};margin:0}
        .sy-root h1{letter-spacing:-0.025em}
        .sy-root p,.sy-root ul{margin:0}`}</style>
        {all.map(render)}
        {only ? null : ids.fixed.map(render)}
        {overlays.map((o) => {
          const Cmp = OVERLAY_COMPONENTS[o.id];
          return Cmp ? <Fragment key={o.id}><Cmp id={o.sectionIds[0]!} /></Fragment> : null;
        })}
      </div>
    </PageKindCtx.Provider>
  );
}

/** Rota pública do Lume para uma página do tema (usado por quem precisa de ligar editor ↔ loja). */
export const lumeRouteOf = (page: string) => THEME_PAGE_ROUTE[page];

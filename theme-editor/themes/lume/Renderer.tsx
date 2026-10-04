import { Fragment, type CSSProperties } from "react";
import * as Icons from "lucide-react";
import {
  Editable,
  SectionShell,
  useColors,
  useGlobalGroup,
  useNodeValues,
  useTheme,
} from "@/theme-editor/editor/sdk";
import { resolveColor, sectionTypeOf, visibleSectionIds } from "@/theme-editor/editor/core/resolve";
import { elementPath, sectionPath } from "@/theme-editor/editor/core/paths";
import type { ProductLite } from "@/theme-editor/editor/contracts/types";

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
    color: resolveColor(v.color, colors),
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

/** Botão do Lume: pílula; "outline" usa a cor de borda do tema (como o original). */
function buttonStyle(v: Record<string, any>, colors: Record<string, string>): CSSProperties {
  const bg = resolveColor(v.bg, colors);
  const fg = resolveColor(v.textColor, colors);
  const pad = v.size === "sm" ? "8px 14px" : v.size === "lg" ? "12px 24px" : "10px 20px";
  const base: CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    padding: pad,
    borderRadius: v.radius,
    fontWeight: v.weight ?? 600,
    fontSize: v.size === "sm" ? 13 : v.size === "lg" ? 15 : 14,
    textTransform: v.transform && v.transform !== "none" ? v.transform : undefined,
    width: v.width === "full" ? "100%" : undefined,
    justifyContent: v.width === "full" ? "center" : undefined,
    cursor: "default",
    whiteSpace: "nowrap",
  };
  if (v.variant === "outline") return { ...base, background: "transparent", color: bg, border: `1px solid ${colors.border}` };
  if (v.variant === "text") return { ...base, background: "transparent", color: bg, padding: "6px 0", textDecoration: "underline" };
  return { ...base, background: bg, color: fg, border: `1px solid ${colors.border}`, boxShadow: "0 2px 6px rgba(32,32,32,.08)" };
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

function TextEl({ path, label, fallbackTag = "p", text }: { path: string; label: string; fallbackTag?: string; text?: string }) {
  const v = useNodeValues(path);
  const colors = useColors();
  const { manifest } = useTheme();
  const fonts = Object.fromEntries(manifest.fonts.map((f) => [f.id, f.family]));
  if (v.show === false) return null;
  const Tag = (v.htmlTag || fallbackTag) as any;
  return (
    <Editable path={path} label={label} as="div">
      <Tag style={textStyle(v, colors, fonts)}>{text ?? v.text}</Tag>
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
  const bg = v.background ? resolveColor(v.background, colors) : undefined;
  const maxWidth = (key: unknown) => {
    if (key === "full") return undefined;
    if (key === "narrow") return 960;
    if (key === "wide") return 1344;
    return layout.contentWidth || undefined;
  };
  const outer: CSSProperties = {
    background: bg,
    color: colors.text,
    paddingTop: v.spacing,
    paddingBottom: v.spacing,
    paddingLeft: v.padding ?? layout.pagePadding,
    paddingRight: v.padding ?? layout.pagePadding,
    minHeight: v.minHeight || undefined,
  };
  const inner: CSSProperties = {
    maxWidth: maxWidth(v.contentWidth),
    margin: "0 auto",
    display: "flex",
    flexDirection: "column",
    gap: v.gap,
  };
  return { v, outer, inner, scheme, colors, layout };
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
        letterSpacing: "0.02em",
      }}
    >
      <TextEl path={elementPath(id, "message")} label="Mensagem" fallbackTag="span" />
    </SectionShell>
  );
}

function HeaderSection({ id }: { id: string }) {
  const { v, layout, colors } = useSectionFrame(id);
  const { store, device, media } = useTheme();
  const name = useNodeValues(elementPath(id, "name"));
  const logo = useNodeValues(elementPath(id, "logo"));
  const icons = useNodeValues(elementPath(id, "icons"));
  const fonts = Object.fromEntries(useTheme().manifest.fonts.map((f) => [f.id, f.family]));
  const isMobile = device === "mobile";
  const iconColor = resolveColor(icons.color, colors);
  const logoUrl = logo.image?.mediaId ? media.find((m) => m.id === logo.image.mediaId)?.url : undefined;
  const sz = icons.iconSize;

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
          padding: `0 ${v.padding ?? layout.pagePadding}px`,
        }}
      >
        <Editable path={elementPath(id, "icons")} label="Ícones" as="span" style={{ display: "inline-flex", alignItems: "center", gap: 14, color: iconColor }}>
          <Icons.Menu size={sz + 4} strokeWidth={2.25} />
        </Editable>

        <div style={{ position: "absolute", left: "50%", transform: "translateX(-50%)", maxWidth: "55%" }}>
          {logoUrl ? (
            <Editable path={elementPath(id, "logo")} label="Logótipo" as="span" style={{ display: "inline-block" }}>
              <img src={logoUrl} alt={store.name} style={{ height: logo.height, width: "auto", display: "block", maxWidth: "100%" }} />
            </Editable>
          ) : name.show === false ? null : (
            <Editable path={elementPath(id, "name")} label="Nome da loja" as="span" style={{ display: "inline-block" }}>
              <span style={{ ...textStyle(name, colors, fonts), whiteSpace: "nowrap", letterSpacing: "0", display: "block" }}>{store.name}</span>
            </Editable>
          )}
        </div>

        <span style={{ display: "inline-flex", alignItems: "center", gap: 14, color: iconColor }}>
          {!isMobile && v.showSearch ? <Icons.Search size={sz} strokeWidth={2.25} /> : null}
          {!isMobile && v.showWishlist ? <Icons.Heart size={sz} strokeWidth={2.25} /> : null}
          {v.showCart ? <Icons.ShoppingCart size={sz + 2} strokeWidth={2.25} /> : null}
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
  const { v, layout, colors } = useSectionFrame(id);
  const { device, media } = useTheme();
  const image = useNodeValues(elementPath(id, "image"));
  const isMobile = device === "mobile";
  const useImage = v.backgroundMode === "image";
  const url = useImage && image.image?.mediaId ? media.find((m) => m.id === image.image.mediaId)?.url : undefined;
  const focal = image.focalPoint ?? { x: 50, y: 50 };

  return (
    <SectionShell
      path={sectionPath(id)}
      label="Banner principal"
      style={{
        position: "relative",
        overflow: "hidden",
        background: `linear-gradient(120deg, ${colors.heroFrom}, ${colors.heroTo})`,
      }}
    >
      {url ? (
        <>
          <img src={url} alt={image.alt || ""} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: image.fit ?? "cover", objectPosition: `${focal.x}% ${focal.y}%`, pointerEvents: "none" }} />
          <span style={{ position: "absolute", inset: 0, background: v.overlay?.color ?? "#000", opacity: (v.overlay?.opacity ?? 0) / 100, pointerEvents: "none" }} />
        </>
      ) : null}
      <div
        style={{
          position: "relative",
          display: isMobile ? "flex" : "grid",
          gridTemplateColumns: isMobile ? undefined : "minmax(0,1.05fr) minmax(300px,0.95fr)",
          alignItems: "center",
          gap: 40,
          minHeight: v.height,
          maxWidth: layout.contentWidth || undefined,
          margin: "0 auto",
          padding: isMobile ? "56px 20px" : "64px 48px",
        }}
      >
        <div style={{ position: "relative", zIndex: 1, maxWidth: isMobile ? "80%" : 576, alignSelf: "center" }}>
          <div style={isMobile ? { whiteSpace: "nowrap" } : undefined}>
            <TextEl path={elementPath(id, "title")} label="Título" fallbackTag="h1" />
          </div>
          <div style={{ marginTop: 8 }}>
            <TextEl path={elementPath(id, "subtitle")} label="Descrição" />
          </div>
          <div style={{ marginTop: isMobile ? 24 : 32 }}>
            <ButtonEl path={elementPath(id, "button")} label="Botão" />
          </div>
        </div>
        {!url && v.showIllustration ? (
          <div
            aria-hidden
            style={
              isMobile
                ? { position: "absolute", top: 0, bottom: 0, right: 0, width: "44%", display: "flex", alignItems: "center", justifyContent: "flex-end", pointerEvents: "none" }
                : { display: "flex", alignItems: "center", justifyContent: "flex-end", height: "100%", pointerEvents: "none" }
            }
          >
            <HeroIllustration color={colors.secondary} mobile={isMobile} />
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
    <Editable path={cardPath} label="Cartão de produto" style={{ minWidth: 0 }}>
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
                background: colors.badgeBg,
                color: colors.badgeText,
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
            <p style={{ marginTop: 4, fontSize: v.priceSize, fontWeight: 700, color: resolveColor(v.priceColor, colors), margin: v.showName ? "4px 0 0" : 0 }}>
              {formatPrice(product.price, currency)}
            </p>
          ) : null}
        </div>
      </article>
    </Editable>
  );
}

function ProductsSection({ id }: { id: string }) {
  const { v, outer, inner, colors } = useSectionFrame(id);
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
    <SectionShell path={sectionPath(id)} label="Produtos" style={outer}>
      <div style={inner}>
        <TextEl path={elementPath(id, "title")} label="Título" fallbackTag="h2" />
        {list.length === 0 ? (
          <p style={{ opacity: 0.6, fontSize: 14 }}>Nenhum produto para mostrar.</p>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: `repeat(${cols}, minmax(0,1fr))`, columnGap: v.gap, rowGap: Math.round(v.gap * 1.5) }}>
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
        <div style={{ display: "flex", justifyContent: "center", marginTop: 4 }}>
          <ButtonEl path={elementPath(id, "viewAll")} label="Botão explorar mais" />
        </div>
      </div>
    </SectionShell>
  );
}

function WhatsappCtaSection({ id }: { id: string }) {
  const { v, outer, colors } = useSectionFrame(id);
  const { store, device, mode } = useTheme();
  const styleG = useGlobalGroup("style");
  const hasNumber = !!store.whatsapp?.trim();
  if (!hasNumber && mode === "live") return null;
  const mobile = device === "mobile";
  const filled = v.cardStyle !== "border";

  return (
    <SectionShell path={sectionPath(id)} label="Contacto por WhatsApp" style={outer}>
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
  const { v, outer, colors, layout } = useSectionFrame(id);
  const { store, device } = useTheme();
  const policy = useNodeValues(elementPath(id, "policyLinks"));
  const social = useNodeValues(elementPath(id, "socialLinks"));
  const copyright = useNodeValues(elementPath(id, "copyright"));
  const credit = useNodeValues(elementPath(id, "credit"));
  const mobile = device === "mobile";

  const links = [
    policy.shipping ? "Envios e Entregas" : null,
    policy.returns ? "Trocas e Devoluções" : null,
    policy.terms ? "Termos e Privacidade" : null,
  ].filter(Boolean) as string[];

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
    <SectionShell path={sectionPath(id)} label="Rodapé" style={{ ...outer, background: outer.background ?? colors.background }}>
      <div style={{ maxWidth: layout.contentWidth || undefined, margin: "0 auto", borderTop: v.borderTop ? `1px solid ${colors.border}` : undefined, paddingTop: mobile ? 24 : 28 }}>
        <div style={{ display: "grid", gridTemplateColumns: mobile ? "minmax(0,1fr) auto" : "1fr 1fr", gap: mobile ? 12 : 32, alignItems: "start" }}>
          <div>
            <TextEl path={elementPath(id, "heading")} label="Título da coluna" fallbackTag="h2" />
            <Editable path={elementPath(id, "policyLinks")} label="Links de informação" as="ul" style={{ listStyle: "none", margin: "12px 0 0", padding: 0, display: "grid", gap: 6 }}>
              {links.map((l) => (
                <li key={l} style={{ fontSize: 14, color: resolveColor(policy.color, colors) }}>
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
                  <Icon size={social.size} />
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

/* ------------------------------ registry + root ------------------------------ */

const SECTION_COMPONENTS: Record<string, (p: { id: string }) => React.ReactElement | null> = {
  announcement: AnnouncementSection,
  header: HeaderSection,
  hero: HeroSection,
  products: ProductsSection,
  whatsappCta: WhatsappCtaSection,
  footer: FooterSection,
};

/**
 * `only`: se indicado, desenha apenas estas seções (ex.: a miniatura da página
 * "Personalizar loja" mostra só a primeira seção da página). Sem `only`,
 * desenha a página completa.
 */
export function LumeRenderer({ pageId, only }: { pageId: string; only?: string[] }) {
  const { manifest, customization, device } = useTheme();
  const colors = useColors();
  const typo = useGlobalGroup("typography");
  const resp = useGlobalGroup("responsive");
  const ids = visibleSectionIds(manifest, customization, pageId);
  const every = [...ids.top, ...ids.page, ...ids.bottom];
  const all = only ? every.filter((id) => only.includes(id)) : every;
  const fonts = Object.fromEntries(manifest.fonts.map((f) => [f.id, f.family]));
  const scale = device === "mobile" ? (resp.mobileFontScale ?? 100) / 100 : 1;

  const rootStyle = {
    "--sy-color-primary": colors.primary,
    "--sy-color-background": colors.background,
    "--sy-color-text": colors.text,
    "--sy-font-heading": fonts[typo.headingFont],
    "--sy-font-body": fonts[typo.bodyFont],
    background: colors.background,
    color: colors.text,
    fontFamily: fonts[typo.bodyFont],
    fontWeight: typo.bodyWeight,
    fontSize: typo.baseSize * scale,
    lineHeight: typo.lineHeightBody,
  } as CSSProperties;

  return (
    <div className="sy-root" style={rootStyle}>
      <style>{`.sy-root h1,.sy-root h2,.sy-root h3,.sy-root h4{font-family:var(--sy-font-heading);line-height:${typo.lineHeightHeading};letter-spacing:${typo.letterSpacingHeading}em;text-transform:${typo.headingTransform === "none" ? "none" : typo.headingTransform};margin:0}
      .sy-root h1,.sy-root h2,.sy-root h3,.sy-root h4{font-weight:${typo.headingWeight}}
      .sy-root p,.sy-root ul{margin:0}`}</style>
      {all.map((id) => {
        const type = sectionTypeOf(manifest, customization, id);
        const Cmp = type ? SECTION_COMPONENTS[type.type] : undefined;
        if (!Cmp) return null;
        if (customization.sections[id]?.hidden) return null;
        return (
          <Fragment key={id}>
            <Cmp id={id} />
          </Fragment>
        );
      })}
    </div>
  );
}

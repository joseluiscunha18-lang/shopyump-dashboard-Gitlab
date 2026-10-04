import { Fragment, type CSSProperties, type ReactNode } from "react";
import * as Icons from "lucide-react";
import {
  Editable,
  SectionShell,
  useColors,
  useGlobalGroup,
  useNodeValues,
  useTheme,
} from "@/theme-editor/editor/sdk";
import { blockIdsOf, resolveColor, sectionTypeOf } from "@/theme-editor/editor/core/resolve";
import { blockElementPath, blockPath, elementPath, sectionPath } from "@/theme-editor/editor/core/paths";
import type { ProductLite } from "@/theme-editor/editor/contracts/types";

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
    return {
      background: colors.background,
      text: colors.text,
      primary: colors.primary,
      buttonBg: colors.buttonBg,
      buttonText: colors.buttonText,
    };
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

function buttonStyle(v: Record<string, any>, colors: Record<string, string>): CSSProperties {
  const bg = resolveColor(v.bg, colors);
  const fg = resolveColor(v.textColor, colors);
  const pad = v.size === "sm" ? "8px 14px" : v.size === "lg" ? "16px 28px" : "12px 20px";
  const base: CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    padding: pad,
    borderRadius: v.radius,
    fontWeight: v.weight,
    fontSize: v.size === "sm" ? 13 : v.size === "lg" ? 17 : 15,
    textTransform: v.transform && v.transform !== "none" ? v.transform : undefined,
    width: v.width === "full" ? "100%" : undefined,
    justifyContent: v.width === "full" ? "center" : undefined,
    cursor: "default",
  };
  if (v.variant === "outline")
    return { ...base, background: "transparent", color: bg, border: `1px solid ${bg}` };
  if (v.variant === "text")
    return { ...base, background: "transparent", color: bg, padding: "6px 0", textDecoration: "underline" };
  return { ...base, background: bg, color: fg, border: "1px solid transparent" };
}

function shadowOf(preset: string): string | undefined {
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

function contentMaxWidth(key: unknown, globalWidth: number): number | undefined {
  if (key === "full") return undefined;
  if (key === "narrow") return 1100;
  if (key === "wide") return 1440;
  return globalWidth || undefined;
}

/* ------------------------------ atoms ------------------------------ */

function TextEl({ path, label, fallbackTag = "p" }: { path: string; label: string; fallbackTag?: string }) {
  const v = useNodeValues(path);
  const colors = useColors();
  const { manifest } = useTheme();
  const fonts = Object.fromEntries(manifest.fonts.map((f) => [f.id, f.family]));
  if (v.show === false) return null;
  const Tag = (v.htmlTag || fallbackTag) as any;
  return (
    <Editable path={path} label={label} as="div">
      <Tag style={textStyle(v, colors, fonts)}>{v.text}</Tag>
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

function ImageEl({
  path,
  label,
  style,
  fallback,
}: {
  path: string;
  label: string;
  style?: CSSProperties;
  fallback?: string;
}) {
  const v = useNodeValues(path);
  const { media } = useTheme();
  if (v.show === false) return null;
  const url = v.image?.mediaId ? media.find((m) => m.id === v.image.mediaId)?.url : fallback;
  const focal = v.focalPoint ?? { x: 50, y: 50 };
  return (
    <Editable path={path} label={label} style={{ position: "relative", ...style }}>
      {url ? (
        <img
          src={url}
          alt={v.alt || ""}
          style={{
            width: "100%",
            height: "100%",
            display: "block",
            objectFit: v.fit ?? "cover",
            objectPosition: `${focal.x}% ${focal.y}%`,
            aspectRatio: v.aspectRatio && v.aspectRatio !== "auto" ? v.aspectRatio : undefined,
            borderRadius: v.radius,
            opacity: typeof v.opacity === "number" ? v.opacity / 100 : 1,
          }}
        />
      ) : (
        <div
          style={{
            width: "100%",
            aspectRatio: v.aspectRatio && v.aspectRatio !== "auto" ? v.aspectRatio : "4/5",
            background: "#EDEDED",
            display: "grid",
            placeItems: "center",
            borderRadius: v.radius,
            color: "#9A9A9A",
          }}
        >
          <Icons.ImageIcon size={28} />
        </div>
      )}
      {v.overlay?.opacity ? (
        <span
          style={{
            position: "absolute",
            inset: 0,
            background: v.overlay.color,
            opacity: v.overlay.opacity / 100,
            borderRadius: v.radius,
          }}
        />
      ) : null}
    </Editable>
  );
}

/* ------------------------------ sections ------------------------------ */

function useSectionFrame(sectionId: string) {
  const v = useNodeValues(sectionPath(sectionId));
  const layout = useGlobalGroup("layout");
  const scheme = useScheme(v.colorScheme ?? "light");
  const colors = useColors();
  const bg = v.background ? resolveColor(v.background, colors) : scheme.background;
  const outer: CSSProperties = {
    background: bg,
    color: scheme.text,
    paddingTop: v.spacing,
    paddingBottom: v.spacing,
    paddingLeft: v.padding ?? layout.pagePadding,
    paddingRight: v.padding ?? layout.pagePadding,
    borderRadius: v.radius || undefined,
    boxShadow: shadowOf(v.shadow),
    minHeight: v.minHeight || undefined,
  };
  const inner: CSSProperties = {
    maxWidth: contentMaxWidth(v.contentWidth, layout.contentWidth),
    margin: "0 auto",
    textAlign: v.align as CSSProperties["textAlign"],
    display: "flex",
    flexDirection: "column",
    gap: v.gap,
  };
  return { v, outer, inner, scheme, colors, layout };
}

function AnnouncementSection({ id }: { id: string }) {
  const { v, scheme } = useSectionFrame(id);
  const { manifest, customization } = useTheme();
  const ids = blockIdsOf(manifest, customization, id);
  const first = ids[0];
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
      }}
    >
      {first ? <BlockItem sectionId={id} blockId={first} type="announcementMessage" /> : null}
      {ids.length > 1 ? (
        <span style={{ opacity: 0.6, fontSize: 12, marginLeft: 10 }}>+{ids.length - 1}</span>
      ) : null}
    </SectionShell>
  );
}

function HeaderSection({ id }: { id: string }) {
  const { v, scheme, layout } = useSectionFrame(id);
  const { store, device } = useTheme();
  const logo = useNodeValues(elementPath(id, "logo"));
  const menu = useNodeValues(elementPath(id, "menu"));
  const icons = useNodeValues(elementPath(id, "icons"));
  const colors = useColors();
  const isMobile = device === "mobile";
  const menuItems = store.menus[0]?.items ?? [];

  const logoNode = (
    <Editable path={elementPath(id, "logo")} label="Logótipo" as="span" style={{ display: "inline-block" }}>
      <img src={store.logoUrl} alt={store.name} style={{ width: logo.width, display: "block" }} />
    </Editable>
  );

  const menuNode = !isMobile ? (
    <Editable path={elementPath(id, "menu")} label="Menu" as="nav" style={{ display: "flex", gap: menu.spacing }}>
      {menuItems.map((m) => (
        <span
          key={m.label}
          style={{
            fontSize: menu.size,
            fontWeight: menu.weight,
            textTransform: menu.transform !== "none" ? menu.transform : undefined,
            color: resolveColor(menu.color, colors),
          }}
        >
          {m.label}
        </span>
      ))}
    </Editable>
  ) : null;

  const iconsNode = (
    <Editable path={elementPath(id, "icons")} label="Ícones" as="span" style={{ display: "inline-flex", gap: 14, alignItems: "center" }}>
      {isMobile ? <Icons.Menu size={icons.iconSize} /> : null}
      {v.showSearch ? <Icons.Search size={icons.iconSize} /> : null}
      {v.showWishlist ? <Icons.Heart size={icons.iconSize} /> : null}
      {v.showAccount ? <Icons.User size={icons.iconSize} /> : null}
      {v.showCart ? (
        <span style={{ position: "relative", display: "inline-flex" }}>
          <Icons.ShoppingBag size={icons.iconSize} />
          {icons.showCount ? (
            <span
              style={{
                position: "absolute",
                top: -6,
                right: -8,
                background: colors.primary,
                color: colors.background,
                borderRadius: 999,
                fontSize: 10,
                padding: "0 5px",
              }}
            >
              2
            </span>
          ) : null}
        </span>
      ) : null}
    </Editable>
  );

  const centered = v.layout === "logoCenter";
  return (
    <SectionShell
      path={sectionPath(id)}
      label="Cabeçalho"
      style={{
        background: scheme.background,
        color: scheme.text,
        borderBottom: v.borderBottom ? `1px solid ${colors.border}` : undefined,
        padding: `0 ${v.padding ?? layout.pagePadding}px`,
      }}
    >
      <div
        style={{
          minHeight: v.height,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 16,
          maxWidth: contentMaxWidth(v.contentWidth, layout.contentWidth),
          margin: "0 auto",
        }}
      >
        {centered ? (
          <>
            <span style={{ flex: 1, display: "flex", gap: 14 }}>{isMobile ? <Icons.Menu size={icons.iconSize} /> : menuNode}</span>
            <span style={{ flex: "0 0 auto" }}>{logoNode}</span>
            <span style={{ flex: 1, display: "flex", justifyContent: "flex-end" }}>{iconsNode}</span>
          </>
        ) : (
          <>
            {logoNode}
            {menuNode}
            {iconsNode}
          </>
        )}
      </div>
      {v.layout === "menuBelow" && !isMobile ? (
        <div style={{ paddingBottom: 10, display: "flex", justifyContent: "center" }}>{menuNode}</div>
      ) : null}
      {v.showStoreName ? <div style={{ paddingBottom: 8, fontSize: 13, opacity: 0.7 }}>{store.name}</div> : null}
    </SectionShell>
  );
}

function HeroSection({ id }: { id: string }) {
  const { v, scheme, layout } = useSectionFrame(id);
  const { manifest, customization, media } = useTheme();
  const ids = blockIdsOf(manifest, customization, id).filter(
    (b) => !customization.sections[id]?.blocks?.items?.[b]?.hidden,
  );
  const slideId = ids[0];
  const slideImage = useNodeValues(blockElementPath(id, slideId ?? "x", "image"));
  const url = slideImage?.image?.mediaId
    ? media.find((m) => m.id === slideImage.image.mediaId)?.url
    : media[0]?.url;

  const justify = v.hAlign === "center" ? "center" : v.hAlign === "right" ? "flex-end" : "flex-start";
  const align = v.vAlign === "top" ? "flex-start" : v.vAlign === "bottom" ? "flex-end" : "center";

  return (
    <SectionShell
      path={sectionPath(id)}
      label="Banner principal"
      style={{
        position: "relative",
        minHeight: v.height,
        display: "flex",
        alignItems: align,
        justifyContent: justify,
        padding: v.padding ?? layout.pagePadding,
        background: scheme.background,
        overflow: "hidden",
      }}
    >
      {url && slideId ? (
        <img src={url} alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", pointerEvents: "none" }} />
      ) : null}
      <span style={{ position: "absolute", inset: 0, background: v.overlay?.color ?? "#000", opacity: (v.overlay?.opacity ?? 0) / 100, pointerEvents: "none" }} />
      {slideId ? (
        <HeroSlideWrap
          multi={ids.length > 1}
          path={blockPath(id, slideId)}
          style={{
            position: "relative",
            maxWidth: contentMaxWidth(v.contentWidth, layout.contentWidth),
            width: "100%",
            display: "flex",
            flexDirection: "column",
            alignItems: v.hAlign === "center" ? "center" : v.hAlign === "right" ? "flex-end" : "flex-start",
            textAlign: v.hAlign,
            gap: 8,
          }}
        >
          <TextEl path={blockElementPath(id, slideId, "eyebrow")} label="Sobretítulo" />
          <TextEl path={blockElementPath(id, slideId, "title")} label="Título" fallbackTag="h1" />
          <TextEl path={blockElementPath(id, slideId, "description")} label="Descrição" />
          <div style={{ display: "flex", gap: 10, marginTop: 8, flexWrap: "wrap" }}>
            <ButtonEl path={blockElementPath(id, slideId, "button1")} label="Botão principal" />
            <ButtonEl path={blockElementPath(id, slideId, "button2")} label="Botão secundário" />
          </div>
        </HeroSlideWrap>
      ) : null}
      {ids.length > 1 && v.showDots ? (
        <span style={{ position: "absolute", bottom: 14, left: "50%", transform: "translateX(-50%)", display: "flex", gap: 6 }}>
          {ids.map((b, i) => (
            <span key={b} style={{ width: 7, height: 7, borderRadius: 99, background: "#fff", opacity: i === 0 ? 1 : 0.5 }} />
          ))}
        </span>
      ) : null}
    </SectionShell>
  );
}

function CategoriesSection({ id }: { id: string }) {
  const { v, outer, inner, colors } = useSectionFrame(id);
  const { categories, device } = useTheme();
  const itemLabel = useNodeValues(elementPath(id, "itemLabel"));
  const picked: string[] = v.picked ?? [];
  const list = (v.source === "manual" && picked.length
    ? picked.map((pid) => categories.find((c) => c.id === pid)).filter(Boolean)
    : categories
  ).slice(0, v.maxItems) as typeof categories;
  const cols = v.columns ?? 3;

  return (
    <SectionShell path={sectionPath(id)} label="Categorias" style={outer}>
      <div style={inner}>
        <TextEl path={elementPath(id, "title")} label="Título" fallbackTag="h2" />
        <TextEl path={elementPath(id, "subtitle")} label="Subtítulo" />
        <div
          style={{
            display: v.layout === "list" ? "flex" : "grid",
            flexDirection: "column",
            gridTemplateColumns: `repeat(${cols}, minmax(0,1fr))`,
            gap: v.gap,
            overflowX: v.layout === "carousel" ? "auto" : undefined,
            gridAutoFlow: v.layout === "carousel" ? "column" : undefined,
            gridAutoColumns: v.layout === "carousel" ? `calc(${100 / cols}% - ${v.gap}px)` : undefined,
          }}
        >
          {list.map((c) => (
            <div key={c.id} style={{ position: "relative", textAlign: "center" }}>
              <img
                src={c.image}
                alt={c.name}
                style={{ width: "100%", aspectRatio: "1/1", objectFit: "cover", borderRadius: 8, display: "block" }}
              />
              {v.titlePlacement !== "hidden" ? (
                <Editable path={elementPath(id, "itemLabel")} label="Nome da categoria" as="span">
                  <span
                    style={{
                      display: "block",
                      marginTop: v.titlePlacement === "over" ? 0 : 8,
                      position: v.titlePlacement === "over" ? "absolute" : "static",
                      inset: v.titlePlacement === "over" ? 0 : undefined,
                      alignItems: "center",
                      justifyContent: "center",
                      color: v.titlePlacement === "over" ? "#fff" : resolveColor(itemLabel.color, colors),
                      fontSize: itemLabel.size,
                      fontWeight: itemLabel.weight,
                      textShadow: v.titlePlacement === "over" ? "0 1px 8px rgba(0,0,0,.5)" : undefined,
                      ...(v.titlePlacement === "over" ? { display: "flex" } : {}),
                    }}
                  >
                    {c.name}
                    {v.showCount ? <small style={{ opacity: 0.7 }}> · {c.productCount}</small> : null}
                  </span>
                </Editable>
              ) : null}
            </div>
          ))}
        </div>
        <div style={{ marginTop: 8 }}>
          <ButtonEl path={elementPath(id, "viewAll")} label="Botão ver todas" />
        </div>
      </div>
    </SectionShell>
  );
}

function ProductCard({ product, cardPath, v, colors }: { product: ProductLite; cardPath: string; v: Record<string, any>; colors: Record<string, string> }) {
  return (
    <Editable path={cardPath} label="Cartão de produto">
      <div
        style={{
          background: resolveColor(v.cardBg, colors),
          border: v.cardBorder ? `${v.cardBorder}px solid ${colors.border}` : undefined,
          borderRadius: v.cardRadius,
          boxShadow: shadowOf(v.cardShadow),
          padding: v.cardPadding,
          textAlign: v.align,
          overflow: "hidden",
          position: "relative",
        }}
      >
        {v.showImage ? (
          product.images[0] ? (
            <img
              src={product.images[0]}
              alt={product.name}
              style={{ width: "100%", aspectRatio: v.aspectRatio, objectFit: "cover", display: "block", borderRadius: v.cardPadding ? v.cardRadius : undefined }}
            />
          ) : (
            <div style={{ width: "100%", aspectRatio: v.aspectRatio, background: "#EDEDED", display: "grid", placeItems: "center", color: "#9A9A9A" }}>
              <Icons.ImageIcon size={24} />
            </div>
          )
        ) : null}
        {v.showBadge && product.badge ? (
          <span style={{ position: "absolute", top: 8, left: 8, background: colors.badgeBg, color: colors.badgeText, fontSize: 11, padding: "2px 7px", borderRadius: 4 }}>
            {product.badge}
          </span>
        ) : null}
        {v.showWishlist ? (
          <span style={{ position: "absolute", top: 8, right: 8, color: "#fff", filter: "drop-shadow(0 1px 3px rgba(0,0,0,.4))" }}>
            <Icons.Heart size={18} />
          </span>
        ) : null}
        <div style={{ display: "flex", flexDirection: "column", gap: v.textGap, paddingTop: 8, paddingInline: v.cardPadding ? 0 : undefined }}>
          {v.showName ? (
            <span
              style={{
                fontSize: v.nameSize,
                display: v.nameLines ? "-webkit-box" : undefined,
                WebkitLineClamp: v.nameLines || undefined,
                WebkitBoxOrient: "vertical",
                overflow: v.nameLines ? "hidden" : undefined,
              }}
            >
              {product.name}
            </span>
          ) : null}
          {v.showPrice ? (
            <span style={{ display: "flex", gap: 8, justifyContent: v.align === "center" ? "center" : undefined, alignItems: "baseline" }}>
              <strong style={{ fontSize: v.priceSize, color: resolveColor(v.priceColor, colors) }}>
                {product.price.toFixed(2)} €
              </strong>
              {v.showComparePrice && product.comparePrice ? (
                <s style={{ fontSize: v.priceSize - 3, color: colors.comparePrice }}>{product.comparePrice.toFixed(2)} €</s>
              ) : null}
            </span>
          ) : null}
          {v.showAddToCart ? (
            <span style={{ marginTop: 6, border: `1px solid ${colors.primary}`, borderRadius: 6, padding: "7px 10px", fontSize: 13, textAlign: "center" }}>
              Adicionar
            </span>
          ) : null}
        </div>
      </div>
    </Editable>
  );
}

function ProductsSection({ id }: { id: string }) {
  const { v, outer, inner, colors } = useSectionFrame(id);
  const { products } = useTheme();
  const card = useNodeValues(elementPath(id, "productCard"));
  let list = products;
  if (v.mode === "category") list = products.filter((p) => p.categoryId === v.category);
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
        <TextEl path={elementPath(id, "subtitle")} label="Subtítulo" />
        {list.length === 0 ? (
          <p style={{ opacity: 0.6, fontSize: 14 }}>Nenhum produto para mostrar.</p>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: v.layout === "carousel" ? undefined : `repeat(${cols}, minmax(0,1fr))`,
              gridAutoFlow: v.layout === "carousel" ? "column" : undefined,
              gridAutoColumns: v.layout === "carousel" ? `calc(${100 / cols}% - ${v.gap}px)` : undefined,
              overflowX: v.layout === "carousel" ? "auto" : undefined,
              gap: v.gap,
            }}
          >
            {list.map((p) => (
              <ProductCard key={p.id} product={p} cardPath={elementPath(id, "productCard")} v={card} colors={colors} />
            ))}
          </div>
        )}
        <div style={{ marginTop: 8 }}>
          <ButtonEl path={elementPath(id, "viewAll")} label="Botão ver todos" />
        </div>
      </div>
    </SectionShell>
  );
}

function ImageTextSection({ id }: { id: string }) {
  const { v, outer, inner } = useSectionFrame(id);
  const { device } = useTheme();
  const stacked = device === "mobile";
  const imageFirst = stacked ? v.mobileOrder !== "textFirst" : v.imagePosition === "left";
  const imgW = `${v.imageWidth}%`;

  const imageNode = (
    <div style={{ flex: stacked ? "1 1 auto" : `0 0 ${imgW}` }}>
      <ImageEl path={elementPath(id, "image")} label="Imagem" />
    </div>
  );
  const textNode = (
    <div style={{ flex: "1 1 0", display: "flex", flexDirection: "column", gap: 6, justifyContent: v.vAlign === "top" ? "flex-start" : v.vAlign === "bottom" ? "flex-end" : "center" }}>
      <TextEl path={elementPath(id, "eyebrow")} label="Sobretítulo" />
      <TextEl path={elementPath(id, "title")} label="Título" fallbackTag="h2" />
      <TextEl path={elementPath(id, "description")} label="Descrição" />
      <div style={{ marginTop: 8 }}>
        <ButtonEl path={elementPath(id, "button")} label="Botão" />
      </div>
    </div>
  );

  return (
    <SectionShell path={sectionPath(id)} label="Imagem + texto" style={outer}>
      <div style={{ ...inner, flexDirection: stacked ? "column" : "row", alignItems: "stretch" }}>
        {imageFirst ? (
          <>
            {imageNode}
            {textNode}
          </>
        ) : (
          <>
            {textNode}
            {imageNode}
          </>
        )}
      </div>
    </SectionShell>
  );
}

function BlockItem({ sectionId, blockId, type }: { sectionId: string; blockId: string; type: string }) {
  const { manifest, customization, device } = useTheme();
  const colors = useColors();
  const hidden = customization.sections[sectionId]?.blocks?.items?.[blockId]?.hidden;
  const iconVals = useNodeValues(blockElementPath(sectionId, blockId, "icon"));
  if (hidden) return null;

  if (type === "announcementMessage")
    return <TextEl path={blockElementPath(sectionId, blockId, "message")} label="Mensagem" fallbackTag="span" />;

  if (type === "benefit")
    return (
      <Editable path={blockPath(sectionId, blockId)} label="Benefício">
        <div style={{ display: "flex", flexDirection: "column", gap: 6, alignItems: "inherit" }}>
          <Editable path={blockElementPath(sectionId, blockId, "icon")} label="Ícone" as="span">
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                width: iconVals.style === "plain" ? undefined : iconVals.size * 2,
                height: iconVals.style === "plain" ? undefined : iconVals.size * 2,
                background: iconVals.style === "plain" ? undefined : resolveColor(iconVals.bg, colors),
                borderRadius: iconVals.style === "circle" ? 999 : iconVals.style === "square" ? 10 : 0,
                color: resolveColor(iconVals.color, colors),
              }}
            >
              <LucideIcon name={iconVals.icon} size={iconVals.size} strokeWidth={iconVals.stroke} />
            </span>
          </Editable>
          <TextEl path={blockElementPath(sectionId, blockId, "title")} label="Título" fallbackTag="h3" />
          <TextEl path={blockElementPath(sectionId, blockId, "description")} label="Descrição" />
        </div>
      </Editable>
    );

  if (type === "faqItem")
    return (
      <Editable path={blockPath(sectionId, blockId)} label="Pergunta">
        <div style={{ borderBottom: `1px solid ${colors.border}`, padding: "12px 0", textAlign: "left" }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" }}>
            <TextEl path={blockElementPath(sectionId, blockId, "question")} label="Pergunta" fallbackTag="h3" />
            <Icons.Plus size={16} />
          </div>
          <TextEl path={blockElementPath(sectionId, blockId, "answer")} label="Resposta" />
        </div>
      </Editable>
    );

  if (type === "footerColumn")
    return (
      <Editable path={blockPath(sectionId, blockId)} label="Coluna">
        <div style={{ display: "flex", flexDirection: "column", gap: 6, textAlign: "left" }}>
          <TextEl path={blockElementPath(sectionId, blockId, "title")} label="Título" fallbackTag="h4" />
          <FooterMenu sectionId={sectionId} blockId={blockId} />
        </div>
      </Editable>
    );

  if (type === "heroSlide") return null;
  return null;
}

function FooterMenu({ sectionId, blockId }: { sectionId: string; blockId: string }) {
  const v = useNodeValues(blockElementPath(sectionId, blockId, "menu"));
  const { store } = useTheme();
  const menu = store.menus.find((m) => m.id === v.menuId) ?? store.menus[0];
  return (
    <Editable path={blockElementPath(sectionId, blockId, "menu")} label="Menu" as="div">
      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        {menu.items.map((i) => (
          <span key={i.label} style={{ fontSize: v.size, color: v.color }}>
            {i.label}
          </span>
        ))}
      </div>
    </Editable>
  );
}

function BenefitsSection({ id }: { id: string }) {
  const { v, outer, inner, colors } = useSectionFrame(id);
  const { manifest, customization } = useTheme();
  const ids = blockIdsOf(manifest, customization, id);
  const cols = v.layout === "list" ? 1 : (v.columns ?? 3);
  return (
    <SectionShell path={sectionPath(id)} label="Benefícios" style={outer}>
      <div style={inner}>
        <TextEl path={elementPath(id, "title")} label="Título" fallbackTag="h2" />
        <div style={{ display: "grid", gridTemplateColumns: `repeat(${cols}, minmax(0,1fr))`, gap: v.gap }}>
          {ids.map((b) => (
            <div
              key={b}
              style={{
                border: v.itemStyle === "border" ? `1px solid ${colors.border}` : undefined,
                background: v.itemStyle === "filled" ? colors.surfaceAlt : undefined,
                borderRadius: v.itemStyle === "plain" ? 0 : 10,
                padding: v.itemStyle === "plain" ? 0 : 16,
              }}
            >
              <BlockItem sectionId={id} blockId={b} type="benefit" />
            </div>
          ))}
        </div>
      </div>
    </SectionShell>
  );
}

function FaqSection({ id }: { id: string }) {
  const { outer, inner } = useSectionFrame(id);
  const { manifest, customization } = useTheme();
  const ids = blockIdsOf(manifest, customization, id);
  return (
    <SectionShell path={sectionPath(id)} label="Perguntas frequentes" style={outer}>
      <div style={inner}>
        <TextEl path={elementPath(id, "title")} label="Título" fallbackTag="h2" />
        {ids.map((b) => (
          <BlockItem key={b} sectionId={id} blockId={b} type="faqItem" />
        ))}
      </div>
    </SectionShell>
  );
}

function RichTextSection({ id }: { id: string }) {
  const { outer, inner } = useSectionFrame(id);
  return (
    <SectionShell path={sectionPath(id)} label="Texto" style={outer}>
      <div style={inner}>
        <TextEl path={elementPath(id, "title")} label="Título" fallbackTag="h2" />
        <TextEl path={elementPath(id, "text")} label="Texto" />
        <ButtonEl path={elementPath(id, "button")} label="Botão" />
      </div>
    </SectionShell>
  );
}

function PromoBannerSection({ id }: { id: string }) {
  const { v, layout } = useSectionFrame(id);
  const { media } = useTheme();
  const image = useNodeValues(elementPath(id, "image"));
  const url = image.image?.mediaId ? media.find((m) => m.id === image.image.mediaId)?.url : media[1]?.url;
  return (
    <SectionShell
      path={sectionPath(id)}
      label="Banner promocional"
      style={{
        position: "relative",
        minHeight: v.height,
        display: "flex",
        alignItems: v.vAlign === "top" ? "flex-start" : v.vAlign === "bottom" ? "flex-end" : "center",
        justifyContent: v.hAlign === "left" ? "flex-start" : v.hAlign === "right" ? "flex-end" : "center",
        padding: v.padding ?? layout.pagePadding,
        overflow: "hidden",
      }}
    >
      {url ? <img src={url} alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} /> : null}
      <span style={{ position: "absolute", inset: 0, background: v.overlay?.color ?? "#000", opacity: (v.overlay?.opacity ?? 0) / 100 }} />
      <div style={{ position: "relative", textAlign: v.hAlign, display: "flex", flexDirection: "column", gap: 8, alignItems: v.hAlign === "center" ? "center" : "flex-start" }}>
        <TextEl path={elementPath(id, "title")} label="Título" fallbackTag="h2" />
        <TextEl path={elementPath(id, "description")} label="Descrição" />
        <ButtonEl path={elementPath(id, "button")} label="Botão" />
      </div>
    </SectionShell>
  );
}

function FooterSection({ id }: { id: string }) {
  const { v, outer, inner, scheme, colors } = useSectionFrame(id);
  const { manifest, customization, store, device } = useTheme();
  const ids = blockIdsOf(manifest, customization, id);
  const social = useNodeValues(elementPath(id, "socialLinks"));
  const policies = useNodeValues(elementPath(id, "policyLinks"));
  const contacts = useNodeValues(elementPath(id, "contacts"));
  const newsletter = useNodeValues(elementPath(id, "newsletter"));
  const cols = device === "mobile" ? 1 : ids.length + 1;

  const socialIcons: [string, string][] = [
    ["instagram", "instagram"],
    ["facebook", "facebook"],
    ["tiktok", "music"],
    ["whatsapp", "message-circle"],
    ["youtube", "youtube"],
  ];
  const policyLabels: Record<string, string> = {
    returns: "Devoluções",
    privacy: "Privacidade",
    terms: "Termos",
    shipping: "Envio",
  };

  return (
    <SectionShell path={sectionPath(id)} label="Rodapé" style={{ ...outer, borderTop: v.borderTop ? `1px solid ${colors.border}` : undefined }}>
      <div style={{ ...inner, textAlign: "left" }}>
        <div style={{ display: "grid", gridTemplateColumns: `repeat(${cols}, minmax(0,1fr))`, gap: v.gap }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <strong style={{ fontSize: 18 }}>{store.name}</strong>
            <Editable path={elementPath(id, "description")} label="Descrição da loja" as="div">
              <p style={{ fontSize: 14, color: "#C9C9C9" }}>{store.description}</p>
            </Editable>
            <Editable path={elementPath(id, "contacts")} label="Contactos" as="div">
              <div style={{ display: "flex", flexDirection: "column", gap: 3, fontSize: 13, color: "#C9C9C9" }}>
                {contacts.email ? <span>{store.email}</span> : null}
                {contacts.phone ? <span>{store.phone}</span> : null}
                {contacts.address ? <span>{store.address}</span> : null}
                {contacts.hours ? <span>{store.hours}</span> : null}
              </div>
            </Editable>
            <Editable path={elementPath(id, "socialLinks")} label="Redes sociais" as="div">
              <div style={{ display: "flex", gap: 10 }}>
                {socialIcons
                  .filter(([k]) => social[k])
                  .map(([k, icon]) => (
                    <span
                      key={k}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        width: social.style === "plain" ? undefined : social.size * 1.9,
                        height: social.style === "plain" ? undefined : social.size * 1.9,
                        borderRadius: social.style === "circle" ? 999 : social.style === "square" ? 8 : 0,
                        border: social.style === "plain" ? undefined : `1px solid ${social.color}`,
                        color: social.color,
                      }}
                    >
                      <LucideIcon name={icon} size={social.size} />
                    </span>
                  ))}
              </div>
            </Editable>
          </div>
          {ids.map((b) => (
            <BlockItem key={b} sectionId={id} blockId={b} type="footerColumn" />
          ))}
        </div>

        {newsletter.show ? (
          <Editable path={elementPath(id, "newsletter")} label="Newsletter" as="div">
            <div style={{ marginTop: 20, display: "flex", flexDirection: "column", gap: 8, maxWidth: 380 }}>
              <strong style={{ fontSize: 15 }}>{newsletter.title}</strong>
              <div style={{ display: "flex", gap: 8 }}>
                <span style={{ flex: 1, border: `1px solid ${scheme.text}40`, borderRadius: 6, padding: "9px 12px", fontSize: 13, color: "#9A9A9A" }}>
                  {newsletter.placeholder}
                </span>
                <span style={{ background: scheme.buttonBg, color: scheme.buttonText, borderRadius: 6, padding: "9px 14px", fontSize: 13 }}>
                  {newsletter.submitLabel}
                </span>
              </div>
            </div>
          </Editable>
        ) : null}

        {v.bottomBar ? (
          <div style={{ marginTop: 24, paddingTop: 14, borderTop: `1px solid ${scheme.text}22`, display: "flex", flexWrap: "wrap", gap: 12, justifyContent: "space-between", alignItems: "center" }}>
            <Editable path={elementPath(id, "policyLinks")} label="Políticas" as="div">
              <div style={{ display: "flex", gap: 14, flexWrap: "wrap", fontSize: 13, color: "#C9C9C9" }}>
                {Object.keys(policyLabels)
                  .filter((k) => policies[k])
                  .map((k) => (
                    <span key={k}>{policyLabels[k]}</span>
                  ))}
              </div>
            </Editable>
            <TextEl path={elementPath(id, "copyright")} label="Direitos de autor" fallbackTag="span" />
          </div>
        ) : null}
      </div>
    </SectionShell>
  );
}

const SECTION_COMPONENTS: Record<string, (p: { id: string }) => React.ReactElement | null> = {
  announcement: AnnouncementSection,
  header: HeaderSection,
  hero: HeroSection,
  categories: CategoriesSection,
  products: ProductsSection,
  imageText: ImageTextSection,
  benefits: BenefitsSection,
  faq: FaqSection,
  richText: RichTextSection,
  promoBanner: PromoBannerSection,
  footer: FooterSection,
};

export function visibleSectionIds(
  manifest: Parameters<typeof sectionTypeOf>[0],
  customization: Parameters<typeof sectionTypeOf>[1],
  pageId: string,
): { top: string[]; page: string[]; bottom: string[] } {
  const page = manifest.pages.find((p) => p.id === pageId);
  if (!page) return { top: [], page: [], bottom: [] };
  const override = customization.structure.pages[pageId];
  const order = override?.order ?? page.sections.map((s) => s.id);
  const removed = new Set(override?.removed ?? []);
  return {
    top: page.topSections.filter((id) => !removed.has(id)),
    page: order.filter((id) => !removed.has(id)),
    bottom: page.bottomSections.filter((id) => !removed.has(id)),
  };
}

export function DemoCommerceRenderer({ pageId }: { pageId: string }) {
  const { manifest, customization, device } = useTheme();
  const colors = useColors();
  const typo = useGlobalGroup("typography");
  const ids = visibleSectionIds(manifest, customization, pageId);
  const all = [...ids.top, ...ids.page, ...ids.bottom];
  const fonts = Object.fromEntries(manifest.fonts.map((f) => [f.id, f.family]));

  const rootStyle = {
    "--sy-color-primary": colors.primary,
    "--sy-color-background": colors.background,
    "--sy-color-text": colors.text,
    "--sy-font-heading": fonts[typo.headingFont],
    "--sy-font-body": fonts[typo.bodyFont],
    background: colors.background,
    color: colors.text,
    fontFamily: fonts[typo.bodyFont],
    fontSize: typo.baseSize,
    lineHeight: typo.lineHeightBody,
  } as CSSProperties;

  return (
    <div className="sy-root" style={rootStyle}>
      <style>{`.sy-root h1,.sy-root h2,.sy-root h3,.sy-root h4{font-family:var(--sy-font-heading);font-weight:${typo.headingWeight};line-height:${typo.lineHeightHeading};letter-spacing:${typo.letterSpacingHeading}em;text-transform:${typo.headingTransform === "none" ? "none" : typo.headingTransform};margin:0}
      .sy-root p{margin:0}`}</style>
      {all.map((id) => {
        const type = sectionTypeOf(manifest, customization, id);
        const Cmp = type ? SECTION_COMPONENTS[type.type] : undefined;
        if (!Cmp) return null;
        const hidden = customization.sections[id]?.hidden;
        const visibility = undefined;
        if (hidden) return null;
        return <Fragment key={id}>{<Cmp id={id} />}</Fragment>;
      })}
    </div>
  );
}

/** Fundo do banner não é um objeto: com 1 slide o toque cai na secção; com 2+ seleciona o slide. */
function HeroSlideWrap({ multi, path, style, children }: { multi: boolean; path: string; style: CSSProperties; children: ReactNode }) {
  if (multi) return <Editable path={path} label="Slide" style={style}>{children}</Editable>;
  return <div style={style}>{children}</div>;
}

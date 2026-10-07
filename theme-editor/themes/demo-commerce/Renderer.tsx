import { Fragment, type CSSProperties, type ReactNode } from "react";
import * as Icons from "lucide-react";
import {
  Editable,
  FixedShell,
  OverlayShell,
  SectionShell,
  useColors,
  useGlobalGroup,
  useNodeValues,
  useTheme,
  useEditorPreview,
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
  const menu = useNodeValues(elementPath(id, "nav"));
  const colors = useColors();
  const isMobile = device === "mobile";
  const menuItems = store.menus[0]?.items ?? [];

  const logoNode = (
    <Editable path={elementPath(id, "logo")} label="Logótipo" as="span" style={{ display: "inline-block" }}>
      <img src={store.logoUrl} alt={store.name} style={{ width: logo.width, display: "block" }} />
    </Editable>
  );

  const menuNode = !isMobile ? (
    <Editable path={elementPath(id, "nav")} label="Links do menu" as="nav" style={{ display: "flex", gap: menu.spacing }}>
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

  const caps = useTheme().manifest.capabilities;
  const iconsNode = (
    <span style={{ display: "inline-flex", gap: 14, alignItems: "center" }}>
      {caps.search ? <HeaderIcon sectionId={id} el="search" label="Pesquisa" /> : null}
      {caps.wishlist ? <HeaderIcon sectionId={id} el="wishlist" label="Favoritos" /> : null}
      {caps.account ? <HeaderIcon sectionId={id} el="account" label="Conta" /> : null}
      {caps.cart ? <HeaderIcon sectionId={id} el="cart" label="Carrinho" badge={2} /> : null}
    </span>
  );
  const menuIcon = caps.sideMenu ? <HeaderIcon sectionId={id} el="menu" label="Menu lateral" /> : null;

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
            <span style={{ flex: 1, display: "flex", gap: 14, alignItems: "center" }}>{isMobile ? menuIcon : menuNode}</span>
            <span style={{ flex: "0 0 auto" }}>{logoNode}</span>
            <span style={{ flex: 1, display: "flex", justifyContent: "flex-end" }}>{iconsNode}</span>
          </>
        ) : (
          <>
            <span style={{ display: "inline-flex", gap: 12, alignItems: "center" }}>{isMobile ? menuIcon : null}{logoNode}</span>
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
    <Editable path={cardPath} label="Cartão de produto" openContext={{ productId: product.id }}>
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
  bottomNav: BottomNavSection,
  sideMenu: SideMenuSection,
  pageHeading: PageHeadingSection,
  emptyState: EmptyStateSection,
  collectionToolbar: CollectionToolbarSection,
  searchBar: SearchBarSection,
  searchResults: SearchResultsSection,
  wishlistGrid: WishlistGridSection,
  cartItems: CartItemsSection,
  cartSummary: CartSummarySection,
  accountPanel: AccountPanelSection,
  contentBlock: ContentBlockSection,
  contactChannels: ContactChannelsSection,
  contactForm: ContactFormSection,
  productGallery: ProductGallerySection,
  productInfo: ProductInfoSection,
  productDescription: ProductDescriptionSection,
};

export function visibleSectionIds(
  manifest: Parameters<typeof sectionTypeOf>[0],
  customization: Parameters<typeof sectionTypeOf>[1],
  pageId: string,
): { top: string[]; page: string[]; bottom: string[]; fixed: string[] } {
  const page = manifest.pages.find((p) => p.id === pageId);
  if (!page) return { top: [], page: [], bottom: [], fixed: [] };
  const ok = (id: string) => {
    const t = sectionTypeOf(manifest, customization, id);
    return !t?.requires || !!manifest.capabilities[t.requires];
  };
  const override = customization.structure.pages[pageId];
  const order = override?.order ?? page.sections.map((s) => s.id);
  const removed = new Set(override?.removed ?? []);
  return {
    top: page.topSections.filter((id) => !removed.has(id) && ok(id)),
    page: order.filter((id) => !removed.has(id) && ok(id)),
    bottom: page.bottomSections.filter((id) => !removed.has(id) && ok(id)),
    fixed: (page.fixedSections ?? []).filter((id) => !removed.has(id) && ok(id)),
  };
}

export function DemoCommerceRenderer({ pageId }: { pageId: string }) {
  const { manifest, customization, device, previewState } = useTheme();
  const preview = useEditorPreview();
  const colors = useColors();
  const typo = useGlobalGroup("typography");
  const ids = visibleSectionIds(manifest, customization, pageId);
  const all = [...ids.top, ...ids.page, ...ids.bottom];
  const isEmpty = previewState === "empty";
  const overlays = (manifest.overlays ?? []).filter((o) => !o.requires || manifest.capabilities[o.requires]);
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
    position: preview.pinFixedSections ? "relative" : undefined,
    paddingBottom: preview.pinFixedSections ? preview.fixedHeight : undefined,
    minHeight: preview.pinFixedSections ? preview.viewportH : undefined,
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
        if (hidden) return null;
        // Estados vazios só no estado "vazio"; listas só no estado "com itens".
        if (type!.type === "emptyState" && !isEmpty) return null;
        if (isEmpty && ["wishlistGrid", "cartItems", "cartSummary", "searchResults"].includes(type!.type)) return null;
        return <Fragment key={id}>{<Cmp id={id} />}</Fragment>;
      })}
      {ids.fixed.map((id) => {
        if (customization.sections[id]?.hidden) return null;
        const type = sectionTypeOf(manifest, customization, id);
        const Cmp = type ? SECTION_COMPONENTS[type.type] : undefined;
        return Cmp ? <Fragment key={id}><Cmp id={id} /></Fragment> : null;
      })}
      {overlays.map((o) => <OverlayHost key={o.id} overlayId={o.id} />)}
    </div>
  );
}

/** Fundo do banner não é um objeto: com 1 slide o toque cai na secção; com 2+ seleciona o slide. */
function HeroSlideWrap({ multi, path, style, children }: { multi: boolean; path: string; style: CSSProperties; children: ReactNode }) {
  if (multi) return <Editable path={path} label="Slide" style={style}>{children}</Editable>;
  return <div style={style}>{children}</div>;
}

/* ============================ Extensão V1 ============================ */

const INFO_TEXT: Record<string, string> = {
  aboutContent: "Somos uma pequena loja dedicada a peças simples e duradouras. Escolhemos cada artigo com cuidado e enviamos para todo o país.",
  shippingContent: "As encomendas são enviadas em 24 a 48 horas úteis. A entrega demora normalmente entre 3 e 5 dias úteis.",
  returnsContent: "Tem 14 dias para devolver qualquer artigo em bom estado. Contacte-nos e indicamos os passos.",
  termsContent: "Ao comprar na nossa loja aceita estes termos. Os preços incluem IVA. Reservamo-nos o direito de atualizar estas condições.",
};
const HEADING_DEFAULTS: Record<string, string> = {
  collectionHeading: "Coleção", wishlistHeading: "Favoritos", cartHeading: "Carrinho", accountHeading: "A minha conta",
  aboutHeading: "Sobre nós", shippingHeading: "Entregas", returnsHeading: "Devoluções", termsHeading: "Termos e condições", contactHeading: "Contacto",
};

function HeaderIcon({ sectionId, el, label, badge }: { sectionId: string; el: string; label: string; badge?: number }) {
  const v = useNodeValues(elementPath(sectionId, el));
  const colors = useColors();
  if (v.show === false) return null;
  return (
    <Editable path={elementPath(sectionId, el)} label={label} as="span" style={{ display: "inline-flex", position: "relative", color: resolveColor(v.color, colors) }}>
      <LucideIcon name={v.icon ?? "circle"} size={v.size ?? 20} strokeWidth={v.stroke ?? 1.75} />
      {badge && v.showBadge !== false ? (
        <span style={{ position: "absolute", top: -6, right: -8, background: colors.primary, color: colors.background, borderRadius: 999, fontSize: 10, padding: "0 5px" }}>{badge}</span>
      ) : null}
    </Editable>
  );
}

function themePageOf(link: any): string | undefined {
  return link?.type === "themePage" ? link.value : link?.type === "home" ? "home" : undefined;
}

function BottomNavSection({ id }: { id: string }) {
  const v = useNodeValues(sectionPath(id));
  const colors = useColors();
  const { device, manifest, onNavigateLink } = useTheme();
  const vis = v.visibility ?? { desktop: false, tablet: true, mobile: true };
  if (vis[device] === false) return null;
  const items = ((v.items ?? []) as any[]).filter((i) => !i.hidden);
  const active = 0;
  const floating = v.style === "floating";
  return (
    <FixedShell path={sectionPath(id)} label="Barra inferior" style={{ padding: floating ? 10 : 0, pointerEvents: "auto" }}>
      <nav
        style={{
          display: "flex", justifyContent: "space-around", alignItems: "center",
          background: resolveColor(v.bg, colors), padding: v.padding,
          borderTop: !floating && v.border ? `${v.border}px solid ${colors.border}` : undefined,
          border: floating && v.border ? `${v.border}px solid ${colors.border}` : undefined,
          borderRadius: floating ? v.radius : 0, boxShadow: shadowOf(v.shadow),
        }}
      >
        {items.map((it, i) => {
          const isActive = i === active;
          const color = resolveColor(isActive ? v.activeColor : v.inactiveColor, colors);
          const isCart = themePageOf(it.link) === "cart";
          return (
            <span key={it.id} onClickCapture={() => onNavigateLink?.(it.link)} style={{ display: "contents" }}>
            <Editable path={sectionPath(id)} label={it.label} as="span"
              style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2, color, flex: 1, position: "relative" }}>
              <span style={{ position: "relative", display: "inline-flex", padding: "4px 14px", borderRadius: 999, background: isActive && v.activeIndicator === "pill" ? `color-mix(in srgb, ${color} 14%, transparent)` : undefined }}>
                <LucideIcon name={it.icon ?? "circle"} size={v.iconSize} />
                {isCart && v.showCartBadge && manifest.capabilities.cart ? (
                  <span style={{ position: "absolute", top: 0, right: 6, background: colors.primary, color: colors.background, borderRadius: 999, fontSize: 9, padding: "0 4px" }}>2</span>
                ) : null}
              </span>
              {v.showLabels ? <span style={{ fontSize: 11 }}>{it.label}</span> : null}
              {isActive && v.activeIndicator === "dot" ? <span style={{ width: 4, height: 4, borderRadius: 9, background: color }} /> : null}
              {isActive && v.activeIndicator === "line" ? <span style={{ position: "absolute", top: -(v.padding ?? 8), width: 24, height: 2, background: color }} /> : null}
            </Editable>
            </span>
          );
        })}
      </nav>
    </FixedShell>
  );
}

function SideMenuSection({ id }: { id: string }) {
  const v = useNodeValues(sectionPath(id));
  const colors = useColors();
  const { store, categories, onNavigateLink } = useTheme();
  const go = (link: any) => (e: any) => { e.stopPropagation(); onNavigateLink?.(link); };
  const logo = useNodeValues(elementPath(id, "logo"));
  const acc = useNodeValues(elementPath(id, "account"));
  const wa = useNodeValues(elementPath(id, "contactButton"));
  const items = ((v.items ?? []) as any[]).filter((i) => !i.hidden);
  const text = resolveColor(v.textColor, colors);
  const row = { padding: `${v.itemGap / 2}px 0`, borderBottom: v.divider === "line" ? `1px solid ${colors.border}` : undefined, fontSize: v.itemSize, display: "flex", gap: 10, alignItems: "center" } as CSSProperties;
  return (
    <OverlayShell id="sideMenu" path={sectionPath(id)} label="Menu lateral" side={v.side} width={v.width} scrim={v.scrim}
      style={{ background: resolveColor(v.bg, colors), color: text, padding: 20, display: "flex", flexDirection: "column", gap: 16 }}>
      {logo.show !== false ? <Editable path={elementPath(id, "logo")} label="Logótipo" as="span"><img src={store.logoUrl} alt={store.name} style={{ width: logo.width }} /></Editable> : null}
      {acc.show !== false ? <Editable path={elementPath(id, "account")} label="Conta" as="div" style={{ fontSize: 14, opacity: 0.8 }}>Entrar na conta</Editable> : null}
      <div>
        {items.map((it) => (
          <div key={it.id}>
            <div style={{ ...row, cursor: "pointer" }} onClick={go(it.link)}><span style={{ flex: 1 }}>{it.label}</span></div>
            {it.auto === "categories" ? categories.slice(0, it.autoCount ?? 6).map((c) => <div key={c.id} onClick={go({ type: "category", value: c.id })} style={{ ...row, cursor: "pointer", paddingLeft: 16, fontSize: v.itemSize - 2, opacity: 0.8 }}>{c.name}</div>) : null}
            {(it.children ?? []).filter((c: any) => !c.hidden).map((c: any) => <div key={c.id} onClick={go(c.link)} style={{ ...row, cursor: "pointer", paddingLeft: 16, fontSize: v.itemSize - 2, opacity: 0.8 }}>{c.label}</div>)}
          </div>
        ))}
      </div>
      {wa.show !== false ? (
        <Editable path={elementPath(id, "contactButton")} label="Botão de WhatsApp" as="div">
          <span style={{ display: "inline-flex", alignItems: "center", background: colors.buttonBg, color: colors.buttonText, padding: "10px 16px", borderRadius: 999, fontSize: 14 }}>{wa.label}</span>
        </Editable>
      ) : null}
    </OverlayShell>
  );
}

/** Carrinho lateral: reutiliza as seções da página Carrinho. */
function CartDrawerBody() {
  const { previewState } = useTheme();
  return (
    <OverlayShell id="cartDrawer" path={sectionPath("cartItems")} label="Carrinho lateral" side="right" width={340} style={{ background: "var(--sy-color-background)" }}>
      {previewState === "empty" ? <EmptyStateSection id="cartEmpty" /> : (<><CartItemsSection id="cartItems" /><CartSummarySection id="cartSummary" /></>)}
    </OverlayShell>
  );
}

function OverlayHost({ overlayId }: { overlayId: string }) {
  if (overlayId === "sideMenu") return <SideMenuSection id="sideMenu" />;
  if (overlayId === "cartDrawer") return <CartDrawerBody />;
  return null;
}

function PageHeadingSection({ id }: { id: string }) {
  const { v, outer, inner } = useSectionFrame(id);
  const t = useNodeValues(elementPath(id, "title"));
  const colors = useColors();
  const { manifest, categories, previewQuery } = useTheme();
  const fonts = Object.fromEntries(manifest.fonts.map((f) => [f.id, f.family]));
  const fallback = id === "collectionHeading" ? categories[0]?.name ?? "Coleção" : HEADING_DEFAULTS[id] ?? "Página";
  void previewQuery;
  return (
    <SectionShell path={sectionPath(id)} label="Título da página" style={outer}>
      <div style={{ ...inner, textAlign: v.headAlign }}>
        <Editable path={elementPath(id, "title")} label="Título" as="div">
          <h1 style={textStyle(t, colors, fonts)}>{t.text || fallback}</h1>
        </Editable>
        <TextEl path={elementPath(id, "subtitle")} label="Subtítulo" />
      </div>
    </SectionShell>
  );
}

function EmptyStateSection({ id }: { id: string }) {
  const { outer, inner, colors } = useSectionFrame(id);
  const ic = useNodeValues(elementPath(id, "icon"));
  return (
    <SectionShell path={sectionPath(id)} label="Estado vazio" style={outer}>
      <div style={{ ...inner, alignItems: "center", textAlign: "center", padding: "32px 0" }}>
        {ic.show !== false ? <Editable path={elementPath(id, "icon")} label="Ícone" as="span" style={{ color: resolveColor(ic.color, colors) }}><LucideIcon name={ic.icon} size={ic.size} /></Editable> : null}
        <TextEl path={elementPath(id, "title")} label="Título" fallbackTag="h2" />
        <TextEl path={elementPath(id, "text")} label="Texto" />
        <ButtonEl path={elementPath(id, "button")} label="Botão" />
      </div>
    </SectionShell>
  );
}

function CollectionToolbarSection({ id }: { id: string }) {
  const { v, outer, inner, colors } = useSectionFrame(id);
  const { products, categories, manifest } = useTheme();
  const n = products.filter((p) => p.categoryId === categories[0]?.id).length || products.length;
  const pill = { border: `1px solid ${colors.border}`, borderRadius: 999, padding: "6px 12px", fontSize: 13, display: "inline-flex", gap: 6, alignItems: "center" } as CSSProperties;
  return (
    <SectionShell path={sectionPath(id)} label="Barra da coleção" style={outer}>
      <div style={{ ...inner, flexDirection: "row", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap" }}>
        {v.showCount ? <span style={{ fontSize: 13, opacity: 0.7 }}>{n} produtos</span> : <span />}
        <span style={{ display: "flex", gap: 8 }}>
          {v.showFilters && manifest.capabilities.searchFilters ? <span style={pill}><Icons.SlidersHorizontal size={14} /> Filtros</span> : null}
          {v.showSort ? <span style={pill}>Ordenar <Icons.ChevronDown size={14} /></span> : null}
          {v.showLayoutSwitch ? <span style={pill}><Icons.LayoutGrid size={14} /></span> : null}
        </span>
      </div>
    </SectionShell>
  );
}

function SearchBarSection({ id }: { id: string }) {
  const { v, outer, inner, colors } = useSectionFrame(id);
  const { categories, previewQuery } = useTheme();
  const field: CSSProperties = {
    display: "flex", alignItems: "center", gap: 8, padding: "10px 14px", fontSize: 15,
    border: v.fieldStyle === "outline" ? `1px solid ${colors.border}` : undefined,
    borderBottom: v.fieldStyle === "line" ? `1px solid ${colors.text}` : undefined,
    background: v.fieldStyle === "filled" ? colors.surfaceAlt : undefined,
    borderRadius: v.fieldStyle === "line" ? 0 : 10,
    maxWidth: v.barWidth === "centered" ? 520 : undefined, margin: v.barWidth === "centered" ? "0 auto" : undefined, width: "100%",
  };
  return (
    <SectionShell path={sectionPath(id)} label="Barra de pesquisa" style={outer}>
      <div style={inner}>
        <div style={field}><Icons.Search size={18} /><span style={{ flex: 1, opacity: previewQuery ? 1 : 0.5 }}>{previewQuery || v.placeholder}</span>{v.showButton ? <span style={{ background: colors.buttonBg, color: colors.buttonText, padding: "4px 10px", borderRadius: 6, fontSize: 13 }}>Pesquisar</span> : null}</div>
        {v.showSuggestions ? (
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {categories.slice(0, 4).map((c) => <span key={c.id} style={{ fontSize: 12, border: `1px solid ${colors.border}`, borderRadius: 999, padding: "4px 10px" }}>{c.name}</span>)}
          </div>
        ) : null}
      </div>
    </SectionShell>
  );
}

function MiniCard({ product, cardPath, v, colors, extra }: { product: ProductLite; cardPath: string; v: Record<string, any>; colors: Record<string, string>; extra?: ReactNode }) {
  const { store } = useTheme();
  return (
    <Editable path={cardPath} label="Cartão de produto" openContext={{ productId: product.id }}>
      <div style={{ position: "relative" }}>
        <img src={product.images[0]} alt="" style={{ width: "100%", aspectRatio: v.aspectRatio, objectFit: "cover", display: "block", borderRadius: 8 }} />
        {extra}
        {v.showName ? <p style={{ fontSize: v.nameSize, marginTop: 6 }}>{product.name}</p> : null}
        {v.showPrice ? (
          <p style={{ fontSize: 14, fontWeight: 600 }}>
            {product.price.toFixed(2)} {store.currency}
            {v.showComparePrice && product.comparePrice ? <s style={{ opacity: 0.5, marginLeft: 6, fontWeight: 400 }}>{product.comparePrice.toFixed(2)}</s> : null}
          </p>
        ) : null}
      </div>
    </Editable>
  );
}

function ProductGrid({ id, label, list, extra }: { id: string; label: string; list: ProductLite[]; extra?: (p: ProductLite) => ReactNode }) {
  const { v, outer, inner, colors } = useSectionFrame(id);
  const card = useNodeValues(elementPath(id, "productCard"));
  const cols = v.layout === "list" ? 1 : v.columns ?? 2;
  return (
    <SectionShell path={sectionPath(id)} label={label} style={outer}>
      <div style={inner}>
        {v.showCount ? <p style={{ fontSize: 13, opacity: 0.7 }}>{list.length} resultados</p> : null}
        <div style={{ display: "grid", gridTemplateColumns: `repeat(${cols}, minmax(0,1fr))`, gap: v.gap ?? 16 }}>
          {list.map((p) => <MiniCard key={p.id} product={p} cardPath={elementPath(id, "productCard")} v={card} colors={colors} extra={extra?.(p)} />)}
        </div>
      </div>
    </SectionShell>
  );
}

function SearchResultsSection({ id }: { id: string }) {
  const { products, previewQuery, categories } = useTheme();
  if (id === "relatedProducts") return <RelatedProducts id={id} />;
  if (id === "collectionProducts") return <ProductGrid id={id} label="Produtos da coleção" list={products.filter((p) => p.categoryId === categories[0]?.id).concat(products).slice(0, 8)} />;
  const q = (previewQuery ?? "").toLowerCase().trim();
  const hits = products.filter((p) => !q || p.name.toLowerCase().includes(q));
  return <ProductGrid id={id} label="Resultados" list={(hits.length ? hits : products).slice(0, 6)} />;
}

function WishlistGridSection({ id }: { id: string }) {
  const { products } = useTheme();
  const v = useNodeValues(sectionPath(id));
  return (
    <ProductGrid id={id} label="Lista de favoritos" list={products.slice(0, 4)}
      extra={() => (
        <span style={{ position: "absolute", top: 8, right: 8, background: "rgba(255,255,255,.9)", borderRadius: 999, padding: v.removeStyle === "text" ? "2px 8px" : 6, fontSize: 11, color: "#111", display: "inline-flex" }}>
          {v.removeStyle === "text" ? "Remover" : <Icons.X size={14} />}
        </span>
      )} />
  );
}

function demoCart(products: ProductLite[]) {
  const lines = products.slice(0, 3).map((p, i) => ({ p, qty: i === 1 ? 2 : 1, variant: i === 0 ? "Tamanho M" : undefined }));
  const subtotal = lines.reduce((s, l) => s + l.p.price * l.qty, 0);
  return { lines, subtotal, discount: 5, shipping: 0 };
}

function CartItemsSection({ id }: { id: string }) {
  const { v, outer, inner, colors } = useSectionFrame(id);
  const { products, store } = useTheme();
  const { lines } = demoCart(products);
  return (
    <SectionShell path={sectionPath(id)} label="Produtos no carrinho" style={outer}>
      <div style={inner}>
        {lines.map(({ p, qty, variant }) => (
          <div key={p.id} style={{ display: "flex", gap: 12, alignItems: "center", paddingBottom: 12, borderBottom: v.divider ? `1px solid ${colors.border}` : undefined }}>
            {v.showImage ? <img src={p.images[0]} alt="" style={{ width: v.imageSize, height: v.imageSize, objectFit: "cover", borderRadius: 8 }} /> : null}
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: 14 }}>{p.name}</p>
              {v.showVariant && variant ? <p style={{ fontSize: 12, opacity: 0.6 }}>{variant}</p> : null}
              <p style={{ fontSize: 14, fontWeight: 600 }}>{p.price.toFixed(2)} {store.currency}</p>
            </div>
            <span style={{ fontSize: 13, border: `1px solid ${colors.border}`, borderRadius: 8, padding: "4px 8px" }}>{v.quantityStyle === "buttons" ? `−  ${qty}  +` : `${qty} ▾`}</span>
            <span style={{ fontSize: 12, opacity: 0.6 }}>{v.removeStyle === "text" ? "Remover" : <Icons.Trash2 size={16} />}</span>
          </div>
        ))}
      </div>
    </SectionShell>
  );
}

function CartSummarySection({ id }: { id: string }) {
  const { v, outer, inner } = useSectionFrame(id);
  const { products, store } = useTheme();
  const c = demoCart(products);
  const money = (n: number) => `${n.toFixed(2)} ${store.currency}`;
  const line = { display: "flex", justifyContent: "space-between", fontSize: 14 } as CSSProperties;
  return (
    <SectionShell path={sectionPath(id)} label="Resumo do carrinho" style={outer}>
      <div style={inner}>
        {v.showSubtotal ? <div style={line}><span>Subtotal</span><span>{money(c.subtotal)}</span></div> : null}
        {v.showDiscount ? <div style={line}><span>Desconto</span><span>−{money(c.discount)}</span></div> : null}
        <div style={line}><span>Envio</span><span>Grátis</span></div>
        <div style={{ ...line, fontWeight: 700, fontSize: 16 }}><span>Total</span><span>{money(c.subtotal - c.discount)}</span></div>
        <TextEl path={elementPath(id, "shippingNote")} label="Nota de envio" />
        <ButtonEl path={elementPath(id, "checkoutButton")} label="Finalizar compra" />
        <ButtonEl path={elementPath(id, "continueShopping")} label="Continuar a comprar" />
        <TextEl path={elementPath(id, "secureNote")} label="Nota de segurança" />
      </div>
    </SectionShell>
  );
}

function AccountPanelSection({ id }: { id: string }) {
  const { v, outer, inner, colors } = useSectionFrame(id);
  const { previewState } = useTheme();
  const user = previewState === "user";
  return (
    <SectionShell path={sectionPath(id)} label="Conta" style={outer}>
      <div style={inner}>
        {user ? (
          <>
            <p style={{ fontSize: 18, fontWeight: 600 }}>{String(v.welcome).replace("{nome}", "Ana Demo")}</p>
            {[["#1042", "Entregue", "12 set"], ["#1057", "Em preparação", "2 out"]].map(([n, s, d]) => (
              <div key={n} style={{ border: `1px solid ${colors.border}`, borderRadius: 10, padding: 12, display: "flex", justifyContent: "space-between", fontSize: 14 }}>
                <span>Pedido {n} · {d}</span><span style={{ opacity: 0.7 }}>{s}</span>
              </div>
            ))}
          </>
        ) : (
          <>
            <p style={{ fontSize: 15, opacity: 0.8 }}>{v.intro}</p>
            <ButtonEl path={elementPath(id, "loginButton")} label="Botão entrar" />
            <ButtonEl path={elementPath(id, "registerLink")} label="Criar conta" />
          </>
        )}
      </div>
    </SectionShell>
  );
}

function ContentBlockSection({ id }: { id: string }) {
  const { v, outer, inner } = useSectionFrame(id);
  return (
    <SectionShell path={sectionPath(id)} label="Texto da página" style={outer}>
      <div style={{ ...inner, maxWidth: v.width === "narrow" ? 680 : inner.maxWidth }}>
        <p style={{ fontSize: v.textSize, lineHeight: 1.7 }}>{INFO_TEXT[id] ?? "Texto da página."}</p>
      </div>
    </SectionShell>
  );
}

function ContactChannelsSection({ id }: { id: string }) {
  const { v, outer, inner, colors } = useSectionFrame(id);
  const { store } = useTheme();
  const items = [
    v.showWhatsapp && ["message-circle", "WhatsApp", store.whatsapp],
    v.showPhone && ["phone", "Telefone", store.phone],
    v.showEmail && ["mail", "E-mail", store.email],
    v.showAddress && ["map-pin", "Morada", store.address],
    v.showHours && ["clock", "Horário", store.hours],
  ].filter(Boolean) as string[][];
  return (
    <SectionShell path={sectionPath(id)} label="Canais de contacto" style={outer}>
      <div style={{ ...inner, display: "grid", gridTemplateColumns: v.layout === "cards" ? "repeat(auto-fill,minmax(160px,1fr))" : "1fr" }}>
        {items.map(([ic, l, val]) => (
          <div key={l} style={{ display: "flex", gap: 10, alignItems: "center", padding: 12, border: v.layout === "cards" ? `1px solid ${colors.border}` : undefined, borderRadius: 10 }}>
            <LucideIcon name={ic} size={18} /><div><p style={{ fontSize: 12, opacity: 0.6 }}>{l}</p><p style={{ fontSize: 14 }}>{val}</p></div>
          </div>
        ))}
      </div>
    </SectionShell>
  );
}

function ContactFormSection({ id }: { id: string }) {
  const { v, outer, inner, colors } = useSectionFrame(id);
  const f = { border: `1px solid ${colors.border}`, borderRadius: 8, padding: "10px 12px", fontSize: 14, opacity: 0.6 } as CSSProperties;
  return (
    <SectionShell path={sectionPath(id)} label="Formulário de contacto" style={outer}>
      <div style={inner}>
        <TextEl path={elementPath(id, "title")} label="Título" fallbackTag="h2" />
        <div style={f}>Nome</div><div style={f}>E-mail</div>
        {v.showPhoneField ? <div style={f}>Telefone</div> : null}
        <div style={{ ...f, minHeight: 80 }}>Mensagem</div>
        <ButtonEl path={elementPath(id, "submit")} label="Botão enviar" />
      </div>
    </SectionShell>
  );
}


/* ============================ Página Produto ============================ */

function usePreviewProduct(): ProductLite | undefined {
  const { products } = useTheme();
  const { productId } = useEditorPreview();
  return products.find((p) => p.id === productId) ?? products[0];
}

function ProductGallerySection({ id }: { id: string }) {
  const { v, outer, inner } = useSectionFrame(id);
  const product = usePreviewProduct();
  const imgs = product?.images.length ? product.images : [];
  return (
    <SectionShell path={sectionPath(id)} label="Galeria do produto" style={outer}>
      <div style={inner}>
        {imgs[0] ? (
          <img src={imgs[0]} alt={product?.name} style={{ width: "100%", aspectRatio: v.aspectRatio, objectFit: "cover", display: "block", borderRadius: v.imageRadius }} />
        ) : (
          <div style={{ width: "100%", aspectRatio: v.aspectRatio, background: "#EDEDED", borderRadius: v.imageRadius }} />
        )}
        {v.showThumbs && imgs.length ? (
          <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
            {[...imgs, ...imgs].slice(0, 4).map((src, i) => (
              <img key={i} src={src} alt="" style={{ width: 56, height: 56, objectFit: "cover", borderRadius: Math.min(v.imageRadius, 8), opacity: i === 0 ? 1 : 0.6 }} />
            ))}
          </div>
        ) : null}
      </div>
    </SectionShell>
  );
}

function ProductInfoSection({ id }: { id: string }) {
  const { v, outer, inner, colors } = useSectionFrame(id);
  const { store } = useTheme();
  const product = usePreviewProduct();
  if (!product) return null;
  return (
    <SectionShell path={sectionPath(id)} label="Informações do produto" style={outer}>
      <div style={{ ...inner, display: "flex", flexDirection: "column", gap: 10, textAlign: v.align }}>
        <h1 style={{ fontSize: v.nameSize }}>{product.name}</h1>
        <p style={{ fontSize: v.priceSize, fontWeight: 600 }}>
          {product.price.toFixed(2)} {store.currency}
          {v.showComparePrice && product.comparePrice ? <s style={{ opacity: 0.5, marginLeft: 8, fontWeight: 400, fontSize: v.priceSize - 4 }}>{product.comparePrice.toFixed(2)}</s> : null}
        </p>
        {v.showStock ? <p style={{ fontSize: 13, color: product.inStock ? colors.text : colors.comparePrice, opacity: 0.75 }}>{product.inStock ? "Em stock" : "Esgotado"}</p> : null}
        <div><ButtonEl path={elementPath(id, "addToCart")} label="Botão adicionar" /></div>
      </div>
    </SectionShell>
  );
}

function ProductDescriptionSection({ id }: { id: string }) {
  const { outer, inner } = useSectionFrame(id);
  const product = usePreviewProduct();
  return (
    <SectionShell path={sectionPath(id)} label="Descrição" style={outer}>
      <div style={{ ...inner, display: "flex", flexDirection: "column", gap: 8 }}>
        <TextEl path={elementPath(id, "title")} label="Título" fallbackTag="h2" />
        <p style={{ opacity: 0.8 }}>{product?.shortDescription ?? "Descrição do produto de demonstração."}</p>
      </div>
    </SectionShell>
  );
}

function RelatedProducts({ id }: { id: string }) {
  const { products } = useTheme();
  const current = usePreviewProduct();
  const list = products.filter((p) => p.id !== current?.id && (!current || p.categoryId === current.categoryId)).concat(products.filter((p) => p.id !== current?.id)).filter((p, i, a) => a.findIndex((x) => x.id === p.id) === i).slice(0, 4);
  return <ProductGrid id={id} label="Produtos relacionados" list={list} />;
}

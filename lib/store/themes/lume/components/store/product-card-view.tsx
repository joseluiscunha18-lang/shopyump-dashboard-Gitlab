'use client';

import type { CSSProperties, ReactNode } from "react";
import { FavouriteButton } from "./favourite-button";

/** Props que o cartão entrega ao "link" — a loja liga-as ao router, o editor desenha um <div>. */
export interface CardLinkProps {
  className?: string;
  style?: CSSProperties;
  children: ReactNode;
  "aria-label"?: string;
  title?: string;
  "data-sy"?: string;
}

/**
 * Personalização do cartão aplicada INLINE. Só o editor a passa: na loja pública
 * estas mesmas opções chegam por CSS injetado (`buildLumePersonalizacao`, que
 * escolhe os elementos pelos `data-sy` deste ficheiro). Sem `appearance` o cartão
 * mostra o desenho por omissão do tema.
 */
export interface ProductCardAppearance {
  aspectRatio?: string;
  imageBg?: string;
  imageRadius?: number;
  /** Largura da borda da foto; 0 = sem borda. */
  borderWidth?: number;
  shadow?: string;
  align?: "left" | "center" | "right";
  nameSize?: number;
  priceSize?: number;
  showName?: boolean;
  showPrice?: boolean;
  showBadge?: boolean;
  showWishlist?: boolean;
}

export interface ProductCardViewProps {
  name: string;
  /** Preço já formatado (ex: "1 999 MT"). */
  priceLabel: string;
  photo?: string;
  /** Desenhado quando não há foto (a loja usa a ilustração do produto). */
  fallback?: ReactNode;
  /** false → mostra o selo "Esgotado". */
  available: boolean;
  liked?: boolean;
  onToggleFavourite?: () => void;
  /** false → sem coração (o editor só o mostra se o tema tiver lista de desejos). */
  showFavourite?: boolean;
  renderLink: (props: CardLinkProps) => ReactNode;
  appearance?: ProductCardAppearance;
}

/**
 * Cartão de produto do tema Lume (grelhas da página inicial, coleção, favoritos
 * e "Você também pode gostar").
 *
 * Só apresentação: sem router, sem carrinho, sem sessão. A loja pública liga-o em
 * `product-card.tsx`; o editor em `theme-editor/themes/lume/Renderer.tsx`. As
 * classes e os `data-sy` são os mesmos nos dois, por isso não podem divergir.
 */
export function ProductCardView({
  name,
  priceLabel,
  photo,
  fallback,
  available,
  liked = false,
  onToggleFavourite,
  showFavourite = true,
  renderLink,
  appearance: a,
}: ProductCardViewProps) {
  const frameStyle: CSSProperties | undefined = a
    ? {
        aspectRatio: a.aspectRatio && a.aspectRatio !== "auto" ? a.aspectRatio : undefined,
        background: a.imageBg,
        borderRadius: a.imageRadius,
        borderWidth: a.borderWidth,
        boxShadow: a.shadow,
      }
    : undefined;

  return (
    <article className="group min-w-0">
      <div className="relative">
        {renderLink({
          className: "product-frame flex items-center justify-center bg-product-gallery p-0",
          style: frameStyle,
          "aria-label": `Ver ${name}`,
          children: photo ? (
            // eslint-disable-next-line @next/next/no-img-element -- galeria vem de qualquer bucket/host configurado em produto.fotos; next/image exigiria whitelisting por loja.
            <img
              src={photo}
              alt={name}
              loading="lazy"
              className="h-full w-full object-cover transition-transform duration-500 group-hover:-translate-y-1 group-hover:scale-[1.04]"
            />
          ) : (
            fallback
          ),
        })}
        {!available && a?.showBadge !== false && (
          <span data-sy="product-badge" className="absolute left-2 top-2 z-10 rounded-full bg-foreground px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-background">
            Esgotado
          </span>
        )}
        {showFavourite && a?.showWishlist !== false && (
          <span data-sy="product-fav" className="contents">
            <FavouriteButton productName={name} liked={liked} onToggle={() => onToggleFavourite?.()} className="absolute right-2 top-2 z-10" />
          </span>
        )}
      </div>
      <div data-sy="product-info" className="mt-3 min-w-0" style={a?.align ? { textAlign: a.align } : undefined}>
        {a?.showName !== false &&
          renderLink({
            title: name,
            "data-sy": "product-name",
            className: "block truncate text-sm font-medium leading-tight text-foreground hover:underline",
            style: a?.nameSize ? { fontSize: a.nameSize } : undefined,
            children: name,
          })}
        {a?.showPrice !== false && (
          <p data-sy="product-price" className="mt-1 text-sm font-bold text-foreground" style={a?.priceSize ? { fontSize: a.priceSize } : undefined}>
            {priceLabel}
          </p>
        )}
      </div>
    </article>
  );
}

'use client';

import type { ProductKind } from "../../lib/store-data";
import { cn } from "../../lib/utils";

const productArt: Record<ProductKind, { src: string; label: string; fill?: boolean }> = {
  coat: { src: "/tema-lume/products/coat.png", label: "Ilustração 2D de casaco azul" },
  shirt: { src: "/tema-lume/products/shirt.png", label: "Ilustração 2D de camisa marfim" },
  bag: { src: "/tema-lume/products/bag.png", label: "Ilustração 2D de bolsa coral e grafite" },
  dress: { src: "/tema-lume/products/dress.png", label: "Ilustração 2D de vestido coral" },
  tee: { src: "/tema-lume/products/tee.png", label: "Ilustração 2D de t-shirt verde sálvia" },
  wallet: { src: "/tema-lume/products/wallet.png", label: "Ilustração 2D de carteira amarela e verde" },
  hoodie: { src: "/tema-lume/products/hoodie.png", label: "Ilustração 2D de camisola rosa sobre fundo rosa", fill: true },
  cap: { src: "/tema-lume/products/cap.png", label: "Ilustração 2D de boné verde-petróleo sobre fundo coral", fill: true },
};

export const productImage = (kind: ProductKind) => productArt[kind].src;

export function ProductArt({ kind, className, variation = 0 }: { kind: ProductKind; className?: string; variation?: number }) {
  const art = productArt[kind];

  return (
    <img
      src={art.src}
      alt={art.label}
      loading="lazy"
      width={1024}
      height={1200}
      className={cn(
        art.fill
          ? "h-full w-full object-cover"
          : "h-full w-full object-contain drop-shadow-product",
        variation % 2 === 1 && "scale-x-[-1]",
        className,
      )}
    />
  );
}

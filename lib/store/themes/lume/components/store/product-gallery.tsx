'use client';

import { useState } from "react";
import { ProductArt } from "./product-art";
import type { Product } from "../../lib/store-data";
import { cn } from "../../lib/utils";

export function ProductGallery({ product }: { product: Product }) {
  const photos = product.images ?? [];
  const [active, setActive] = useState(0);
  const current = photos[active] ?? photos[0];

  return (
    <div className="min-w-0 self-start">
      <div className="product-gallery-slide relative p-0" aria-label={`Imagem de ${product.name}`}>
        {current ? (
          // eslint-disable-next-line @next/next/no-img-element -- ver nota em product-card.tsx
          <img src={current} alt={product.name} className="absolute inset-0 h-full w-full object-cover" />
        ) : (
          <ProductArt kind={product.kind} className="absolute inset-0" />
        )}
      </div>
      {photos.length > 1 && (
        <div className="mt-3 grid grid-cols-5 gap-2">
          {photos.map((src, index) => (
            <button
              key={src + index}
              type="button"
              onClick={() => setActive(index)}
              aria-label={`Ver foto ${index + 1} de ${product.name}`}
              aria-pressed={active === index}
              className={cn(
                "aspect-square overflow-hidden rounded-lg border transition-colors",
                active === index ? "border-foreground" : "border-border hover:border-foreground/40",
              )}
            >
              {/* eslint-disable-next-line @next/next/no-img-element -- ver nota em product-card.tsx */}
              <img src={src} alt="" className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

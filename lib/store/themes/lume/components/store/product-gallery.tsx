'use client';

import { useEffect, useRef, useState } from "react";
import { ProductArt } from "./product-art";
import type { Product } from "../../lib/store-data";
import { cn } from "../../lib/utils";

export function ProductGallery({ product }: { product: Product }) {
  const photos = product.images ?? [];
  const trackRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);

  // Sincroniza o ponto ativo com o scroll do carrossel (snap nativo).
  useEffect(() => {
    const track = trackRef.current;
    if (!track || photos.length <= 1) return;
    let frame = 0;
    const onScroll = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const index = Math.round(track.scrollLeft / track.clientWidth);
        setActive(Math.min(Math.max(index, 0), photos.length - 1));
      });
    };
    track.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      track.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(frame);
    };
  }, [photos.length]);

  const goTo = (index: number) => {
    const track = trackRef.current;
    if (!track) return;
    track.scrollTo({ left: index * track.clientWidth, behavior: "smooth" });
  };

  if (photos.length === 0) {
    return (
      <div className="min-w-0 self-start">
        <div className="product-gallery-slide relative p-0" aria-label={`Imagem de ${product.name}`}>
          <ProductArt kind={product.kind} className="absolute inset-0" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-w-0 self-start">
      <div
        ref={trackRef}
        className="flex snap-x snap-mandatory overflow-x-auto scroll-smooth [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        role="group"
        aria-label={`Fotos de ${product.name}`}
      >
        {photos.map((src, index) => (
          <div key={src + index} className="product-gallery-slide relative w-full shrink-0 snap-center p-0">
            {/* eslint-disable-next-line @next/next/no-img-element -- ver nota em product-card.tsx */}
            <img
              src={src}
              alt={index === 0 ? product.name : ""}
              aria-hidden={index !== 0 && undefined}
              className="absolute inset-0 h-full w-full object-cover"
            />
          </div>
        ))}
      </div>
      {photos.length > 1 && (
        <div className="mt-3 flex items-center justify-center gap-1.5" role="tablist" aria-label="Selecionar foto">
          {photos.map((_, index) => (
            <button
              key={index}
              type="button"
              role="tab"
              onClick={() => goTo(index)}
              aria-label={`Ver foto ${index + 1} de ${photos.length}`}
              aria-selected={active === index}
              className={cn(
                "h-1.5 rounded-full transition-all",
                active === index ? "w-5 bg-foreground" : "w-1.5 bg-foreground/25 hover:bg-foreground/40",
              )}
            />
          ))}
        </div>
      )}
    </div>
  );
}

'use client';

import { useCallback, useEffect, useState } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { ProductArt } from "./product-art";
import type { Product } from "../../lib/store-data";

export function ProductGallery({ product, images }: { product: Product; images?: string[] }) {
  const photos = images ?? product.images ?? [];
  return <Gallery key={product.id + "|" + photos.join("|")} product={product} photos={photos} />;
}

function Gallery({ product, photos }: { product: Product; photos: string[] }) {
  const slideCount = photos.length > 0 ? photos.length : 1;
  const [selected, setSelected] = useState(0);
  const [carouselRef, carousel] = useEmblaCarousel({
    align: "center",
    containScroll: false,
    loop: false,
  });

  const updateSelected = useCallback(() => {
    if (carousel) setSelected(carousel.selectedScrollSnap());
  }, [carousel]);

  useEffect(() => {
    if (!carousel) return;
    updateSelected();
    carousel.on("select", updateSelected);
    carousel.on("reInit", updateSelected);
    return () => {
      carousel.off("select", updateSelected);
      carousel.off("reInit", updateSelected);
    };
  }, [carousel, updateSelected]);

  return (
    <div className="min-w-0 self-start" role="region" aria-roledescription="carrossel" aria-label={`Imagens de ${product.name}`}>
      <div ref={carouselRef} className="overflow-hidden touch-pan-y">
        <div className="flex">
          {Array.from({ length: slideCount }, (_, index) => (
            <div
              key={index}
              className={`product-gallery-slide relative min-w-0 shrink-0 basis-full ${slideCount > 1 && index < slideCount - 1 ? "mr-4" : ""}`}
              role="group"
              aria-roledescription="imagem"
              aria-label={`Imagem ${index + 1} de ${slideCount} de ${product.name}`}
              aria-hidden={selected !== index}
            >
              {photos[index] ? (
                // eslint-disable-next-line @next/next/no-img-element -- ver nota em product-card.tsx
                <img
                  src={photos[index]}
                  alt={index === 0 ? product.name : ""}
                  aria-hidden={index !== 0 && undefined}
                  className="absolute inset-0 h-full w-full object-cover"
                />
              ) : (
                <ProductArt kind={product.kind} className="absolute inset-0" />
              )}
            </div>
          ))}
        </div>
      </div>
      {slideCount > 1 && (
        <div className="mt-3 flex items-center justify-center gap-2" aria-live="polite" aria-label={`Imagem ${selected + 1} de ${slideCount}`}>
          {Array.from({ length: slideCount }, (_, index) => (
            <span
              key={index}
              aria-hidden="true"
              className={`size-1.5 rounded-full transition-colors ${selected === index ? "bg-foreground" : "bg-muted-foreground/40"}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

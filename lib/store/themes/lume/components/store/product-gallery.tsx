'use client';

import { useEffect, useRef, useState } from "react";
import { ProductArt } from "./product-art";
import type { Product } from "../../lib/store-data";

export function ProductGallery({ product, images }: { product: Product; images?: string[] }) {
  const photos = images ?? product.images ?? [];
  return <Gallery key={product.id + "|" + photos.join("|")} product={product} photos={photos} />;
}

function Gallery({ product, photos }: { product: Product; photos: string[] }) {
  const slideCount = photos.length > 0 ? photos.length : 1;
  const trackRef = useRef<HTMLDivElement>(null);
  const [selected, setSelected] = useState(0);

  // Volta para a primeira foto sempre que a galeria muda (ex: trocou de cor).
  useEffect(() => {
    setSelected(0);
    trackRef.current?.scrollTo({ left: 0 });
  }, [product.id, photos.join("|")]);

  // Sincroniza o indicador ativo com o scroll nativo (snap).
  useEffect(() => {
    const track = trackRef.current;
    if (!track || slideCount <= 1) return;
    let frame = 0;
    const onScroll = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const index = Math.round(track.scrollLeft / track.clientWidth);
        setSelected(Math.min(Math.max(index, 0), slideCount - 1));
      });
    };
    track.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      track.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(frame);
    };
  }, [slideCount]);

  return (
    <div className="min-w-0 self-start" role="region" aria-roledescription="carrossel" aria-label={`Imagens de ${product.name}`}>
      <div
        ref={trackRef}
        className="flex overflow-x-auto touch-pan-y snap-x snap-mandatory scroll-smooth [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {Array.from({ length: slideCount }, (_, index) => (
          <div
            key={index}
            className={`product-gallery-slide relative min-w-0 shrink-0 basis-full snap-center ${
              slideCount > 1 && index < slideCount - 1 ? "mr-4" : ""
            }`}
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

'use client';

import { useEffect, useRef, useState } from "react";
import { ProductArt } from "./product-art";
import type { Product } from "../../lib/store-data";
import { cn } from "../../lib/utils";

export function ProductGallery({ product, images }: { product: Product; images?: string[] }) {
  const photos = images ?? product.images ?? [];
  const trackRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);

  // Reinicia para a primeira foto sempre que a galeria muda (ex: trocou de cor).
  useEffect(() => {
    setActive(0);
    trackRef.current?.scrollTo({ left: 0 });
  }, [photos.join("|")]);

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
          // Sem gap e sem cantos arredondados: as fotos ficam encostadas
          // uma na outra e começam exatamente na borda, como numa galeria
          // de app de loja normal — nada de espaço em branco a separá-las.
          <div key={src + index} className="product-gallery-slide relative w-full shrink-0 snap-center rounded-none! border-0! p-0">
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
        <div className="mt-3 flex items-center justify-center gap-2" role="tablist" aria-label="Selecionar foto">
          {photos.map((_, index) => (
            <button
              key={index}
              type="button"
              role="tab"
              onClick={() => goTo(index)}
              aria-label={`Ver foto ${index + 1} de ${photos.length}`}
              aria-selected={active === index}
              className={cn(
                "size-2 rounded-full transition-colors",
                active === index ? "bg-foreground" : "bg-foreground/25 hover:bg-foreground/40",
              )}
            />
          ))}
        </div>
      )}
    </div>
  );
}

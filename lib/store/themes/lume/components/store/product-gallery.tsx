'use client';

import { useCallback, useEffect, useRef, useState } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { ProductArt } from "./product-art";
import type { Product } from "../../lib/store-data";

export function ProductGallery({
  product,
  images,
  alvos,
  onSelectIndex,
}: {
  product: Product;
  images?: string[];
  /** Índices das fotos da variante selecionada — a galeria posiciona-se numa delas. */
  alvos?: number[];
  /** Chamado quando o utilizador muda de foto (swipe/scroll). */
  onSelectIndex?: (index: number) => void;
}) {
  const photos = images ?? product.images ?? [];
  return <Gallery key={product.id + "|" + photos.join("|")} product={product} photos={photos} alvos={alvos} onSelectIndex={onSelectIndex} />;
}

function Gallery({
  product,
  photos,
  alvos,
  onSelectIndex,
}: {
  product: Product;
  photos: string[];
  alvos?: number[];
  onSelectIndex?: (index: number) => void;
}) {
  const slides = photos.length > 0 ? photos : [undefined];
  const [selected, setSelected] = useState(0);
  const [carouselRef, carousel] = useEmblaCarousel({
    align: "start",
    containScroll: "trimSnaps",
    loop: false,
  });

  // Nas pontas (primeira/última foto) a moldura fica presa no lugar e só a
  // imagem "estica" um pouquinho enquanto o dedo puxa — assim o utilizador
  // percebe que não há mais fotos, sem a foto sair do sítio nem sobrar
  // espaço em branco. Ao largar, o embla devolve tudo ao normal.
  useEffect(() => {
    if (!carousel) return;
    const STRETCH = 0.3; // 1 = estica na mesma proporção do puxão; 0.3 = discreto

    const aplicar = () => {
      const slidesEl = carousel.slideNodes();
      if (slidesEl.length < 2) return;
      const { limit, location } = carousel.internalEngine();
      const x = location.get();
      const sobraFim = Math.max(0, limit.min - x); // puxou além da última foto
      const sobraInicio = Math.max(0, x - limit.max); // puxou além da primeira
      const primeira = slidesEl[0];
      const ultima = slidesEl[slidesEl.length - 1];

      const fixar = (slide: HTMLElement, deslocamento: number, sobra: number, origem: "left" | "right") => {
        const media = slide.firstElementChild as HTMLElement | null;
        // Contra-translação: a moldura anda com o contentor, por isso anulamos.
        slide.style.transform = sobra > 0 ? `translate3d(${deslocamento}px,0,0)` : "";
        if (media) {
          const largura = slide.offsetWidth || 1;
          const escala = 1 + Math.min(sobra / largura, 0.35) * STRETCH;
          media.style.transformOrigin = `${origem} center`;
          media.style.transform = sobra > 0 ? `scaleX(${escala})` : "";
        }
      };
      fixar(ultima, sobraFim, sobraFim, "right");
      fixar(primeira, -sobraInicio, sobraInicio, "left");
    };

    carousel.on("scroll", aplicar);
    carousel.on("settle", aplicar);
    carousel.on("reInit", aplicar);
    return () => {
      carousel.off("scroll", aplicar);
      carousel.off("settle", aplicar);
      carousel.off("reInit", aplicar);
    };
  }, [carousel]);

  const onSelectRef = useRef(onSelectIndex);
  onSelectRef.current = onSelectIndex;

  const updateSelected = useCallback(() => {
    if (!carousel) return;
    const index = carousel.selectedScrollSnap();
    setSelected(index);
    onSelectRef.current?.(index);
  }, [carousel]);

  // Ao trocar de cor (ou outra variante com fotos próprias), leva a galeria
  // até à foto dessa variante — a não ser que já esteja numa delas.
  const alvosKey = (alvos ?? []).join(",");
  useEffect(() => {
    if (!carousel || !alvos || alvos.length === 0) return;
    if (!alvos.includes(carousel.selectedScrollSnap())) carousel.scrollTo(alvos[0]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [carousel, alvosKey]);

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
      <div ref={carouselRef} className="overflow-hidden touch-pan-y px-3">
        <div className="flex">
          {slides.map((src, index) => (
            <div
              key={index}
              className={`product-gallery-slide relative min-w-0 shrink-0 basis-full ${index < slides.length - 1 ? "mr-3" : ""}`}
              role="group"
              aria-roledescription="imagem"
              aria-label={`Imagem ${index + 1} de ${slides.length} de ${product.name}`}
              aria-hidden={selected !== index}
            >
              {src ? (
                // eslint-disable-next-line @next/next/no-img-element -- ver nota em product-card.tsx
                <img
                  src={src}
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
      {slides.length > 1 && (
        <div className="mt-3 flex items-center justify-center gap-2" aria-live="polite" aria-label={`Imagem ${selected + 1} de ${slides.length}`}>
          {slides.map((_, index) => (
            <span key={index} aria-hidden="true" className={`size-1.5 rounded-full transition-colors ${selected === index ? "bg-foreground" : "bg-muted-foreground/40"}`} />
          ))}
        </div>
      )}
    </div>
  );
}

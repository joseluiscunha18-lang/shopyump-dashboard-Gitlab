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

  // Nas pontas (primeira/última foto) é o próprio contentor (moldura +
  // imagem, numa só transformação) que fica preso no lugar e "estica" um
  // pouquinho enquanto o dedo puxa. Ao largar, o embla
  // devolve tudo ao normal. Feito para ser barato: fora das pontas o
  // handler sai logo (sem ler nem escrever no DOM), e a largura é medida
  // uma vez, não a cada frame.
  useEffect(() => {
    if (!carousel) return;
    const STRETCH = 0.12; // 1 = estica na mesma proporção do puxão; 0.12 = bem discreto
    let ativo = false;
    let largura = 1;

    const medir = () => {
      const nodes = carousel.slideNodes();
      largura = nodes[0]?.offsetWidth || 1;
    };
    medir();

    const limpar = () => {
      if (!ativo) return;
      ativo = false;
      for (const slide of carousel.slideNodes()) {
        slide.style.transform = "";
      }
    };

    const aplicar = () => {
      const nodes = carousel.slideNodes();
      if (nodes.length < 2) return;
      // offsetLocation é a posição que o embla usa de facto para desenhar
      // o contentor (interpolada entre frames) — usar `location` faz a
      // contra-translação ficar desfasada e o contentor a tremer.
      const { limit, offsetLocation } = carousel.internalEngine();
      const x = offsetLocation.get();
      const sobraFim = limit.min - x; // > 0: puxou além da última foto
      const sobraInicio = x - limit.max; // > 0: puxou além da primeira
      if (sobraFim <= 0.5 && sobraInicio <= 0.5) {
        limpar();
        return;
      }
      ativo = true;
      const noFim = sobraFim > sobraInicio;
      const slide = noFim ? nodes[nodes.length - 1] : nodes[0];
      const sobra = noFim ? sobraFim : sobraInicio;
      // Uma só transformação no contentor: contra-translação (para ele não
      // acompanhar o dedo) + esticão a partir do lado que fica fixo.
      const escala = 1 + Math.min(sobra / largura, 0.35) * STRETCH;
      slide.style.transformOrigin = noFim ? "right center" : "left center";
      slide.style.transform = `translate3d(${noFim ? sobra : -sobra}px,0,0) scaleX(${escala})`;
    };

    const aoReinicializar = () => {
      limpar();
      medir();
    };

    carousel.on("scroll", aplicar);
    carousel.on("settle", limpar);
    carousel.on("reInit", aoReinicializar);
    return () => {
      carousel.off("scroll", aplicar);
      carousel.off("settle", limpar);
      carousel.off("reInit", aoReinicializar);
      limpar();
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
              className={`product-gallery-slide relative min-w-0 shrink-0 basis-full will-change-transform ${index < slides.length - 1 ? "mr-3" : ""}`}
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

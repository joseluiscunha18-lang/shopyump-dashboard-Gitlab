'use client';

import { Children, isValidElement, useCallback, useRef, useState, type ReactNode } from 'react';
import { cn } from '@/lib/cn';

interface HomeCardCarouselProps {
  children: ReactNode;
}

/**
 * Carrossel horizontal para os cards financeiros da Home (Pagamentos,
 * Marketplace, e futuros contextos que venham a existir) — substitui o
 * empilhamento vertical quando há mais de um card a mostrar ao mesmo
 * tempo.
 *
 * Decisões de propósito (conversa sobre a Home, não da spec original):
 * - Card ativo ocupa a maior parte da largura (90%), nunca dois lado a
 *   lado a dividir o ecrã ao meio — cada card mantém o destaque total
 *   enquanto está em foco.
 * - ~10% do próximo card fica visível na borda — só o suficiente para
 *   indicar que há mais para deslizar, sem tirar destaque do card ativo.
 * - Scroll nativo por `scroll-snap`, SEM autoplay — o utilizador desliza
 *   quando quiser, nunca o card muda sozinho.
 * - Indicadores discretos (● ○) por baixo, um por card, não clicáveis —
 *   só refletem a posição atual do scroll, não são um controlo próprio.
 * - Nunca junta Loja e Marketplace num card só: cada `children` continua
 *   a ser um card inteiramente separado, só a apresentação é que passa a
 *   ser horizontal em vez de empilhada.
 *
 * Com 0 ou 1 filho, devolve o(s) filho(s) tal e qual, sem nenhum chrome
 * de carrossel (scroller, bleed, bolinhas) — isso só faz sentido quando
 * há de facto algo para deslizar.
 */
export function HomeCardCarousel({ children }: HomeCardCarouselProps) {
  const items = Children.toArray(children).filter(isValidElement);
  const scrollerRef = useRef<HTMLDivElement>(null);
  const slideRefs = useRef<Array<HTMLDivElement | null>>([]);
  const [activeIndex, setActiveIndex] = useState(0);

  const handleScroll = useCallback(() => {
    const scroller = scrollerRef.current;
    if (!scroller) return;
    const scrollerCenter = scroller.scrollLeft + scroller.clientWidth / 2;

    let closest = 0;
    let closestDistance = Infinity;
    slideRefs.current.forEach((el, i) => {
      if (!el) return;
      const slideCenter = el.offsetLeft + el.offsetWidth / 2;
      const distance = Math.abs(slideCenter - scrollerCenter);
      if (distance < closestDistance) {
        closestDistance = distance;
        closest = i;
      }
    });
    setActiveIndex(closest);
  }, []);

  if (items.length <= 1) {
    return <>{items}</>;
  }

  return (
    <div>
      {/* `-mx-4`/`px-4` sangra o scroller até à borda do frame (o card
          "espreitando" fica mesmo colado à margem), mantendo o primeiro
          card alinhado com o resto do conteúdo da página. Ajustar se o
          padding do contentor pai mudar. */}
      <div
        ref={scrollerRef}
        onScroll={handleScroll}
        className="-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-smooth px-4 pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {items.map((child, i) => (
          <div
            key={i}
            ref={(el) => {
              slideRefs.current[i] = el;
            }}
            className="w-[90%] shrink-0 snap-center sm:w-[300px]"
          >
            {child}
          </div>
        ))}
      </div>

      <div className="mt-3 flex items-center justify-center gap-1.5" aria-hidden>
        {items.map((_, i) => (
          <span
            key={i}
            className={cn(
              'h-[7px] w-[7px] rounded-full transition-colors',
              i === activeIndex ? 'bg-ink' : 'bg-transparent ring-1 ring-slate-300'
            )}
          />
        ))}
      </div>
    </div>
  );
}

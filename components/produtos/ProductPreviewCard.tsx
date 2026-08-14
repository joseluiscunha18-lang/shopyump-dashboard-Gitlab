'use client';

import { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/cn';

interface PreviewItem {
  id: string;
  image: string;
  bg: string;
  badge?: string;
  name: string;
  price: string;
  /** Ajuste fino opcional do enquadramento da foto dentro do card. */
  imageClassName?: string;
}

const ITEMS: PreviewItem[] = [
  {
    id: 'bolsa-feminina',
    image: 'https://i.ibb.co/0y1j5TZJ/a438689f26504d23aa559eeb1123f70f.png',
    bg: 'from-[#F0E2DA] to-[#E3CDC3]',
    name: 'Bolsa Feminina',
    price: '3.200 MT',
    imageClassName: 'scale-[1.18]',
  },
  {
    id: 'cupcake-chocolate',
    image: 'https://i.ibb.co/FbC8CZS8/jr-r-90-Hd-Ol-Gbjck-unsplash.jpg',
    bg: 'from-[#F6EAD2] to-[#EDDBB2]',
    name: 'Cupcake de Chocolate',
    price: '450 MT',
  },
  {
    id: 'nike-air-force-1',
    image: 'https://i.ibb.co/0y2zq6VQ/peter-albanese-w-FNTf-Yo9-Vnc-unsplash.jpg',
    bg: 'from-[#F2EDE6] to-[#E4D9CB]',
    name: 'Nike Air Force 1',
    price: '2.850 MT',
    imageClassName: 'object-left scale-[1.16]',
  },
  {
    id: 'creme-antirrugas',
    image: 'https://i.ibb.co/qF2G1zYm/natallia-photo-26nn-S5-I05-U-unsplash.jpg',
    bg: 'from-[#F3E4D6] to-[#E8D2BC]',
    name: 'Creme Antirrugas',
    price: '3.500 MT',
  },
];

const STABLE_MS = 2400;
const PHASE_MS = 300;

function ProductFace({ item }: { item: PreviewItem }) {
  return (
    <>
      <div
        className={cn(
          'relative aspect-square w-full overflow-hidden bg-gradient-to-br',
          item.bg,
        )}
      >
        {item.badge && (
          <span className="absolute left-2 top-2 z-10 rounded-full bg-white/95 px-1.5 py-[2px] text-[7px] font-black uppercase tracking-widest text-ink shadow-[0_1px_2px_rgba(15,23,42,0.08)]">
            {item.badge}
          </span>
        )}
        <img
          src={item.image}
          alt={item.name}
          className={cn('absolute inset-0 h-full w-full object-cover', item.imageClassName)}
        />
        <div className="pointer-events-none absolute inset-0 z-10 shadow-[inset_0_0_0_1px_rgba(0,0,0,0.08)]" />
      </div>

      <div className="px-3 pb-3 pt-2.5">
        <p className="truncate font-display text-[11.5px] font-bold tracking-tight text-ink">
          {item.name}
        </p>
        <p className="mt-0.5 text-[10.5px] font-semibold text-slate-400">{item.price}</p>
      </div>
    </>
  );
}

export function ProductPreviewCard() {
  const [item, setItem] = useState<PreviewItem>(ITEMS[0]);
  const [phase, setPhase] = useState<'idle' | 'exiting' | 'entering'>('idle');
  const indexRef = useRef(0);

  useEffect(() => {
    let stableTimer: ReturnType<typeof setTimeout>;
    let exitTimer: ReturnType<typeof setTimeout>;
    let enterTimer: ReturnType<typeof setTimeout>;
    let cancelled = false;

    const runCycle = () => {
      stableTimer = setTimeout(() => {
        if (cancelled) return;
        setPhase('exiting');

        exitTimer = setTimeout(() => {
          if (cancelled) return;
          const next = (indexRef.current + 1) % ITEMS.length;
          indexRef.current = next;
          setItem(ITEMS[next]);
          setPhase('entering');

          enterTimer = setTimeout(() => {
            if (cancelled) return;
            setPhase('idle');
            runCycle();
          }, PHASE_MS);
        }, PHASE_MS);
      }, STABLE_MS);
    };

    runCycle();
    return () => {
      cancelled = true;
      clearTimeout(stableTimer);
      clearTimeout(exitTimer);
      clearTimeout(enterTimer);
    };
  }, []);

  return (
    <div className="relative w-[142px]">
      <div
        key={item.id}
        className={cn(
          'relative w-full overflow-hidden rounded-[18px] bg-white shadow-[0_1px_3px_rgba(15,23,42,0.06),0_16px_30px_-14px_rgba(15,23,42,0.24)]',
          phase === 'exiting' && 'animate-product-exit',
          phase === 'entering' && 'animate-product-enter',
        )}
      >
        <ProductFace item={item} />
        <div className="pointer-events-none absolute inset-0 z-20 rounded-[18px] shadow-[inset_0_0_0_1px_rgba(0,0,0,0.08)]" />
      </div>
    </div>
  );
}

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
}

const ITEMS: PreviewItem[] = [
  {
    id: 'bolsa',
    image: 'https://i.ibb.co/gZM7Dcyp/ddea06acf5dd43d4a25acc94ece323a6.png',
    bg: 'from-[#F3E4D6] to-[#E8D2BC]',
    badge: 'NOVO',
    name: 'Bolsa Couro Caramelo',
    price: '3.200 MT',
  },
  {
    id: 'tenis',
    image: 'https://i.ibb.co/tMmLryHM/75943c0a89f2450a9a49da57c81ee7ba.png',
    bg: 'from-[#F2EDE6] to-[#E4D9CB]',
    name: 'Tênis Off-White',
    price: '2.850 MT',
  },
  {
    id: 'perfume',
    image: 'https://i.ibb.co/FbC8CZS8/jr-r-90-Hd-Ol-Gbjck-unsplash.jpg',
    bg: 'from-[#F6EAD2] to-[#EDDBB2]',
    name: 'Perfume Ambré',
    price: '4.800 MT',
  },
  {
    id: 'sobremesa',
    image: 'https://i.ibb.co/0y1j5TZJ/a438689f26504d23aa559eeb1123f70f.png',
    bg: 'from-[#F0E2DA] to-[#E3CDC3]',
    badge: 'NOVO',
    name: 'Torta de Chocolate',
    price: '950 MT',
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
          className="absolute inset-0 h-full w-full object-cover"
        />
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
          'relative w-full overflow-hidden rounded-[18px] bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04),0_14px_26px_-16px_rgba(15,23,42,0.20)]',
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

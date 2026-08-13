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
    image:
      'https://images.unsplash.com/photo-1630384057168-b537be58939c?auto=format&fit=crop&w=400&q=80',
    bg: 'from-[#F0E2DA] to-[#E3CDC3]',
    badge: 'NOVO',
    name: 'Torta de Chocolate',
    price: '950 MT',
  },
];

const STABLE_MS = 2400;
const TRANSITION_MS = 600;

function ProductFace({ item }: { item: PreviewItem }) {
  return (
    <>
      <div
        className={cn(
          'relative flex-1 min-h-0 overflow-hidden bg-gradient-to-br',
          item.bg,
        )}
      >
        {item.badge && (
          <span className="absolute left-3 top-3 z-10 rounded-full bg-white/95 px-2 py-[3px] text-[8.5px] font-black uppercase tracking-widest text-ink shadow-[0_1px_2px_rgba(15,23,42,0.08)]">
            {item.badge}
          </span>
        )}
        <img
          src={item.image}
          alt={item.name}
          className="absolute inset-0 h-full w-full object-cover"
        />
      </div>

      <div className="px-4 pb-4 pt-3.5">
        <p className="truncate font-display text-[13.5px] font-bold tracking-tight text-ink">
          {item.name}
        </p>
        <p className="mt-1 text-[12px] font-semibold text-slate-400">{item.price}</p>
      </div>
    </>
  );
}

export function ProductPreviewCard() {
  const [index, setIndex] = useState(0);
  const [prevIndex, setPrevIndex] = useState<number | null>(null);
  const indexRef = useRef(0);

  useEffect(() => {
    let stableTimer: ReturnType<typeof setTimeout>;
    let clearTimer: ReturnType<typeof setTimeout>;
    let cancelled = false;

    const runCycle = () => {
      stableTimer = setTimeout(() => {
        if (cancelled) return;
        const current = indexRef.current;
        const next = (current + 1) % ITEMS.length;
        indexRef.current = next;
        setPrevIndex(current);
        setIndex(next);

        clearTimer = setTimeout(() => {
          if (cancelled) return;
          setPrevIndex(null);
          runCycle();
        }, TRANSITION_MS);
      }, STABLE_MS);
    };

    runCycle();
    return () => {
      cancelled = true;
      clearTimeout(stableTimer);
      clearTimeout(clearTimer);
    };
  }, []);

  const current = ITEMS[index];
  const outgoing = prevIndex !== null ? ITEMS[prevIndex] : null;

  return (
    <div className="relative h-[264px] w-[192px] overflow-hidden rounded-[24px] border border-slate-200/80 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04),0_18px_36px_-20px_rgba(15,23,42,0.20)]">
      <div
        key={current.id}
        className={cn('flex h-full flex-col', outgoing && 'animate-product-enter')}
      >
        <ProductFace item={current} />
      </div>

      {outgoing && (
        <div
          key={`${outgoing.id}-out`}
          className="animate-product-exit absolute inset-0 flex flex-col bg-white"
        >
          <ProductFace item={outgoing} />
        </div>
      )}
    </div>
  );
}

'use client';

import { useEffect, useState } from 'react';
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
    id: 'tshirt',
    image: 'https://i.ibb.co/0y1j5TZJ/a438689f26504d23aa559eeb1123f70f.png',
    bg: 'from-[#FFE9D9] to-[#FFDCC2]',
    badge: 'NOVO',
    name: 'T-Shirt Essential',
    price: '1.500 MT',
  },
  {
    id: 'tenis',
    image: 'https://i.ibb.co/tMmLryHM/75943c0a89f2450a9a49da57c81ee7ba.png',
    bg: 'from-[#DCEBFF] to-[#CADFFC]',
    badge: 'OFERTA',
    name: 'Tênis Casual',
    price: '2.500 MT',
  },
  {
    id: 'bolsa',
    image: 'https://i.ibb.co/gZM7Dcyp/ddea06acf5dd43d4a25acc94ece323a6.png',
    bg: 'from-[#F4E3FF] to-[#E9D2FA]',
    name: 'Bolsa Feminina',
    price: '3.200 MT',
  },
  {
    id: 'perfume',
    image: 'https://i.ibb.co/FbC8CZS8/jr-r-90-Hd-Ol-Gbjck-unsplash.jpg',
    bg: 'from-[#E3F7EC] to-[#D2F0E0]',
    name: 'Perfume Signature',
    price: '4.800 MT',
  },
];

const INTERVAL_MS = 3000;

export function ProductPreviewCard() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setIndex((i) => (i + 1) % ITEMS.length);
    }, INTERVAL_MS);
    return () => clearInterval(id);
  }, []);

  const item = ITEMS[index];

  return (
    <div className="relative h-[248px] w-[188px] overflow-hidden rounded-[22px] bg-white shadow-[0_10px_24px_-14px_rgba(15,23,42,0.22)] ring-1 ring-black/[0.045]">
      <div key={item.id} className="animate-product-fade flex h-full flex-col">
        <div className={cn('relative flex flex-1 items-center justify-center bg-gradient-to-br', item.bg)}>
          {item.badge && (
            <span className="absolute left-2.5 top-2.5 rounded-full bg-white/85 px-2 py-1 text-[9px] font-black uppercase tracking-widest text-ink shadow-sm">
              {item.badge}
            </span>
          )}
          <img
            src={item.image}
            alt={item.name}
            className="h-full w-full object-cover"
          />
        </div>

        <div className="border-t border-slate-100 px-3.5 py-2.5">
          <p className="truncate text-[12.5px] font-bold text-ink">{item.name}</p>
          <p className="mt-0.5 text-[12px] font-semibold text-slate-400">{item.price}</p>
        </div>
      </div>
    </div>
  );
}

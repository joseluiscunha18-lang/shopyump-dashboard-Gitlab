'use client';

import { useRef, useState, type ReactNode } from 'react';
import Link from 'next/link';
import { MoreVertical } from 'lucide-react';
import { useClickOutside } from './useClickOutside';
import { Skeleton } from '@/components/ui/Surfaces';

export type ProductMenuItem = {
  key: string;
  icon: ReactNode;
  label: string;
  onClick?: () => void;
  href?: string;
  danger?: boolean;
  disabled?: boolean;
  /** Insere um separador ANTES deste item. */
  separatorBefore?: boolean;
};

/**
 * Menu "⋮" das linhas de produto — mesmo botão, mesmo dropdown, mesmos
 * tamanhos, usado tanto na ProductRow real como na PendingProductRow.
 * Antes o JSX do dropdown (largura, sombra, cada item) estava copiado
 * nos dois ficheiros; agora só se passa a lista de ações.
 *
 * `loading`: mostra o shimmer no lugar do botão (usado pela linha
 * pendente enquanto o esqueleto ainda está a decorrer). O wrapper de
 * fora (`h-8 w-8`) é sempre o mesmo elemento nos dois estados — mesma
 * razão da ProductRowCheckbox: evita remontar a linha toda a meio da
 * animação.
 */
export function ProductActionsMenu({ items, loading }: { items: ProductMenuItem[]; loading?: boolean }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useClickOutside(ref, open, () => setOpen(false));

  return (
    <div ref={ref} className="relative h-8 w-8 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
      {loading ? (
        <Skeleton className="absolute right-0 top-1/2 h-[18px] w-[18px] -translate-y-1/2 rounded-full" />
      ) : (
        <>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-label="Ações do produto"
            className="absolute inset-0 rounded-md text-slate-500 transition-colors hover:bg-slate-100 hover:text-ink"
          />
          <MoreVertical size={17} strokeWidth={2.3} className="pointer-events-none absolute right-0 top-1/2 -translate-y-1/2" />

          {open && (
            <div className="absolute right-0 top-full z-20 mt-1.5 w-[176px] overflow-hidden rounded-md border border-[#1A1210]/12 bg-white p-1.5 shadow-[0_16px_40px_-14px_rgba(15,23,42,0.22)]">
              {items.map((item) => {
                const className = `flex w-full items-center gap-2.5 rounded-md px-3 py-2.5 text-left text-[13px] font-semibold transition-colors ${
                  item.danger ? 'text-red-500 hover:bg-red-50' : 'text-ink hover:bg-slate-50'
                }`;
                const content = (
                  <>
                    {item.icon}
                    {item.label}
                  </>
                );
                return (
                  <div key={item.key}>
                    {item.separatorBefore && <div className="my-1 h-px bg-[#1A1210]/8" />}
                    {item.href ? (
                      <Link href={item.href} onClick={() => setOpen(false)} className={className}>
                        {content}
                      </Link>
                    ) : (
                      <button
                        type="button"
                        disabled={item.disabled}
                        onClick={() => {
                          setOpen(false);
                          item.onClick?.();
                        }}
                        className={className}
                      >
                        {content}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}

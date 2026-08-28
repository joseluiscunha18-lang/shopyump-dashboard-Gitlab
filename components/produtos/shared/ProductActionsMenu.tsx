'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
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

/** Largura fixa do dropdown (ver `w-[176px]` abaixo) — precisa de um valor
 * em JS, não só em classe, para calcular a posição horizontal em pixels. */
const MENU_WIDTH = 176;
/** Espaço entre o botão e o dropdown — o mesmo que o `mt-1.5` (6px) usava. */
const MENU_GAP = 6;

/**
 * Menu "⋮" das linhas de produto — mesmo botão, mesmo dropdown, mesmos
 * tamanhos, usado tanto na ProductRow real como na PendingProductRow.
 *
 * `loading`: mostra o shimmer NO LUGAR do ícone, mas o wrapper (h-8 w-8)
 * e o botão ficam SEMPRE no DOM — assim o layout nunca salta quando o
 * skeleton termina e o ícone aparece. O ícone faz fade-out/in via opacity
 * em vez de ser removido do DOM.
 *
 * O DROPDOWN em si é renderizado num portal (`createPortal` para
 * `document.body`), não como filho absoluto desta linha. Cada linha de
 * produto tem `style={{ contain: 'layout' }}` (ver ProductRow/
 * PendingProductRow) — isso cria um contexto de empilhamento PRÓPRIO por
 * linha. Um dropdown `position: absolute` dentro dessa linha, ao
 * ultrapassar os limites dela para baixo, ficava por baixo, no
 * empilhamento, da linha seguinte (que vem depois no HTML) — daí o menu
 * parecer "fundir-se" com as informações do produto de baixo. Ao portar
 * para `document.body` com `position: fixed` e coordenadas calculadas em
 * pixels, o dropdown deixa de estar sujeito ao empilhamento de nenhuma
 * linha — fica sempre por cima de tudo. A mesma posição em pixels também
 * permite abrir para CIMA quando não há espaço suficiente por baixo (perto
 * do fim da lista), em vez de cortar contra o fundo do ecrã.
 */
export function ProductActionsMenu({ items, loading }: { items: ProductMenuItem[]; loading?: boolean }) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<{ left: number; top?: number; bottom?: number } | null>(null);
  const ref = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  useClickOutside([ref, menuRef], open, () => setOpen(false));

  // Fecha ao rolar (a página, ou qualquer contentor com scroll interno) —
  // uma posição em `fixed` calculada uma vez não acompanha o scroll, por
  // isso mantê-lo aberto durante o scroll deixaria o dropdown "descolado"
  // do botão. `capture: true` para apanhar o scroll de QUALQUER contentor,
  // não só da janela.
  useEffect(() => {
    if (!open) return;
    function fechar() {
      setOpen(false);
    }
    window.addEventListener('scroll', fechar, { capture: true, passive: true });
    window.addEventListener('resize', fechar);
    return () => {
      window.removeEventListener('scroll', fechar, { capture: true });
      window.removeEventListener('resize', fechar);
    };
  }, [open]);

  function handleToggle() {
    if (!open) {
      const rect = ref.current?.getBoundingClientRect();
      if (rect) {
        // Estimativa da altura do dropdown (4 itens + separador + padding,
        // ver classes abaixo) — o suficiente para decidir o lado sem
        // precisar de medir o dropdown já renderizado. Mesmo critério de
        // simplicidade do SuggestInput.tsx (abrirParaCima = rect.top > 180).
        const alturaEstimada = 190;
        const espacoAbaixo = window.innerHeight - rect.bottom;
        const abrirParaCima = espacoAbaixo < alturaEstimada && rect.top > alturaEstimada;
        setPos({
          left: rect.right - MENU_WIDTH,
          ...(abrirParaCima
            ? { bottom: window.innerHeight - rect.top + MENU_GAP }
            : { top: rect.bottom + MENU_GAP }),
        });
      }
    }
    setOpen((v) => !v);
  }

  return (
    <div ref={ref} className="relative h-8 w-8 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
      {/* Botão sempre no DOM para o wrapper nunca mudar de tamanho */}
      <button
        type="button"
        disabled={loading}
        onClick={handleToggle}
        aria-label="Ações do produto"
        className="absolute inset-0 rounded-md text-slate-500 transition-colors hover:bg-slate-100 hover:text-ink disabled:pointer-events-none"
      />

      {/* Ícone sempre no DOM: opacity-0 durante o skeleton, opacity-100 depois */}
      <MoreVertical
        size={17}
        strokeWidth={2.3}
        className={`pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 transition-opacity duration-150 ${
          loading ? 'opacity-0' : 'opacity-100'
        }`}
      />

      {/* Shimmer sobreposto enquanto loading — desaparece sem mover nada */}
      {loading && (
        <Skeleton className="pointer-events-none absolute left-1/2 top-1/2 h-[18px] w-[18px] -translate-x-1/2 -translate-y-1/2 rounded-full" />
      )}

      {/* Dropdown — só quando não está em loading. Portal: nasce direto em
      document.body, fora da linha, por isso `onClick` (stopPropagation) e
      `position: fixed` aqui, não mais `absolute`/`right-0`/`top-full`. */}
      {!loading && open && pos &&
        createPortal(
          <div
            ref={menuRef}
            onClick={(e) => e.stopPropagation()}
            style={{ position: 'fixed', left: pos.left, top: pos.top, bottom: pos.bottom, width: MENU_WIDTH }}
            className="z-[200] overflow-hidden rounded-md border border-[#1A1210]/12 bg-white p-1.5 shadow-[0_16px_40px_-14px_rgba(15,23,42,0.22)]"
          >
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
          </div>,
          document.body,
        )}
    </div>
  );
}

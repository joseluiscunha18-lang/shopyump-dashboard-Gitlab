'use client';

import { ReactNode, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@/lib/cn';

/**
 * Bottom-sheet modal — porta da UX "modal-sheet drawer" do Shopyump-main
 * (ver modals.css / modals.js): fundo escuro, folha com cantos arredondados
 * que sobe do fundo do ecrã, alça para arrastar e fechar. Usado para
 * navegação em secções que precisam de mais espaço do que um dropdown
 * (categoria, opções de foto, escolher opção de variante) sem sair da
 * página principal do formulário.
 */
export function Sheet({
  open,
  onClose,
  title,
  subtitle,
  children,
  footer,
}: {
  open: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);
  const dragStartY = useRef<number | null>(null);
  const [dragY, setDragY] = useState(0);
  const sheetRef = useRef<HTMLDivElement>(null);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (open) {
      setVisible(true);
      document.documentElement.classList.add('overflow-hidden');
    } else {
      document.documentElement.classList.remove('overflow-hidden');
    }
    return () => document.documentElement.classList.remove('overflow-hidden');
  }, [open]);

  if (!mounted || (!open && !visible)) return null;

  function handleTransitionEnd() {
    if (!open) setVisible(false);
  }

  function onHandlePointerDown(e: React.PointerEvent) {
    dragStartY.current = e.clientY;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }

  function onHandlePointerMove(e: React.PointerEvent) {
    if (dragStartY.current === null) return;
    const delta = e.clientY - dragStartY.current;
    if (delta > 0) setDragY(delta);
  }

  function onHandlePointerUp() {
    if (dragY > 90) onClose();
    setDragY(0);
    dragStartY.current = null;
  }

  return createPortal(
    <div
      className={cn(
        'fixed inset-0 z-[100] flex flex-col justify-end transition-opacity duration-300',
        open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
      )}
    >
      <div className="absolute inset-0 bg-black/55" onClick={onClose} />
      <div
        ref={sheetRef}
        onTransitionEnd={handleTransitionEnd}
        style={{ transform: `translateY(${open ? dragY : '100%'}px)` }}
        className={cn(
          'relative z-10 flex max-h-[88vh] flex-col rounded-t-[28px] bg-white shadow-[0_-20px_60px_rgba(15,23,42,0.25)]',
          dragY === 0 && 'transition-transform duration-300 ease-out'
        )}
      >
        <div
          className="flex shrink-0 cursor-grab touch-none flex-col items-center pt-3 pb-1 active:cursor-grabbing"
          onPointerDown={onHandlePointerDown}
          onPointerMove={onHandlePointerMove}
          onPointerUp={onHandlePointerUp}
        >
          <div className="h-1.5 w-11 rounded-full bg-slate-200" />
        </div>
        {(title || subtitle) && (
          <div className="shrink-0 px-6 pb-3 pt-2">
            {title && <h3 className="text-[17px] font-black tracking-tight text-ink">{title}</h3>}
            {subtitle && <p className="mt-0.5 text-[12px] font-medium text-slate-400">{subtitle}</p>}
          </div>
        )}
        <div className="flex-1 overflow-y-auto overscroll-contain px-6 pb-2">{children}</div>
        {footer && <div className="shrink-0 border-t border-slate-100 bg-slate-50/60 px-6 py-4">{footer}</div>}
        <div className="shrink-0" style={{ height: 'env(safe-area-inset-bottom, 8px)' }} />
      </div>
    </div>,
    document.body
  );
}

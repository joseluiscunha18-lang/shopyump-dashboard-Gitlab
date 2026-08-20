'use client';

import { ReactNode, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { cn } from '@/lib/cn';

/**
 * Bottom-sheet modal — porta da UX "modal-sheet drawer" do Shopyump-main
 * (ver modals.css / modals.js): fundo escuro, folha com cantos arredondados
 * que sobe do fundo do ecrã, alça para arrastar e fechar. Usado para
 * navegação em secções que precisam de mais espaço do que um dropdown
 * (categoria, opções de foto, escolher opção de variante) sem sair da
 * página principal do formulário.
 *
 * `heightVh` controla a altura máxima da folha (percentagem da viewport).
 * Por omissão mantém os 88vh já usados pelos outros ecrãs — cada chamada
 * só precisa de passar um valor diferente se fizer sentido para o
 * conteúdo. A altura é sempre a mesma percentagem da janela, mesmo com o
 * teclado aberto — não recalculamos por cima do visual viewport, porque
 * isso fazia a folha "saltar" de tamanho ao tocar no campo de pesquisa.
 *
 * `closeButton` mostra um X clicável no canto superior direito, além do
 * gesto de arrastar e do toque fora da folha — desligado por omissão para
 * não alterar o comportamento dos ecrãs que já usam este componente.
 */
export function Sheet({
  open,
  onClose,
  title,
  subtitle,
  children,
  footer,
  heightVh = 88,
  closeButton = false,
}: {
  open: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
  heightVh?: number;
  closeButton?: boolean;
}) {
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);
  const dragStartY = useRef<number | null>(null);
  const [dragY, setDragY] = useState(0);
  // Separado do valor de dragY de propósito: é só isto que decide se a
  // transição CSS entra ou não. Enquanto o dedo está a arrastar, fica a
  // false (sem transição — a folha segue o dedo 1:1, sem atraso). Ao
  // soltar, passa a true e a transição assume — tanto para fechar como
  // para voltar à posição inicial — de forma sempre fluida, nunca presa
  // a um valor de posição específico.
  const [dragging, setDragging] = useState(false);
  const sheetRef = useRef<HTMLDivElement>(null);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (open) {
      setVisible(true);
      setDragY(0);
      setDragging(false);
      dragStartY.current = null;
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
    setDragging(true);
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }

  function onHandlePointerMove(e: React.PointerEvent) {
    if (dragStartY.current === null) return;
    const delta = e.clientY - dragStartY.current;
    if (delta > 0) setDragY(delta);
  }

  function onHandlePointerUp() {
    setDragging(false);
    dragStartY.current = null;
    if (dragY > 90) {
      onClose();
    } else {
      setDragY(0);
    }
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
        style={{
          transform: `translateY(${open ? dragY : '100%'}px)`,
          maxHeight: `${heightVh}vh`,
        }}
        className={cn(
          'relative z-10 flex flex-col rounded-t-[20px] bg-white shadow-[0_-16px_40px_rgba(15,23,42,0.18)] will-change-transform',
          !dragging && 'transition-transform duration-300 ease-out'
        )}
      >
        <div
          className="relative flex shrink-0 cursor-grab touch-none flex-col items-center pt-3 pb-1 active:cursor-grabbing"
          onPointerDown={onHandlePointerDown}
          onPointerMove={onHandlePointerMove}
          onPointerUp={onHandlePointerUp}
        >
          <div className="h-1 w-9 rounded-full bg-slate-200" />
          {closeButton && (
            <button
              type="button"
              onClick={onClose}
              aria-label="Fechar"
              className="absolute right-3 top-1.5 flex h-9 w-9 items-center justify-center rounded-full text-slate-500 transition-colors hover:bg-slate-50 hover:text-ink active:scale-95"
            >
              <X size={20} />
            </button>
          )}
        </div>
        {(title || subtitle) && (
          <div className="shrink-0 px-6 pb-2 pt-1">
            {title && <h3 className="text-[16px] font-black tracking-tight text-ink">{title}</h3>}
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

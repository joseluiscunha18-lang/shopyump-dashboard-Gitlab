'use client';

import { useEffect, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

export type CenterMenuItem = { key: string; label: string; onClick: () => void; danger?: boolean; icon?: ReactNode };

/** Menu de escolhas centrado no ecrã (estilo action menu). Itens perigosos
 * só pintam o TEXTO de vermelho — o fundo do botão fica neutro. */
export function CenterMenu({ open, onClose, title, description, items }: {
  open: boolean; onClose: () => void; title?: string; description?: string; items: CenterMenuItem[];
}) {
  useEffect(() => {
    if (!open) return;
    const k = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  }, [open, onClose]);
  if (!open || typeof document === 'undefined') return null;
  return createPortal(
    <div className="fixed inset-0 z-[300] flex items-center justify-center bg-foreground/40 px-6 animate-in fade-in-0" onClick={onClose}>
      <div role="menu" className="relative w-full max-w-[300px] overflow-hidden rounded-2xl border border-border bg-card shadow-lg animate-in zoom-in-95" onClick={(e) => e.stopPropagation()}>
        <button type="button" aria-label="Fechar" onClick={onClose} className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground hover:bg-muted">
          <X size={18} />
        </button>
        {(title || description) && (
          <div className="px-5 pb-3 pt-5 text-center">
            {title && <p className="text-[15px] font-semibold text-foreground">{title}</p>}
            {description && <p className="mt-1 text-[13px] text-muted-foreground">{description}</p>}
          </div>
        )}
        <div className="px-2 pb-2">{items.map((it) => (
          <button key={it.key} type="button" role="menuitem" onClick={() => { onClose(); it.onClick(); }}
            className={`flex w-full items-center justify-center gap-2 rounded-xl bg-transparent px-4 py-3 text-[15px] font-medium transition-colors hover:bg-muted active:bg-muted ${it.danger ? 'text-destructive' : 'text-foreground'}`}>
            {it.icon}{it.label}
          </button>
        ))}</div>
      </div>
    </div>,
    document.body,
  );
}

'use client';

import { Sheet } from '@/components/ui/Sheet';
import { Button } from '@/components/ui/Button';

/**
 * Substitui o `window.confirm()` nativo — a caixa cinzenta do browser
 * (com o domínio do site na primeira linha) quebra o padrão visual do
 * resto do produto. Reaproveita o Sheet já usado no resto do app para que
 * uma confirmação pareça parte da mesma interface, não do sistema.
 */
export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  danger = false,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  /** Ação destrutiva (ex: remover) — pinta o botão de confirmar a vermelho. */
  danger?: boolean;
}) {
  return (
    <Sheet open={open} onClose={onClose} title={title} subtitle={description} heightVh={38}>
      <div className="flex gap-3 pb-2 pt-3">
        <Button type="button" variant="secondary" className="flex-1" onClick={onClose}>
          {cancelLabel}
        </Button>
        <Button
          type="button"
          variant={danger ? 'danger' : 'primary'}
          className="flex-1"
          onClick={() => {
            onConfirm();
            onClose();
          }}
        >
          {confirmLabel}
        </Button>
      </div>
    </Sheet>
  );
}

'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { updatePedidoStatus } from '@/lib/mutations/pedidos';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';
import type { PedidoStatus } from '@/types/database';

// Forward transitions preserved from pedidos.js's status flow (§ mutations/pedidos.ts).
const NEXT_STATUS: Partial<Record<PedidoStatus, { status: PedidoStatus; label: string }>> = {
  pendente: { status: 'confirmado', label: 'Confirmar pedido' },
  confirmado: { status: 'enviado', label: 'Marcar como enviado' },
  enviado: { status: 'concluido', label: 'Marcar como concluído' },
};

export function OrderStatusActions({ pedidoId, status }: { pedidoId: string; status: PedidoStatus }) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  const { show } = useToast();

  function transition(next: PedidoStatus) {
    startTransition(async () => {
      const res = await updatePedidoStatus(pedidoId, next);
      if (!res.ok) return show(res.error ?? 'Não foi possível atualizar o pedido.', 'error');
      show('Pedido atualizado.');
      router.refresh();
    });
  }

  const next = NEXT_STATUS[status];
  const canCancel = status === 'pendente' || status === 'confirmado';

  return (
    <div className="flex gap-3 flex-wrap">
      {next && (
        <Button loading={pending} onClick={() => transition(next.status)}>
          {next.label}
        </Button>
      )}
      {canCancel && (
        <Button variant="danger" loading={pending} onClick={() => transition('cancelado')}>
          Cancelar pedido
        </Button>
      )}
    </div>
  );
}

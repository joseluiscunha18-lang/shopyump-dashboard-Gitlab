import { Badge } from '@/components/ui/Surfaces';
import type { PedidoStatus } from '@/types/database';

const LABELS: Record<PedidoStatus, string> = {
  pendente: 'Pendente',
  confirmado: 'Confirmado',
  enviado: 'Enviado',
  concluido: 'Concluído',
  cancelado: 'Cancelado',
};

const TONES: Record<PedidoStatus, 'warning' | 'brand' | 'success' | 'neutral' | 'danger'> = {
  pendente: 'warning',
  confirmado: 'brand',
  enviado: 'brand',
  concluido: 'success',
  cancelado: 'danger',
};

export function OrderStatusBadge({ status }: { status: PedidoStatus }) {
  return <Badge tone={TONES[status]}>{LABELS[status]}</Badge>;
}

export const STATUS_LABELS = LABELS;

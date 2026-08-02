'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { ClipboardList, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/cn';
import { Card, EmptyState } from '@/components/ui/Surfaces';
import { OrderStatusBadge } from '@/components/pedidos/OrderStatusBadge';
import { usePedidosRealtime } from '@/lib/realtime/usePedidosRealtime';
import type { Pedido, PedidoStatus } from '@/types/database';

const FILTERS: { value: PedidoStatus | 'todos'; label: string }[] = [
  { value: 'todos', label: 'Todos' },
  { value: 'pendente', label: 'Pendentes' },
  { value: 'confirmado', label: 'Confirmados' },
  { value: 'enviado', label: 'Enviados' },
  { value: 'concluido', label: 'Concluídos' },
];

export function OrdersList({ lojaId, initialPedidos }: { lojaId: string; initialPedidos: Pedido[] }) {
  const [pedidos, setPedidos] = useState(initialPedidos);
  const [filter, setFilter] = useState<PedidoStatus | 'todos'>('todos');

  usePedidosRealtime(lojaId, (event, pedido) => {
    setPedidos((prev) => {
      if (event === 'INSERT') {
        if (prev.some((p) => p.id === pedido.id)) return prev;
        return [pedido, ...prev];
      }
      return prev.map((p) => (p.id === pedido.id ? pedido : p));
    });
  });

  const visible = useMemo(
    () => (filter === 'todos' ? pedidos : pedidos.filter((p) => p.status === filter)),
    [pedidos, filter]
  );

  return (
    <div className="flex flex-col gap-5">
      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={cn(
              'px-4 py-2 rounded-full text-[11px] font-bold whitespace-nowrap transition-all',
              filter === f.value ? 'bg-ink text-white shadow-sm' : 'bg-white border border-slate-200 text-slate-500'
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {visible.length === 0 ? (
        <Card>
          <EmptyState icon={<ClipboardList size={22} />} title="Sem pedidos nesta categoria" />
        </Card>
      ) : (
        <Card className="divide-y divide-slate-100">
          {visible.map((p) => (
            <Link
              key={p.id}
              href={`/pedidos/${p.id}`}
              className="flex items-center justify-between gap-3 p-5 hover:bg-slate-50/60 transition-colors first:rounded-t-[28px] last:rounded-b-[28px]"
            >
              <div className="min-w-0">
                <p className="text-[13px] font-bold text-ink truncate">{p.cliente_nome}</p>
                <p className="text-[11px] font-medium text-slate-400">
                  {new Date(p.created_at).toLocaleDateString('pt-MZ', { day: 'numeric', month: 'short' })} ·{' '}
                  {p.total.toLocaleString('pt-MZ')} MT
                </p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <OrderStatusBadge status={p.status} />
                <ChevronRight size={16} className="text-slate-300" />
              </div>
            </Link>
          ))}
        </Card>
      )}
    </div>
  );
}

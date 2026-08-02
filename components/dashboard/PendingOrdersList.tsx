'use client';

import { useState } from 'react';
import Link from 'next/link';
import { PackageOpen, ChevronRight } from 'lucide-react';
import { Card, Badge, EmptyState } from '@/components/ui/Surfaces';
import { usePedidosRealtime } from '@/lib/realtime/usePedidosRealtime';
import type { Pedido } from '@/types/database';

export function PendingOrdersList({ lojaId, initialPedidos }: { lojaId: string; initialPedidos: Pedido[] }) {
  const [pedidos, setPedidos] = useState(initialPedidos);

  usePedidosRealtime(lojaId, (event, pedido) => {
    setPedidos((prev) => {
      if (event === 'INSERT' && pedido.status === 'pendente') {
        if (prev.some((p) => p.id === pedido.id)) return prev;
        return [pedido, ...prev];
      }
      if (event === 'UPDATE') {
        if (pedido.status !== 'pendente') return prev.filter((p) => p.id !== pedido.id);
        return prev.map((p) => (p.id === pedido.id ? pedido : p));
      }
      return prev;
    });
  });

  if (pedidos.length === 0) {
    return (
      <Card>
        <EmptyState
          icon={<PackageOpen size={22} />}
          title="Sem pedidos pendentes"
          subtitle="Assim que um cliente finalizar uma compra, o pedido aparece aqui em tempo real."
        />
      </Card>
    );
  }

  return (
    <Card className="divide-y divide-slate-100">
      {pedidos.map((p) => (
        <Link
          key={p.id}
          href={`/pedidos/${p.id}`}
          className="flex items-center justify-between gap-3 p-5 hover:bg-slate-50/60 transition-colors first:rounded-t-[28px] last:rounded-b-[28px]"
        >
          <div className="min-w-0">
            <p className="text-[13px] font-bold text-ink truncate">{p.cliente_nome}</p>
            <p className="text-[11px] font-medium text-slate-400">
              {p.itens.length} {p.itens.length === 1 ? 'item' : 'itens'} · {p.total.toLocaleString('pt-MZ')} MT
            </p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <Badge tone="warning">Pendente</Badge>
            <ChevronRight size={16} className="text-slate-300" />
          </div>
        </Link>
      ))}
    </Card>
  );
}

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { PackageSearch, ChevronRight } from 'lucide-react';
import { Card, Badge } from '@/components/ui/Surfaces';
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
      <Card className="flex flex-col items-center text-center py-14 px-6 gap-4">
        <div className="relative w-[72px] h-[72px]">
          <div className="absolute inset-0 rounded-full bg-brand-soft" aria-hidden />
          <div className="absolute inset-[3px] rounded-full border border-dashed border-brand/25" aria-hidden />
          <div className="absolute inset-0 flex items-center justify-center text-brand">
            <PackageSearch size={26} strokeWidth={1.75} />
          </div>
        </div>
        <div className="flex flex-col gap-1.5">
          <p className="text-sm font-bold text-ink">Os seus pedidos vão aparecer aqui</p>
          <p className="text-[12px] font-medium text-slate-400 max-w-[280px] mx-auto leading-relaxed">
            Assim que um cliente finalizar uma compra na sua loja, o pedido surge aqui em tempo real.
          </p>
        </div>
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
              {p.itens.length} {p.itens.length === 1 ? 'item' : 'itens'} · {p.total.toLocaleString('pt-MZ')} MZN
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

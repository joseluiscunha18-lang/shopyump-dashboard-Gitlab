import type { Metadata } from 'next';
import { getUserContext } from '@/lib/auth/getUserContext';
import { getPedidosByLoja } from '@/lib/queries/pedidos';
import { OrdersList } from '@/components/pedidos/OrdersList';

export const metadata: Metadata = { title: 'Pedidos | Shopyump' };

export default async function PedidosPage() {
  const ctx = await getUserContext();
  if (!ctx.loja) return null;

  const pedidos = await getPedidosByLoja(ctx.loja.id);

  return (
    <div className="flex flex-col gap-6 pt-2">
      <div>
        <h2 className="text-lg font-black text-ink tracking-tight">Pedidos</h2>
        <p className="text-[12px] font-medium text-slate-400">Histórico de encomendas</p>
      </div>
      <OrdersList lojaId={ctx.loja.id} initialPedidos={pedidos} />
    </div>
  );
}

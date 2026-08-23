import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Phone, MapPin } from 'lucide-react';
import { getUserContext } from '@/lib/auth/getUserContext';
import { getPedidoById } from '@/lib/queries/pedidos';
import { Card } from '@/components/ui/Surfaces';
import { OrderStatusBadge } from '@/components/pedidos/OrderStatusBadge';
import { OrderStatusActions } from '@/components/pedidos/OrderStatusActions';

export const metadata: Metadata = { title: 'Detalhe do pedido | Shopyump' };

export default async function PedidoDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ctx = await getUserContext();
  if (!ctx.loja) return null;

  const pedido = await getPedidoById(id);
  if (!pedido || pedido.loja_id !== ctx.loja.id) notFound();

  const whatsappHref = `https://wa.me/${pedido.cliente_telefone.replace(/\D/g, '')}`;

  return (
    <div className="flex flex-col gap-6 pt-2 max-w-xl">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-black text-ink tracking-tight">Pedido de {pedido.cliente_nome}</h2>
          <p className="text-[12px] font-medium text-slate-400">
            {new Date(pedido.created_at).toLocaleString('pt-MZ', { dateStyle: 'medium', timeStyle: 'short' })}
          </p>
        </div>
        <OrderStatusBadge status={pedido.status} />
      </div>

      <Card className="p-5 flex flex-col gap-3">
        <div className="flex items-center gap-3 text-[13px] font-semibold text-ink">
          <Phone size={15} className="text-slate-400" />
          <a href={whatsappHref} target="_blank" rel="noreferrer" className="hover:underline">
            {pedido.cliente_telefone}
          </a>
        </div>
        {pedido.cliente_endereco && (
          <div className="flex items-center gap-3 text-[13px] font-semibold text-ink">
            <MapPin size={15} className="text-slate-400" />
            {pedido.cliente_endereco}
          </div>
        )}
      </Card>

      <Card className="divide-y divide-slate-100">
        {pedido.itens.map((item, i) => (
          <div key={item.id ?? i} className="flex items-center justify-between gap-4 p-4">
            <div className="min-w-0">
              <p className="text-[13px] font-bold text-ink truncate">
                {item.quantidade}x {item.nome}
              </p>
              {(item.corSelecionada || item.tamanhoSelecionado) && (
                <p className="text-[11px] font-medium text-slate-400">
                  {[item.corSelecionada, item.tamanhoSelecionado && `Tam: ${item.tamanhoSelecionado}`].filter(Boolean).join(' · ')}
                </p>
              )}
            </div>
            <p className="text-[13px] font-black text-ink flex-shrink-0">
              {(item.preco * item.quantidade).toLocaleString('pt-MZ')} MZN
            </p>
          </div>
        ))}
        <div className="flex items-center justify-between p-4">
          <p className="text-[12px] font-bold text-slate-500 uppercase tracking-wide">Total</p>
          <p className="text-lg font-black text-ink">{pedido.total.toLocaleString('pt-MZ')} MZN</p>
        </div>
      </Card>

      <OrderStatusActions pedidoId={pedido.id} status={pedido.status} />
    </div>
  );
}

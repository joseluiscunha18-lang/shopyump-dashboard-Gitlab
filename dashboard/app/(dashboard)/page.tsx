import type { Metadata } from 'next';
import { ClipboardList, Eye, Wallet, PackageCheck } from 'lucide-react';
import { getUserContext } from '@/lib/auth/getUserContext';
import { getDashboardStats } from '@/lib/queries/stats';
import { getPedidosByLoja } from '@/lib/queries/pedidos';
import { StatCard } from '@/components/dashboard/StatCard';
import { PendingOrdersList } from '@/components/dashboard/PendingOrdersList';

export const metadata: Metadata = { title: 'Painel | Shopyump' };

export default async function DashboardHomePage() {
  const ctx = await getUserContext();
  if (!ctx.loja) {
    // Platform admin with no store of their own — nothing to show here in Phase 1.
    return <p className="pt-10 text-sm font-medium text-slate-500">Sem loja associada a esta conta.</p>;
  }

  const [stats, pedidosPendentes] = await Promise.all([
    getDashboardStats(ctx.loja.id),
    getPedidosByLoja(ctx.loja.id, 'pendente'),
  ]);

  return (
    <div className="flex flex-col gap-8 pt-2">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard
          icon={<ClipboardList size={22} />}
          label="Pedidos pendentes"
          value={String(stats.pedidosPendentes)}
          emphasis
        />
        <StatCard icon={<PackageCheck size={20} />} label="Pedidos no total" value={String(stats.pedidosTotal)} />
        <StatCard icon={<Eye size={20} />} label="Visitas hoje" value={String(stats.visitasHoje)} />
        <StatCard
          icon={<Wallet size={20} />}
          label="Receita total"
          value={stats.receitaTotal.toLocaleString('pt-MZ')}
          sub="MT"
        />
      </div>

      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-black text-ink tracking-tight">Pedidos pendentes</h2>
        </div>
        <PendingOrdersList lojaId={ctx.loja.id} initialPedidos={pedidosPendentes} />
      </div>
    </div>
  );
}

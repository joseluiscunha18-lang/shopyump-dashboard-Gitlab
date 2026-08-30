import type { Metadata } from 'next';
import { ClipboardList, Eye, Wallet, PackageCheck } from 'lucide-react';
import { getUserContext } from '@/lib/auth/getUserContext';
import { getDashboardStats } from '@/lib/queries/stats';
import { getPedidosByLoja } from '@/lib/queries/pedidos';
import { getLojaMarcos } from '@/lib/queries/lojaMarcos';
import { StatCard } from '@/components/dashboard/StatCard';
import { PendingOrdersList } from '@/components/dashboard/PendingOrdersList';
import { StoreExplorationGuide } from '@/components/dashboard/StoreExplorationGuide';

export const metadata: Metadata = { title: 'Painel | Shopyump' };

export default async function DashboardHomePage() {
  const ctx = await getUserContext();
  if (!ctx.loja) {
    // Platform admin with no store of their own — nothing to show here in Phase 1.
    return <p className="pt-10 text-sm font-medium text-slate-500">Sem loja associada a esta conta.</p>;
  }

  const [stats, pedidosPendentes, marcos] = await Promise.all([
    getDashboardStats(ctx.loja.id),
    getPedidosByLoja(ctx.loja.id, 'pendente'),
    getLojaMarcos(ctx.loja.id),
  ]);

  // "Activity" is defined by real orders having happened — not by daily
  // visit counts (which reset every day) — so a store with history but a
  // quiet day never gets mistaken for a brand-new one. See redesign notes
  // for the Início empty state.
  const hasActivity = stats.pedidosTotal > 0;

  if (!hasActivity) {
    const storeUrl = ctx.loja.slug ? `${process.env.NEXT_PUBLIC_WEB_URL ?? 'https://shopyump.vercel.app'}/loja/${ctx.loja.slug}` : null;

    return (
      <div className="flex flex-col gap-8 pt-2">
        <StoreExplorationGuide
          lojaId={ctx.loja.id}
          storeUrl={storeUrl}
          storeName={ctx.loja.nome}
          marcos={marcos}
        />

        <div>
          <h2 className="text-lg font-black text-ink tracking-tight mb-4">Pedidos</h2>
          <PendingOrdersList lojaId={ctx.loja.id} initialPedidos={pedidosPendentes} />
        </div>
      </div>
    );
  }

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
          sub="MZN"
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

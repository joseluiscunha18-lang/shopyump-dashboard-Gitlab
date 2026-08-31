import { createClient } from '@/lib/supabase/server';

export interface DashboardStats {
  pedidosPendentes: number;
  pedidosTotal: number;
  visitasHoje: number;
  /** Total de visitas desde sempre — usado no "Resumo da loja", que é
   *  cumulativo por natureza (visitasHoje continua a existir para outros
   *  usos futuros, ex.: um indicador do dia). */
  visitasTotal: number;
  /** Produtos publicados (ativos, não-rascunho) — usado no "Resumo da loja". */
  produtosCount: number;
  receitaTotal: number;
}

function startOfTodayISO() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

/**
 * Single grouped read for the dashboard home stat cards. Mirrors the
 * numbers the legacy dashboard.js computes client-side into
 * `memDashboard`, but as one server-side call instead of several
 * sequential client fetches behind skeleton placeholders.
 */
export async function getDashboardStats(lojaId: string): Promise<DashboardStats> {
  const supabase = await createClient();

  const [{ count: pendentes }, { data: pedidos }, { count: visitasHoje }, { count: visitasTotal }, { count: produtosCount }] =
    await Promise.all([
      supabase.from('pedidos').select('id', { count: 'exact', head: true }).eq('loja_id', lojaId).eq('status', 'pendente'),
      supabase.from('pedidos').select('total, status').eq('loja_id', lojaId),
      supabase
        .from('visitas')
        .select('id', { count: 'exact', head: true })
        .eq('loja_id', lojaId)
        .gte('created_at', startOfTodayISO()),
      supabase.from('visitas').select('id', { count: 'exact', head: true }).eq('loja_id', lojaId),
      supabase
        .from('produtos')
        .select('id', { count: 'exact', head: true })
        .eq('loja_id', lojaId)
        .eq('ativo', true)
        .or('rascunho.is.null,rascunho.eq.false'),
    ]);

  const receitaTotal = (pedidos ?? [])
    .filter((p) => p.status !== 'cancelado')
    .reduce((acc, p) => acc + (p.total ?? 0), 0);

  return {
    pedidosPendentes: pendentes ?? 0,
    pedidosTotal: pedidos?.length ?? 0,
    visitasHoje: visitasHoje ?? 0,
    visitasTotal: visitasTotal ?? 0,
    produtosCount: produtosCount ?? 0,
    receitaTotal,
  };
}

import { createClient } from '@/lib/supabase/server';
import type { Pedido, PedidoStatus } from '@/types/database';

export async function getPedidosByLoja(lojaId: string, status?: PedidoStatus | 'todos'): Promise<Pedido[]> {
  const supabase = await createClient();
  let query = supabase.from('pedidos').select('*').eq('loja_id', lojaId);
  if (status && status !== 'todos') query = query.eq('status', status);
  const { data, error } = await query.order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as Pedido[];
}

export async function getPedidoById(id: string): Promise<Pedido | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.from('pedidos').select('*').eq('id', id).maybeSingle();
  if (error) throw error;
  return data as Pedido | null;
}

export async function countPedidosPendentes(lojaId: string): Promise<number> {
  const supabase = await createClient();
  const { count, error } = await supabase
    .from('pedidos')
    .select('id', { count: 'exact', head: true })
    .eq('loja_id', lojaId)
    .eq('status', 'pendente');
  if (error) throw error;
  return count ?? 0;
}

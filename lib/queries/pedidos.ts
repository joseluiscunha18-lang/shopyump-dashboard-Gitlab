import { createClient } from '@/lib/supabase/client';
import type { Pedido, PedidoStatus } from '@/types/database';

const PAGINA = 1000; // limite por pedido do Supabase: pagina até trazer tudo

export async function getPedidosByLoja(lojaId: string, status?: PedidoStatus | 'todos'): Promise<Pedido[]> {
  const supabase = createClient();
  const todos: Pedido[] = [];
  for (let from = 0; ; from += PAGINA) {
    let query = supabase.from('pedidos').select('*').eq('loja_id', lojaId);
    if (status && status !== 'todos') query = query.eq('status', status);
    const { data, error } = await query.order('created_at', { ascending: false }).range(from, from + PAGINA - 1);
    if (error) throw error;
    todos.push(...((data ?? []) as Pedido[]));
    if (!data || data.length < PAGINA) break;
  }
  return todos;
}

export async function getPedidoById(id: string): Promise<Pedido | null> {
  const supabase = createClient();
  const { data, error } = await supabase.from('pedidos').select('*').eq('id', id).maybeSingle();
  if (error) throw error;
  return data as Pedido | null;
}

export async function countPedidosPendentes(lojaId: string): Promise<number> {
  const supabase = createClient();
  const { count, error } = await supabase
    .from('pedidos')
    .select('id', { count: 'exact', head: true })
    .eq('loja_id', lojaId)
    .eq('status', 'pendente');
  if (error) throw error;
  return count ?? 0;
}

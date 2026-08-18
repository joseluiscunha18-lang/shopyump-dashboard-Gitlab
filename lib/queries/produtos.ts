import { createClient } from '@/lib/supabase/server';
import { linhaParaProduto } from '@/lib/db/produtoMapper';
import type { Produto } from '@/types/database';

/**
 * Cheap head-count for places (e.g. the Início empty state) that only need
 * to know "does this store have any products yet?" without paying for the
 * full row payload getProdutosByLoja() returns.
 */
export async function getProdutosCount(lojaId: string): Promise<number> {
  const supabase = await createClient();
  const { count, error } = await supabase
    .from('produtos')
    .select('id', { count: 'exact', head: true })
    .eq('loja_id', lojaId);
  if (error) throw error;
  return count ?? 0;
}

export async function getProdutosByLoja(lojaId: string): Promise<Produto[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('produtos')
    .select('*')
    .eq('loja_id', lojaId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []).map(linhaParaProduto);
}

export async function getProdutoById(id: string): Promise<Produto | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.from('produtos').select('*').eq('id', id).maybeSingle();
  if (error) throw error;
  return data ? linhaParaProduto(data) : null;
}

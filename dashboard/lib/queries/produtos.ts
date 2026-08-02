import { createClient } from '@/lib/supabase/server';
import type { Produto } from '@/types/database';

export async function getProdutosByLoja(lojaId: string): Promise<Produto[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('produtos')
    .select('*')
    .eq('loja_id', lojaId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as Produto[];
}

export async function getProdutoById(id: string): Promise<Produto | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.from('produtos').select('*').eq('id', id).maybeSingle();
  if (error) throw error;
  return data as Produto | null;
}

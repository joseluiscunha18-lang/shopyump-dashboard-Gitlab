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

export interface ProdutoPreview {
  id: string;
  nome: string;
  preco: number;
  imagem: string;
}

/**
 * Versão "leve" de getProdutosByLoja para quem só precisa mostrar
 * 3-4 produtos numa pré-visualização (ex.: "Personalizar loja"): pede só
 * as colunas necessárias e já filtra/limita no próprio Supabase, em vez
 * de trazer a tabela inteira e cortar no cliente. Em ligações lentas
 * (VPN, 3G) isto é a diferença entre a prévia aparecer em instantes ou
 * ficar presa no skeleton de app/(dashboard)/loading.tsx enquanto a
 * página inteira espera pelo payload completo dos produtos.
 */
export async function getProdutosParaPreview(lojaId: string, limite = 4): Promise<ProdutoPreview[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('produtos')
    .select('id, nome, preco, fotos')
    .eq('loja_id', lojaId)
    .eq('ativo', true)
    .eq('rascunho', false)
    .order('created_at', { ascending: false })
    .limit(limite);
  if (error) throw error;
  return (data ?? []).map((row) => ({
    id: row.id as string,
    nome: row.nome as string,
    preco: row.preco as number,
    imagem: ((row.fotos as string[] | null) ?? [])[0] ?? '',
  }));
}

export async function getProdutoById(id: string): Promise<Produto | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.from('produtos').select('*').eq('id', id).maybeSingle();
  if (error) throw error;
  return data ? linhaParaProduto(data) : null;
}

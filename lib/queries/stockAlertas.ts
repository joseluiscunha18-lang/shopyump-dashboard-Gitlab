import { createClient } from '@/lib/supabase/client';
import { LIMITE_STOCK_BAIXO, MAX_AVISOS_STOCK, type AlertaStock } from '@/lib/notificacoes/gerar';

/**
 * Produtos publicados, com controlo de stock, a zero ou abaixo do limite. Consulta leve (só 3 colunas)
 * para as notificações; a segurança é a RLS (o dono só vê os seus produtos).
 */
export async function getAlertasStock(lojaId: string): Promise<AlertaStock[]> {
  const { data, error } = await createClient()
    .from('produtos')
    .select('id, nome, estoque_qtd')
    .eq('loja_id', lojaId)
    .eq('controlar_estoque', true)
    .eq('ativo', true)
    .or('rascunho.is.null,rascunho.eq.false')
    .lte('estoque_qtd', LIMITE_STOCK_BAIXO)
    .order('estoque_qtd', { ascending: true })
    .limit(MAX_AVISOS_STOCK);
  if (error) throw error;
  return (data ?? []).map((r) => ({ id: r.id as string, nome: (r.nome as string) ?? 'Produto', qtd: Math.max(0, Number(r.estoque_qtd ?? 0)) }));
}

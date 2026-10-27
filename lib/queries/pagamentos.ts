import { createClient } from '@/lib/supabase/client';
import { normalizarPagamentos, type Payments } from '@/lib/settings/model';

/**
 * Pagamentos configurados da loja (tabela `loja_pagamentos`, visível só ao dono por RLS).
 * Devolve null se ainda não há configuração — ou se a leitura falhar: o painel nunca deve
 * deixar de abrir por causa disto (aparecem os valores por omissão).
 */
export async function getPagamentos(lojaId: string): Promise<Payments | null> {
  try {
    const { data, error } = await createClient()
      .from('loja_pagamentos')
      .select('config')
      .eq('loja_id', lojaId)
      .maybeSingle();
    if (error || !data) return null;
    return normalizarPagamentos(data.config);
  } catch {
    return null;
  }
}

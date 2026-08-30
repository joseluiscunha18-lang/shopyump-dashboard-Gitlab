import { createClient } from '@/lib/supabase/server';
import type { LojaMarco, MarcoOnboarding } from '@/types/database';

/**
 * Todos os marcos de onboarding já registados para a loja, indexados por
 * nome do marco — nunca inclui marcos ainda não atingidos (não existe
 * "linha vazia"; a ausência de uma chave é o próprio sinal de "ainda não").
 * Ver migration_loja_marcos.sql e ORDEM_MARCOS_ONBOARDING.
 */
export async function getLojaMarcos(
  lojaId: string,
): Promise<Partial<Record<MarcoOnboarding, LojaMarco>>> {
  const supabase = await createClient();
  const { data, error } = await supabase.from('loja_marcos').select('*').eq('loja_id', lojaId);
  if (error) throw error;

  const porMarco: Partial<Record<MarcoOnboarding, LojaMarco>> = {};
  for (const row of (data ?? []) as LojaMarco[]) {
    porMarco[row.marco] = row;
  }
  return porMarco;
}

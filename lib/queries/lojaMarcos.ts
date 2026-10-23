import { createClient } from '@/lib/supabase/client';
import type { LojaMarco, MarcoOnboarding } from '@/types/database';

/**
 * Todos os marcos de onboarding já registados para a loja, indexados por
 * nome do marco — a ausência de uma chave é o próprio sinal de "ainda não".
 */
export async function getLojaMarcos(
  lojaId: string,
): Promise<Partial<Record<MarcoOnboarding, LojaMarco>>> {
  const supabase = createClient();
  const { data, error } = await supabase.from('loja_marcos').select('*').eq('loja_id', lojaId);
  if (error) throw error;

  const porMarco: Partial<Record<MarcoOnboarding, LojaMarco>> = {};
  for (const row of (data ?? []) as LojaMarco[]) porMarco[row.marco] = row;
  return porMarco;
}

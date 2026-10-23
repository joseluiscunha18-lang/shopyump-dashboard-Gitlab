import { createClient } from '@/lib/supabase/client';

const PAGINA = 1000;
const DIA = 86400000;

/** Início do dia (hora local) de um timestamp. */
export function inicioDoDia(t: number): number {
  const d = new Date(t);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

/**
 * Visitas reais da loja entre `inicio` e `fim` (ms), agrupadas por dia local
 * (início do dia → contagem). Pagina de 1000 em 1000. Mapa vazio = sem registo.
 */
export async function getVisitasPorDia(lojaId: string, inicio: number, fim: number): Promise<Map<number, number>> {
  const supabase = createClient();
  const porDia = new Map<number, number>();
  for (let from = 0; ; from += PAGINA) {
    const { data, error } = await supabase
      .from('visitas')
      .select('created_at')
      .eq('loja_id', lojaId)
      .gte('created_at', new Date(inicio).toISOString())
      .lt('created_at', new Date(fim).toISOString())
      .order('created_at', { ascending: true })
      .range(from, from + PAGINA - 1);
    if (error) throw error;
    for (const v of data ?? []) {
      const dia = inicioDoDia(new Date(v.created_at as string).getTime());
      porDia.set(dia, (porDia.get(dia) ?? 0) + 1);
    }
    if (!data || data.length < PAGINA) break;
  }
  return porDia;
}

/** Total de visitas no intervalo (para o resumo do Início). */
export async function contarVisitas(lojaId: string, inicio: number, fim: number): Promise<number> {
  const supabase = createClient();
  const { count, error } = await supabase
    .from('visitas')
    .select('id', { count: 'exact', head: true })
    .eq('loja_id', lojaId)
    .gte('created_at', new Date(inicio).toISOString())
    .lt('created_at', new Date(fim).toISOString());
  if (error) throw error;
  return count ?? 0;
}

export { DIA };

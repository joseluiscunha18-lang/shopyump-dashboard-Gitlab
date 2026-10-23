import { createClient } from '@/lib/supabase/client';
import type { Loja } from '@/types/database';

// As páginas do painel correm no navegador: as queries usam o cliente do navegador
// e a segurança é garantida pelas políticas RLS da base de dados.

export async function getLojaByPerfilId(perfilId: string): Promise<Loja | null> {
  const supabase = createClient();
  const { data, error } = await supabase.from('lojas').select('*').eq('perfil_id', perfilId).maybeSingle();
  if (error) throw error;
  return data as Loja | null;
}

export async function isSlugAvailable(slug: string): Promise<boolean> {
  const supabase = createClient();
  const { data, error } = await supabase.from('lojas').select('id').eq('slug', slug).maybeSingle();
  if (error) throw error;
  return !data;
}

/** Dos endereços indicados, devolve os que já estão ocupados por outra loja. */
export async function getSlugsOcupados(slugs: string[]): Promise<string[]> {
  if (slugs.length === 0) return [];
  const supabase = createClient();
  const { data, error } = await supabase.from('lojas').select('slug').in('slug', slugs);
  if (error) throw error;
  return (data ?? []).map((r) => r.slug as string);
}

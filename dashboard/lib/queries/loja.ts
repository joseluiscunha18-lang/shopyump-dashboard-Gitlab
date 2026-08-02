import { createClient } from '@/lib/supabase/server';
import type { Loja } from '@/types/database';

export async function getLojaByPerfilId(perfilId: string): Promise<Loja | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('lojas')
    .select('*')
    .eq('perfil_id', perfilId)
    .maybeSingle();
  if (error) throw error;
  return data as Loja | null;
}

export async function isSlugAvailable(slug: string): Promise<boolean> {
  const supabase = await createClient();
  const { data, error } = await supabase.from('lojas').select('id').eq('slug', slug).maybeSingle();
  if (error) throw error;
  return !data;
}

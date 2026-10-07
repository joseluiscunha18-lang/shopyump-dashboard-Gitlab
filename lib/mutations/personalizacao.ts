'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { isValidLumeCustomization } from '@/lib/store/themes/lume/lib/personalizacao';
import type { ActionResult } from '@/lib/mutations/loja';

/**
 * Guarda a customização feita no editor ("Personalizar loja") na loja do
 * utilizador autenticado. A loja é sempre a do próprio utilizador
 * (`perfil_id = user.id`): o id da loja NUNCA vem do cliente, por isso ninguém
 * consegue escrever na loja de outro (a RLS do Supabase é a 2.ª barreira).
 *
 * Valida a forma e o tamanho antes de gravar — a loja pública lê isto de volta
 * (lib/store/themes/lume/lib/personalizacao.ts) e nunca deve partir por causa
 * de dados mal formados.
 */
export async function saveTemaPersonalizacao(customization: unknown): Promise<ActionResult> {
  if (!isValidLumeCustomization(customization)) {
    return { ok: false, error: 'Personalização inválida ou demasiado grande.' };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: 'Sessão expirada. Inicia sessão novamente.' };

  const { data: loja, error: lojaError } = await supabase
    .from('lojas')
    .select('id, slug')
    .eq('perfil_id', user.id)
    .maybeSingle();
  if (lojaError) return { ok: false, error: lojaError.message };
  if (!loja) return { ok: false, error: 'Loja não encontrada.' };

  const { error } = await supabase
    .from('lojas')
    .update({ tema_personalizacao: customization, theme_id: customization.themeId })
    .eq('id', loja.id);
  if (error) return { ok: false, error: error.message };

  // A loja pública é cacheada (ISR, 60s): invalida já a página desta loja para
  // o visitante ver a alteração logo após "Guardar".
  revalidatePath(`/loja/${loja.slug}`);
  revalidatePath('/personalizar');
  return { ok: true };
}

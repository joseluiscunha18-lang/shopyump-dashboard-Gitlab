'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import type { LojaUpdate } from '@/types/database';

export interface ActionResult {
  ok: boolean;
  error?: string;
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '');
}

/**
 * Creates the `lojas` row that completes onboarding — the same moment
 * that flips middleware's "session, no loja" branch to "session + loja".
 * Business rule preserved from onboarding.js: slug is derived from the
 * shop name and must be unique.
 */
export async function completeOnboarding(input: {
  nome: string;
  whatsapp: string;
}): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: 'Sessão expirada. Inicia sessão novamente.' };

  const slug = slugify(input.nome);
  if (!slug) return { ok: false, error: 'Nome da loja inválido.' };

  const { data: existing } = await supabase.from('lojas').select('id').eq('slug', slug).maybeSingle();
  if (existing) return { ok: false, error: 'Este nome de loja já está em uso. Escolhe outro.' };

  const { error } = await supabase.from('lojas').insert({
    perfil_id: user.id,
    slug,
    nome: input.nome,
    whatsapp: input.whatsapp,
  });

  if (error) return { ok: false, error: error.message };

  revalidatePath('/', 'layout');
  return { ok: true };
}

export async function updateLoja(lojaId: string, patch: LojaUpdate): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase.from('lojas').update(patch).eq('id', lojaId);
  if (error) return { ok: false, error: error.message };

  revalidatePath('/loja');
  revalidatePath('/', 'layout');
  return { ok: true };
}

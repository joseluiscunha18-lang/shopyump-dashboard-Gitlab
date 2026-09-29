'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import type { LojaUpdate } from '@/types/database';
import { isReservedSubdomain, isValidSubdomain } from '@/lib/domains';
import { SOBRE_PADRAO, ENTREGA_PADRAO, TERMOS_PADRAO } from '@/lib/store/institutionalDefaults';

export interface ActionResult {
  ok: boolean;
  error?: string;
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-{2,}/g, '-')
    .replace(/^-+|-+$/g, '');
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
  // O slug passa a ser o subdomínio (slug.shopyump.com): tem de ser um nome DNS válido e não reservado.
  if (!isValidSubdomain(slug)) return { ok: false, error: 'Nome da loja inválido. Usa letras, números e hífens (máx. 63 caracteres).' };
  if (isReservedSubdomain(slug)) return { ok: false, error: 'Este nome não está disponível. Escolhe outro.' };

  const { data: existing } = await supabase.from('lojas').select('id').eq('slug', slug).maybeSingle();
  if (existing) return { ok: false, error: 'Este nome de loja já está em uso. Escolhe outro.' };

  const { error } = await supabase.from('lojas').insert({
    perfil_id: user.id,
    slug,
    nome: input.nome,
    whatsapp: input.whatsapp,
    // Tema por omissão para lojas novas. Explícito aqui em vez de confiar
    // no default da coluna na BD — o tema 'default' foi descontinuado,
    // só existe o 'lume' (ver lib/store/themes/registry.tsx).
    theme_id: 'lume',
    // Conteúdo institucional genérico e FUNCIONAL desde o dia 1 — ver
    // lib/store/institutionalDefaults.ts. Ao contrário dos produtos de
    // demonstração, isto não desaparece com o 1º produto: fica ativo até
    // o lojista editar ou remover explicitamente.
    conteudo_sobre: SOBRE_PADRAO,
    conteudo_entrega: ENTREGA_PADRAO,
    conteudo_termos: TERMOS_PADRAO,
    mostrar_sobre: true,
    mostrar_entrega: true,
    mostrar_termos: true,
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

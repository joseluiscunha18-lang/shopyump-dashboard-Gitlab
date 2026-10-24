'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { produtoParaLinha } from '@/lib/db/produtoMapper';
import { limparImagensR2 } from '@/lib/r2/cleanup';
import { collectR2Urls, resolvePublicBase } from '@/lib/r2/shared';
import type { ProdutoInsert, ProdutoUpdate } from '@/types/database';
import type { ActionResult } from '@/lib/mutations/loja';

export async function createProduto(input: ProdutoInsert): Promise<ActionResult & { id?: string }> {
  const supabase = await createClient();
  const { data, error } = await supabase.from('produtos').insert(produtoParaLinha(input)).select('id').single();
  if (error) return { ok: false, error: error.message };

  revalidatePath('/produtos');
  return { ok: true, id: data.id };
}

/** URLs R2 de um produto (fotos + variantes), para a limpeza de imagens que deixaram de ser usadas. */
async function imagensR2DoProduto(supabase: Awaited<ReturnType<typeof createClient>>, id: string) {
  const { data } = await supabase.from('produtos').select('loja_id, fotos, variantes').eq('id', id).maybeSingle();
  if (!data) return null;
  return { lojaId: data.loja_id as string, urls: collectR2Urls(data, resolvePublicBase(process.env.R2_PUBLIC_URL)) };
}

export async function updateProduto(id: string, patch: ProdutoUpdate): Promise<ActionResult> {
  const supabase = await createClient();
  // Só quando o patch mexe nas imagens: guarda as de antes para limpar as que saíram.
  const mexeEmImagens = 'fotos' in patch || 'variantes' in patch;
  const antes = mexeEmImagens ? await imagensR2DoProduto(supabase, id) : null;

  const { error } = await supabase.from('produtos').update(produtoParaLinha(patch)).eq('id', id);
  if (error) return { ok: false, error: error.message };

  if (antes) await limparImagensR2(antes.lojaId, antes.urls);
  revalidatePath('/produtos');
  return { ok: true };
}

export async function toggleProdutoAtivo(id: string, ativo: boolean): Promise<ActionResult> {
  return updateProduto(id, { ativo });
}

export async function duplicateProduto(id: string): Promise<ActionResult & { id?: string }> {
  const supabase = await createClient();
  const { data: original, error: fetchError } = await supabase
    .from('produtos')
    .select('*')
    .eq('id', id)
    .single();
  if (fetchError || !original) return { ok: false, error: fetchError?.message ?? 'Produto não encontrado.' };

  const { id: _id, created_at: _createdAt, ...rest } = original;
  const { data, error } = await supabase
    .from('produtos')
    .insert({ ...rest, nome: `${rest.nome} (cópia)`, ativo: false })
    .select('id')
    .single();
  if (error) return { ok: false, error: error.message };

  revalidatePath('/produtos');
  return { ok: true, id: data.id };
}

export async function deleteProduto(id: string): Promise<ActionResult> {
  const supabase = await createClient();
  const antes = await imagensR2DoProduto(supabase, id);
  const { error } = await supabase.from('produtos').delete().eq('id', id);
  if (error) return { ok: false, error: error.message };

  if (antes) await limparImagensR2(antes.lojaId, antes.urls);
  revalidatePath('/produtos');
  return { ok: true };
}

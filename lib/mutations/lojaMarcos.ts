'use server';

import { createClient } from '@/lib/supabase/server';
import type { MarcoOnboarding } from '@/types/database';

export interface ActionResult {
  ok: boolean;
  error?: string;
}

/**
 * Marca um marco como dispensado (fechado pelo usuário) — nunca mais
 * volta a aparecer como "próximo passo". Usa upsert porque a linha pode
 * ainda não existir (ex.: dispensar 'partilhar_loja' sem nunca ter
 * chegado a partilhar) — nesse caso nasce já dispensada, sem
 * `concluido_em`, o que é exatamente o comportamento certo (dispensado
 * ≠ concluído).
 */
export async function dispensarMarco(lojaId: string, marco: MarcoOnboarding): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase
    .from('loja_marcos')
    .upsert({ loja_id: lojaId, marco, dispensado: true }, { onConflict: 'loja_id,marco' });
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

/**
 * Marca um marco como concluído. Só é preciso chamar isto para marcos que nascem de uma AÇÃO do
 * utilizador sem trigger de base de dados por trás (hoje só 'partilhar_loja'): 'primeiro_produto',
 * 'personalizar_loja' e 'configurar_pagamentos' são concluídos por triggers (ver
 * supabase/migration_orientacoes_onboarding.sql), a partir do que foi realmente guardado.
 *
 * Idempotente: copiar o link várias vezes não repõe a data da 1.ª conclusão e não apaga uma dispensa
 * anterior (concluída ≠ dispensada, e uma concluída prevalece).
 */
export async function marcarMarcoConcluido(lojaId: string, marco: MarcoOnboarding): Promise<ActionResult> {
  const supabase = await createClient();
  // 1) garante a linha (se não existir, nasce já concluída)
  const { error: insErr } = await supabase
    .from('loja_marcos')
    .upsert(
      { loja_id: lojaId, marco, concluido_em: new Date().toISOString() },
      { onConflict: 'loja_id,marco', ignoreDuplicates: true },
    );
  if (insErr) return { ok: false, error: insErr.message };
  // 2) se já existia (ex.: só dispensada), conclui-a sem mexer no resto
  const { error: updErr } = await supabase
    .from('loja_marcos')
    .update({ concluido_em: new Date().toISOString() })
    .eq('loja_id', lojaId)
    .eq('marco', marco)
    .is('concluido_em', null);
  if (updErr) return { ok: false, error: updErr.message };
  return { ok: true };
}

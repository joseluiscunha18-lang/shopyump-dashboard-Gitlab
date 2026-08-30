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
 * Marca um marco como concluído. Só é preciso chamar isto explicitamente
 * para marcos que nascem de uma AÇÃO do usuário sem trigger de base de
 * dados por trás (hoje, só 'partilhar_loja' — 'primeiro_produto' e
 * 'personalizar_loja' já são geridos automaticamente por triggers, ver
 * migration_loja_marcos.sql).
 */
export async function marcarMarcoConcluido(lojaId: string, marco: MarcoOnboarding): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase
    .from('loja_marcos')
    .upsert(
      { loja_id: lojaId, marco, concluido_em: new Date().toISOString() },
      { onConflict: 'loja_id,marco' },
    );
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

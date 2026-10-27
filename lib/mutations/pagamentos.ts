'use server';

import { createClient } from '@/lib/supabase/server';
import { validarPagamentos } from '@/lib/settings/model';
import type { ActionResult } from '@/lib/mutations/loja';

/**
 * Guarda os métodos de pagamento da loja do utilizador autenticado. O id da loja nunca vem do
 * browser (é sempre a loja de `perfil_id = utilizador`), e a RLS de `loja_pagamentos` é a 2.ª barreira.
 *
 * É este registo que a base de dados usa para concluir a orientação "Configura os pagamentos"
 * (trigger: pelo menos um método configurado e ativo) — ver supabase/migration_orientacoes_onboarding.sql.
 */
export async function salvarPagamentos(input: unknown): Promise<ActionResult & { persistido?: boolean }> {
  const v = validarPagamentos(input);
  if (!v.ok) return { ok: false, error: v.error };

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: 'Sessão expirada. Inicia sessão novamente.' };

  const { data: loja, error: lojaError } = await supabase.from('lojas').select('id').eq('perfil_id', user.id).maybeSingle();
  if (lojaError) return { ok: false, error: lojaError.message };
  if (!loja) return { ok: false, error: 'Loja não encontrada.' };

  const { error } = await supabase
    .from('loja_pagamentos')
    .upsert({ loja_id: loja.id, config: v.value, updated_at: new Date().toISOString() }, { onConflict: 'loja_id' });
  if (error) {
    // Tabela ainda não criada (migração por aplicar): comporta-se como antes — o ecrã atualiza, nada é gravado.
    // Assim um deploy feito antes da migração não parte o "Guardar". Qualquer outro erro é mostrado.
    if (error.code === '42P01' || error.code === 'PGRST205') {
      console.warn('[pagamentos] tabela loja_pagamentos em falta — aplicar supabase/migration_orientacoes_onboarding.sql');
      return { ok: true, persistido: false };
    }
    return { ok: false, error: error.message };
  }
  return { ok: true, persistido: true };
}

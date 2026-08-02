'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import type { PedidoStatus } from '@/types/database';
import type { ActionResult } from '@/lib/mutations/loja';

/**
 * Status transitions preserved from pedidos.js: an order moves forward
 * through pendente → confirmado → enviado → concluido, or can be
 * cancelled from pendente/confirmado. No new statuses are introduced.
 */
export async function updatePedidoStatus(id: string, status: PedidoStatus): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase.from('pedidos').update({ status }).eq('id', id);
  if (error) return { ok: false, error: error.message };

  revalidatePath('/pedidos');
  revalidatePath('/');
  return { ok: true };
}

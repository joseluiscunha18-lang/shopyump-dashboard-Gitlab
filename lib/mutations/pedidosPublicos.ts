import { createPublicClient } from '@/lib/supabase/publicClient';
import type { PedidoItem } from '@/types/database';

/**
 * Regista um pedido feito na LOJA PÚBLICA (checkout por WhatsApp), para
 * aparecer em "Pedidos" no dashboard (e gerar a notificação).
 *
 * Usa a função SQL `criar_pedido_publico` (ver supabase/pedidos_publicos.sql).
 * Se essa função ainda não existir na base de dados, tenta um INSERT directo
 * (precisa de uma política RLS que permita INSERT a anónimos em `pedidos`).
 */
export interface NovoPedidoPublico {
  lojaId: string;
  nome: string;
  telefone: string;
  endereco: string;
  itens: PedidoItem[];
  total: number;
}

export type CriarPedidoResultado = { ok: true; id: string } | { ok: false; error: string };

export async function criarPedidoPublico(p: NovoPedidoPublico): Promise<CriarPedidoResultado> {
  const supabase = createPublicClient();

  const rpc = await supabase.rpc('criar_pedido_publico', {
    p_loja_id: p.lojaId,
    p_nome: p.nome,
    p_telefone: p.telefone,
    p_endereco: p.endereco,
    p_itens: p.itens,
    p_total: p.total,
  });
  if (!rpc.error && rpc.data) return { ok: true, id: String(rpc.data) };

  // Função inexistente (SQL ainda não executado) → tenta INSERT directo.
  const semFuncao = rpc.error && (rpc.error.code === 'PGRST202' || rpc.error.code === '42883');
  if (!semFuncao) return { ok: false, error: rpc.error?.message ?? 'Não foi possível registar o pedido.' };

  const id = crypto.randomUUID();
  const ins = await supabase.from('pedidos').insert({
    id,
    loja_id: p.lojaId,
    cliente_nome: p.nome,
    cliente_telefone: p.telefone,
    cliente_endereco: p.endereco,
    itens: p.itens,
    total: p.total,
    status: 'pendente',
  });
  if (ins.error) return { ok: false, error: ins.error.message };
  return { ok: true, id };
}

/** Código curto igual ao mostrado no dashboard (#ABC123). */
export const codigoPedido = (id: string) => `#${id.replace(/-/g, '').slice(0, 6).toUpperCase()}`;

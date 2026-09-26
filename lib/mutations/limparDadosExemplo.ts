'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';

/**
 * "Remover todos os dados de exemplo com 1 clique" — limpa os textos
 * institucionais genéricos (voltam a null, escondidos) para o lojista
 * começar a loja pública totalmente em branco, se preferir.
 *
 * Nota: NÃO existe nada a apagar sobre "produtos de demonstração" aqui
 * — esses nunca chegam a ser gravados na base de dados (são um
 * fallback do tema, só visual, ver lib/store/themes/default/demo/) e já
 * desaparecem sozinhos assim que a loja tem 1 produto real. Este botão
 * só afeta o conteúdo institucional, que é a única parte dos dados de
 * exemplo que é gravada de facto.
 */
export async function limparDadosExemplo(lojaId: string): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createClient();
  const { error } = await supabase
    .from('lojas')
    .update({
      conteudo_sobre: null,
      conteudo_entrega: null,
      conteudo_termos: null,
      mostrar_sobre: false,
      mostrar_entrega: false,
      mostrar_termos: false,
    })
    .eq('id', lojaId);

  if (error) return { ok: false, error: error.message };
  revalidatePath('/loja');
  return { ok: true };
}

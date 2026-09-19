import { createClient as createSupabaseClient, type SupabaseClient } from '@supabase/supabase-js';

/**
 * Cliente Supabase para a LOJA PÚBLICA (/loja/[slug]) — deliberadamente
 * diferente de `lib/supabase/server.ts`.
 *
 * `server.ts` lê `cookies()` a cada pedido (sessão do vendedor logado),
 * o que obriga o Next.js a tratar a rota como dinâmica — nunca pode ser
 * cacheada/servida estaticamente. A loja pública é vista por milhares de
 * visitantes anónimos que NUNCA têm sessão; ler cookies aí é trabalho
 * desperdiçado em cada pedido e impede o `revalidate` (ISR) de funcionar
 * a sério, que é exactamente o que precisamos para aguentar escala.
 *
 * Por isso este cliente:
 * - não depende de `cookies()` / `next/headers` — pode ser criado fora
 *   do ciclo de pedido e reutilizado;
 * - usa sempre a chave anon — os dados devolvidos têm de estar cobertos
 *   por políticas RLS de LEITURA PÚBLICA em `lojas` e `produtos`
 *   (confirmar/criar essas políticas no Supabase antes disto ir a
 *   produção — sem RLS pública, as queries abaixo devolvem vazio).
 *
 * Nunca usar este cliente para nada que precise de saber "quem está
 * logado" ou para escrever dados sensíveis — é só para leitura pública.
 */
let cached: SupabaseClient | null = null;

export function createPublicClient(): SupabaseClient {
  if (!cached) {
    cached = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { auth: { persistSession: false, autoRefreshToken: false } }
    );
  }
  return cached;
}

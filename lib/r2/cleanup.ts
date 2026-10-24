import { createClient } from '@/lib/supabase/server';
import { deleteObject, getR2Config } from '@/lib/r2/server';
import {
  collectR2Urls,
  keyFromPublicUrl,
  R2_LOJAS_PREFIX,
  R2_PRODUTOS_PREFIX,
} from '@/lib/r2/shared';

/**
 * Limpeza segura de imagens no R2 (só no servidor, sempre DEPOIS da alteração na base de dados).
 *
 * Só apaga um objeto se TODAS estas condições forem verdadeiras:
 *  1. é nosso (domínio R2) e está na pasta da loja indicada (`produtos/<loja>/` ou `lojas/<loja>/`);
 *  2. já não é usado por nenhum produto da loja (fotos e variantes — inclui cópias «Duplicar produto»);
 *  3. já não é o banner nem aparece na personalização do tema da loja;
 *  4. não aparece em nenhum pedido (o histórico de pedidos guarda a imagem do produto).
 *
 * Qualquer dúvida ou erro numa verificação → NÃO apaga. Nunca lança erro (a ação do utilizador
 * não pode falhar por causa da limpeza). Imagens antigas do Supabase nunca são tocadas.
 */
export async function limparImagensR2(lojaId: string, candidatos: string[]): Promise<void> {
  try {
    const cfg = getR2Config();
    if (!cfg || candidatos.length === 0) return;

    const pastas = [`${R2_PRODUTOS_PREFIX}/${lojaId}/`, `${R2_LOJAS_PREFIX}/${lojaId}/`];
    const alvos = new Map<string, string>(); // chave → url
    for (const url of new Set(candidatos)) {
      const key = keyFromPublicUrl(url, cfg.publicBase);
      if (key && pastas.some((p) => key.startsWith(p))) alvos.set(key, url);
    }
    if (alvos.size === 0) return;

    const supabase = await createClient();

    // 2 + 3: o que ainda está em uso na loja (estado JÁ gravado)
    const [{ data: produtos, error: e1 }, { data: loja, error: e2 }] = await Promise.all([
      supabase.from('produtos').select('fotos, variantes').eq('loja_id', lojaId),
      supabase.from('lojas').select('banner_url, tema_personalizacao').eq('id', lojaId).maybeSingle(),
    ]);
    if (e1 || e2) return;
    const emUso = new Set(
      [...collectR2Urls(produtos, cfg.publicBase), ...collectR2Urls(loja, cfg.publicBase)]
    );
    const textoLoja = JSON.stringify(loja ?? {});

    for (const [key, url] of alvos) {
      if (emUso.has(url) || textoLoja.includes(key)) continue;

      // 4: histórico de pedidos (itens[].imagem / itens[].imagens[])
      const [a, b] = await Promise.all([
        supabase.from('pedidos').select('id').eq('loja_id', lojaId).contains('itens', [{ imagem: url }]).limit(1),
        supabase.from('pedidos').select('id').eq('loja_id', lojaId).contains('itens', [{ imagens: [url] }]).limit(1),
      ]);
      if (a.error || b.error || (a.data?.length ?? 0) > 0 || (b.data?.length ?? 0) > 0) continue;

      await deleteObject(cfg, key);
    }
  } catch (err) {
    console.warn('[R2] limpeza ignorada:', err instanceof Error ? err.message : err);
  }
}

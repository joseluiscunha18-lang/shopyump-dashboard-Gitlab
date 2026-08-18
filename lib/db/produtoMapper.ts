import type { Produto } from '@/types/database';

/**
 * A tabela `produtos` no Supabase guarda o estoque em DUAS colunas —
 * `controlar_estoque` (boolean) e `estoque_qtd` (integer) — mas o resto da
 * app trabalha com um único campo `estoque: number | null`, onde `null`
 * significa "não controla estoque para este produto" (ver ProductForm.tsx).
 * Nenhum outro ficheiro deve falar diretamente com `controlar_estoque`/
 * `estoque_qtd` — é só aqui que os dois mundos se tocam.
 *
 * Isto existe porque o erro "Could not find the 'estoque' column of
 * 'produtos'" acontecia sempre que a app tentava gravar — a coluna nunca
 * existiu com esse nome.
 */

/** DB → app: junta as duas colunas no campo único `estoque`. */
export function linhaParaProduto(row: Record<string, unknown>): Produto {
  const { controlar_estoque, estoque_qtd, ...resto } = row;
  return {
    ...resto,
    estoque: controlar_estoque ? ((estoque_qtd as number | null) ?? 0) : null,
  } as Produto;
}

/**
 * App → DB: separa `estoque` nas duas colunas reais. Só mexe nisto quando
 * a chave `estoque` está mesmo presente no payload — um patch parcial como
 * `{ ativo: false }` (ex: `toggleProdutoAtivo`) não deve, de repente,
 * zerar o estoque só por não ter mencionado o campo.
 */
export function produtoParaLinha<T extends Record<string, unknown>>(payload: T): Record<string, unknown> {
  if (!('estoque' in payload)) return payload;
  const { estoque, ...resto } = payload;
  return {
    ...resto,
    controlar_estoque: typeof estoque === 'number',
    estoque_qtd: typeof estoque === 'number' ? estoque : 0,
  };
}

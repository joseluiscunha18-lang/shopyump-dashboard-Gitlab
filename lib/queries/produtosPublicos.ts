import { createPublicClient } from '@/lib/supabase/publicClient';
import type { ProdutoVariantes } from '@/types/database';

/**
 * Forma pública de um produto — o que qualquer tema precisa para
 * mostrar um cartão de produto. Note a ausência de `estoque` bruto,
 * `mais_opcoes`, `rascunho`: são detalhes de gestão do vendedor, não da
 * vitrine. Se um tema futuro precisar de mostrar "últimas unidades",
 * acrescenta-se um campo derivado aqui (ex.: `emFalta: boolean`), não o
 * `estoque` interno directamente.
 */
export interface ProdutoPublico {
  id: string;
  nome: string;
  preco: number;
  preco_promo: number | null;
  categoria: string;
  descricao: string | null;
  fotos: string[];
  /**
   * Variantes (cor/tamanho/etc.) do produto — a mesma estrutura gravada
   * pelo dashboard em `produtos.variantes` (ver ProdutoVariantes). `null`
   * = produto sem variantes, vende-se só com preço/estoque próprios.
   */
  variantes: ProdutoVariantes | null;
}

const PRODUTO_PUBLICO_COLUNAS = 'id, nome, preco, preco_promo, categoria, descricao, fotos, variantes';

/** Nº de produtos por página — ver nota de paginação em getProdutosPublicos. */
const TAMANHO_PAGINA_PADRAO = 60;

/**
 * Produtos visíveis na loja pública: só `ativo` e não `rascunho`.
 *
 * Escala: por agora traz até `limite` produtos numa única página — para
 * a maioria das lojas (dezenas/poucas centenas de produtos) isto chega.
 * Uma loja com milhares de produtos vai precisar de paginação real
 * (usar `offset`/um cursor por `created_at`) antes de remover este
 * limite — a assinatura já está pronta para isso (`offset`), só falta a
 * UI de "carregar mais"/scroll infinito no tema que vier a precisar.
 *
 * Índice recomendado no Supabase para isto continuar rápido à medida
 * que o catálogo cresce: `produtos (loja_id, ativo, rascunho, created_at desc)`.
 */
export async function getProdutosPublicos(
  lojaId: string,
  { limite = TAMANHO_PAGINA_PADRAO, offset = 0 }: { limite?: number; offset?: number } = {}
): Promise<ProdutoPublico[]> {
  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from('produtos')
    .select(PRODUTO_PUBLICO_COLUNAS)
    .eq('loja_id', lojaId)
    .eq('ativo', true)
    .eq('rascunho', false)
    .order('created_at', { ascending: false })
    .range(offset, offset + limite - 1);
  if (error) throw error;
  return (data ?? []) as ProdutoPublico[];
}

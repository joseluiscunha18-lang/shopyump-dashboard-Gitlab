import type { ProdutoCombinacao, ProdutoOpcao } from '@/types/database';

/**
 * Gera o produto cartesiano dos valores de todas as opções (só as que já
 * têm pelo menos um valor). Reaproveita preço/estoque/peso/imagens/estado
 * de combinações existentes quando a chave coincide, para não perder
 * dados já preenchidos ao adicionar/remover um valor de opção.
 *
 * As imagens NUNCA são atribuídas automaticamente aqui — cada combinação
 * nasce sem imagens próprias (usa a galeria geral do produto) até o
 * vendedor escolher explicitamente. Ver secção "Imagens" da nova
 * estrutura: a galeria geral nunca é "consumida" por uma variante.
 */
export function gerarCombinacoes(opcoes: ProdutoOpcao[], existentes: ProdutoCombinacao[]): ProdutoCombinacao[] {
  const ativas = opcoes.filter((o) => o.valores.length > 0);
  if (ativas.length === 0) return [];

  const existentesPorChave = new Map(existentes.map((c) => [c.chave, c]));

  let acc: Record<string, string>[] = [{}];
  for (const opcao of ativas) {
    const next: Record<string, string>[] = [];
    for (const combo of acc) {
      for (const valor of opcao.valores) {
        next.push({ ...combo, [opcao.nome]: valor });
      }
    }
    acc = next;
  }

  return acc.map((valores) => {
    const chave = ativas.map((o) => valores[o.nome]).join(' / ');
    const prev = existentesPorChave.get(chave);
    return {
      chave,
      valores,
      preco: prev?.preco ?? null,
      estoque: prev?.estoque ?? null,
      sku: prev?.sku ?? null,
      peso: prev?.peso ?? null,
      imagens: prev?.imagens ?? [],
      ativa: prev?.ativa ?? true,
    };
  });
}

/** Soma o estoque só das combinações ativas — uma variante desativada
 *  (ex: "Preto / L" que não existe fisicamente) não conta para o total. */
export function totalEstoque(combinacoes: ProdutoCombinacao[]): number {
  return combinacoes
    .filter((c) => c.ativa !== false)
    .reduce((sum, c) => sum + (typeof c.estoque === 'number' ? c.estoque : 0), 0);
}

/** Aplica o mesmo peso a todas as combinações — usado pelo botão "Usar
 *  este peso em todas as variantes", para não obrigar o vendedor a
 *  preencher o mesmo valor várias vezes quando todas pesam igual. */
export function aplicarPesoATodas(combinacoes: ProdutoCombinacao[], peso: number | null): ProdutoCombinacao[] {
  return combinacoes.map((c) => ({ ...c, peso }));
}

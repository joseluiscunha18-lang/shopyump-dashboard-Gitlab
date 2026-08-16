import type { ProdutoCombinacao, ProdutoOpcao } from '@/types/database';

/** Chave estável para um valor de opção, usada em `imagensPorValor`. Ex: "Cor:Preto". */
export function chaveValor(opcaoNome: string, valor: string): string {
  return `${opcaoNome}:${valor}`;
}

/**
 * Gera o produto cartesiano dos valores de todas as opções (só as que já
 * têm pelo menos um valor). Reaproveita preço/estoque de combinações
 * existentes quando a chave coincide, para não perder dados já
 * preenchidos ao adicionar/remover um valor.
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
    };
  });
}

export function totalEstoque(combinacoes: ProdutoCombinacao[]): number {
  return combinacoes.reduce((sum, c) => sum + (typeof c.estoque === 'number' ? c.estoque : 0), 0);
}

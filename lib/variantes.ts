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
      peso: prev?.peso ?? null,
    };
  });
}

export function totalEstoque(combinacoes: ProdutoCombinacao[]): number {
  return combinacoes.reduce((sum, c) => sum + (typeof c.estoque === 'number' ? c.estoque : 0), 0);
}

/**
 * Resolve o "problema da calça branca + azul" (ver nova_estrutura.txt,
 * secção 4/5): quando o produto passa de "sem variantes" para "com
 * variantes" pela primeira vez, o que já estava preenchido — estoque e
 * fotos do produto — não pode desaparecer. A primeira combinação criada
 * (ex: "Branco") deve herdar automaticamente esses dados, como se o
 * estado atual do produto se tivesse tornado a sua primeira variante.
 *
 * Só faz sentido chamar isto exatamente na transição (produto tinha 0
 * combinações e passou a ter exatamente 1). Depois disso, cada variante
 * nova nasce em branco normalmente — só a primeira herda.
 */
export function herdarEstadoInicial({
  combinacoes,
  imagensPorValor,
  opcoes,
  estoqueAtual,
  fotosAtuais,
}: {
  combinacoes: ProdutoCombinacao[];
  imagensPorValor: Record<string, string[]>;
  opcoes: ProdutoOpcao[];
  estoqueAtual: number | null;
  fotosAtuais: string[];
}): { combinacoes: ProdutoCombinacao[]; imagensPorValor: Record<string, string[]> } {
  if (combinacoes.length !== 1) return { combinacoes, imagensPorValor };

  const [unica] = combinacoes;
  const opcaoAtiva = opcoes.find((o) => o.valores.length > 0);
  const valor = opcaoAtiva?.valores[0];

  const combinacaoHerdada: ProdutoCombinacao = {
    ...unica,
    estoque: unica.estoque ?? estoqueAtual,
  };

  const imagensHerdadas = { ...imagensPorValor };
  if (opcaoAtiva && valor && fotosAtuais.length > 0) {
    const chave = chaveValor(opcaoAtiva.nome, valor);
    if (!imagensHerdadas[chave]) imagensHerdadas[chave] = fotosAtuais;
  }

  return { combinacoes: [combinacaoHerdada], imagensPorValor: imagensHerdadas };
}

import type { ProdutoOpcaoFilha, ProdutoOpcaoRaiz, ProdutoVersao } from '@/types/database';

function valoresFilhaPara(filha: ProdutoOpcaoFilha | null | undefined, raizValor: string | null): string[] {
  if (!filha) return [];
  if (!raizValor || filha.mesmosValoresParaTodas) return filha.valoresComuns ?? [];
  return filha.valoresPorRaiz?.[raizValor] ?? [];
}

/**
 * Gera as versões vendáveis a partir da raiz (ex: Cor) e da filha (ex:
 * Tamanho) — nunca um cruzamento cego: se o vendedor não atribuiu
 * "35" à cor "Preto", essa versão simplesmente não é criada. Reaproveita
 * preço/estoque/peso/imagens/estado de versões existentes quando a chave
 * coincide, para não perder dados já preenchidos.
 */
export function gerarVersoes(
  raiz: ProdutoOpcaoRaiz | null | undefined,
  filha: ProdutoOpcaoFilha | null | undefined,
  existentes: ProdutoVersao[]
): ProdutoVersao[] {
  const existentesPorChave = new Map(existentes.map((v) => [v.chave, v]));

  function montar(valores: Record<string, string>, chave: string): ProdutoVersao {
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
  }

  if (!raiz && !filha) return [];

  // Só uma característica (ex: perfume só com cor, ou produto só com tamanho).
  if (!raiz && filha) {
    return (filha.valoresComuns ?? []).map((v) => montar({ [filha.nome]: v }, v));
  }
  if (raiz && !filha) {
    return raiz.valores.map((v) => montar({ [raiz.nome]: v }, v));
  }

  // Raiz + filha: árvore de duas camadas.
  const versoes: ProdutoVersao[] = [];
  for (const raizValor of raiz!.valores) {
    for (const filhoValor of valoresFilhaPara(filha, raizValor)) {
      const chave = `${raizValor} / ${filhoValor}`;
      versoes.push(montar({ [raiz!.nome]: raizValor, [filha!.nome]: filhoValor }, chave));
    }
  }
  return versoes;
}

/** Soma o estoque só das versões ativas. */
export function totalEstoque(versoes: ProdutoVersao[]): number {
  return versoes.filter((v) => v.ativa !== false).reduce((sum, v) => sum + (typeof v.estoque === 'number' ? v.estoque : 0), 0);
}

/** Aplica o mesmo peso a todas as versões — botão "Usar este peso em
 *  todas as variantes", para quem tem várias versões com peso igual. */
export function aplicarPesoATodas(versoes: ProdutoVersao[], peso: number | null): ProdutoVersao[] {
  return versoes.map((v) => ({ ...v, peso }));
}

/** Agrupa as versões por valor da raiz, na ordem definida por `raiz`, para
 *  renderizar a árvore "Amarelo · 2 tamanhos / Preto · 1 tamanho". Só faz
 *  sentido quando existe raiz E filha (duas camadas) — nos outros casos a
 *  lista já é plana (uma versão por valor). */
export function agruparPorRaiz(
  raiz: ProdutoOpcaoRaiz,
  versoes: ProdutoVersao[]
): { raizValor: string; versoes: ProdutoVersao[] }[] {
  return raiz.valores.map((raizValor) => ({
    raizValor,
    versoes: versoes.filter((v) => v.valores[raiz.nome] === raizValor),
  }));
}

import type { ProdutoOpcaoFilha, ProdutoOpcaoNeta, ProdutoOpcaoRaiz, ProdutoVersao } from '@/types/database';

function valoresFilhaPara(filha: ProdutoOpcaoFilha | null | undefined, raizValor: string | null): string[] {
  if (!filha) return [];
  if (!raizValor || filha.mesmosValoresParaTodas) return filha.valoresComuns ?? [];
  return filha.valoresPorRaiz?.[raizValor] ?? [];
}

function valoresNetaPara(
  neta: ProdutoOpcaoNeta | null | undefined,
  raizValor: string | null,
  filhaValor: string | null
): string[] {
  if (!neta) return [];
  if (neta.mesmosValoresParaTodas) return neta.valoresComuns ?? [];
  if (raizValor == null || filhaValor == null) return [];
  return neta.valoresPorCombinacao?.[`${raizValor} / ${filhaValor}`] ?? [];
}

/**
 * Gera as versões vendáveis a partir da raiz (ex: Cor), da filha (ex:
 * Material) e, opcionalmente, da neta (ex: Tamanho) — nunca um cruzamento
 * cego: se o vendedor não atribuiu um valor a uma combinação, essa versão
 * simplesmente não é criada. Reaproveita preço/estoque/peso/imagens/estado
 * de versões existentes quando a chave coincide, para não perder dados já
 * preenchidos.
 */
export function gerarVersoes(
  raiz: ProdutoOpcaoRaiz | null | undefined,
  filha: ProdutoOpcaoFilha | null | undefined,
  neta: ProdutoOpcaoNeta | null | undefined,
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

  // Raiz + filha, com neta opcional — árvore de duas ou três camadas.
  const versoes: ProdutoVersao[] = [];
  for (const raizValor of raiz!.valores) {
    for (const filhoValor of valoresFilhaPara(filha, raizValor)) {
      if (!neta) {
        const chave = `${raizValor} / ${filhoValor}`;
        versoes.push(montar({ [raiz!.nome]: raizValor, [filha!.nome]: filhoValor }, chave));
        continue;
      }
      for (const netoValor of valoresNetaPara(neta, raizValor, filhoValor)) {
        const chave = `${raizValor} / ${filhoValor} / ${netoValor}`;
        versoes.push(
          montar({ [raiz!.nome]: raizValor, [filha!.nome]: filhoValor, [neta.nome]: netoValor }, chave)
        );
      }
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
 *  sentido quando existe raiz E filha (duas ou três camadas) — nos outros
 *  casos a lista já é plana (uma versão por valor). */
export function agruparPorRaiz(
  raiz: ProdutoOpcaoRaiz,
  versoes: ProdutoVersao[]
): { raizValor: string; versoes: ProdutoVersao[] }[] {
  return raiz.valores.map((raizValor) => ({
    raizValor,
    versoes: versoes.filter((v) => v.valores[raiz.nome] === raizValor),
  }));
}

/** Agrupa (dentro de um valor da raiz já filtrado) as versões por valor da
 *  filha — usado quando há uma terceira característica (neta), para não
 *  achatar a árvore numa lista enorme de combinações abertas. */
export function agruparPorFilha(
  filha: ProdutoOpcaoFilha,
  raizValor: string,
  versoes: ProdutoVersao[]
): { filhaValor: string; versoes: ProdutoVersao[] }[] {
  const valores = filha.mesmosValoresParaTodas ? filha.valoresComuns ?? [] : filha.valoresPorRaiz?.[raizValor] ?? [];
  return valores.map((filhaValor) => ({
    filhaValor,
    versoes: versoes.filter((v) => v.valores[filha.nome] === filhaValor),
  }));
}

/** Todas as combinações "raizValor / filhaValor" já definidas — usadas pela
 *  terceira característica (neta) para deixar o vendedor escolher valores
 *  diferentes por combinação, ex: tamanhos diferentes por "Vermelho / Algodão". */
export function combinacoesRaizFilha(
  raiz: ProdutoOpcaoRaiz | null | undefined,
  filha: ProdutoOpcaoFilha | null | undefined
): { raizValor: string; filhaValor: string; chave: string }[] {
  if (!raiz || !filha) return [];
  const combos: { raizValor: string; filhaValor: string; chave: string }[] = [];
  for (const raizValor of raiz.valores) {
    for (const filhaValor of valoresFilhaPara(filha, raizValor)) {
      combos.push({ raizValor, filhaValor, chave: `${raizValor} / ${filhaValor}` });
    }
  }
  return combos;
}

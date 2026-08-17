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

export type OrigemImagens = 'versao' | 'caracteristica' | 'geral';

/**
 * Resolve a hierarquia de imagens de uma versão: imagem própria da versão
 * (mais específica) → imagem do valor da característica (ex: todas as
 * versões "Vermelho / *" herdam a foto de "Vermelho") → galeria geral do
 * produto (fallback final, sempre existe se o produto tiver fotos).
 *
 * Percorre `versao.valores` na ordem em que foi construído (raiz → filha
 * → neta — ver `montar()` acima), por isso se, por acaso, mais do que uma
 * característica tiver imagem própria definida, ganha a mais "externa"
 * (normalmente a raiz, que é onde a característica visual — tipo Cor —
 * costuma viver).
 */
export function imagensParaVersao(
  versao: ProdutoVersao,
  imagensPorCaracteristica: Record<string, Record<string, string[]>> | null | undefined,
  fotosGerais: string[]
): { imagens: string[]; origem: OrigemImagens; caracteristica?: string } {
  if (versao.imagens && versao.imagens.length > 0) {
    return { imagens: versao.imagens, origem: 'versao' };
  }
  if (imagensPorCaracteristica) {
    for (const [nomeCaracteristica, valorAtual] of Object.entries(versao.valores)) {
      const imagens = imagensPorCaracteristica[nomeCaracteristica]?.[valorAtual];
      if (imagens && imagens.length > 0) {
        return { imagens, origem: 'caracteristica', caracteristica: nomeCaracteristica };
      }
    }
  }
  return { imagens: fotosGerais, origem: 'geral' };
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

/**
 * Funde, dentro de `versoes`, todas as versões cujo valor em
 * `nomeCaracteristica` esteja em `valoresAntigos` num único valor
 * `valorNovo` — usado pela fusão de Género (Masculino + Feminino →
 * Unissexo), mas escrito de forma genérica para não ficar preso a esse
 * caso. Duas (ou três) versões que só diferiam nesse valor tornam-se uma:
 * o estoque é somado, as imagens são unidas (sem duplicar), e
 * preço/sku/peso ficam com o primeiro valor não-nulo encontrado — nunca
 * ficam a zero só porque a chave mudou. Versões cujo valor não está em
 * `valoresAntigos` (ex: uma 4ª opção de género escrita à mão) não são
 * tocadas.
 *
 * O resultado deve ser passado como `existentes` a `gerarVersoes()` a
 * seguir a atualizar raiz/filha/neta — a chave da versão fundida
 * (`Object.values(valores).join(' / ')`) é construída da mesma forma que
 * `gerarVersoes()` constrói a chave da nova combinação "Unissexo", por
 * isso o reaproveitamento por chave funciona sem precisar de mais nada.
 */
export function fundirVersoesPorValor(
  nomeCaracteristica: string,
  valoresAntigos: string[],
  valorNovo: string,
  versoes: ProdutoVersao[]
): ProdutoVersao[] {
  const grupos = new Map<string, ProdutoVersao[]>();
  const semGrupo: ProdutoVersao[] = [];

  for (const v of versoes) {
    const valorAtual = v.valores[nomeCaracteristica];
    if (valorAtual == null || !valoresAntigos.includes(valorAtual)) {
      semGrupo.push(v);
      continue;
    }
    const resto = { ...v.valores };
    delete resto[nomeCaracteristica];
    const chaveGrupo = JSON.stringify(resto);
    grupos.set(chaveGrupo, [...(grupos.get(chaveGrupo) ?? []), v]);
  }

  const fundidas: ProdutoVersao[] = [];
  for (const doGrupo of grupos.values()) {
    // Se já houver uma versão com o valor novo (ex: já existia "Unissexo"
    // ao lado de "Masculino"/"Feminino"), essa é a base — mantém-lhe o
    // preço/sku/peso/imagens em vez dos de uma versão M/F qualquer.
    const base = doGrupo.find((v) => v.valores[nomeCaracteristica] === valorNovo) ?? doGrupo[0];
    const novosValores = { ...base.valores, [nomeCaracteristica]: valorNovo };
    const estoqueTotal = doGrupo.reduce((soma, v) => soma + (typeof v.estoque === 'number' ? v.estoque : 0), 0);
    const imagens = Array.from(new Set(doGrupo.flatMap((v) => v.imagens ?? [])));
    const ativa = doGrupo.some((v) => v.ativa !== false);

    fundidas.push({
      chave: Object.values(novosValores).join(' / '),
      valores: novosValores,
      preco: base.preco ?? doGrupo.find((v) => v.preco != null)?.preco ?? null,
      estoque: doGrupo.some((v) => typeof v.estoque === 'number') ? estoqueTotal : null,
      sku: base.sku ?? doGrupo.find((v) => v.sku != null)?.sku ?? null,
      peso: base.peso ?? doGrupo.find((v) => v.peso != null)?.peso ?? null,
      imagens,
      ativa,
    });
  }

  return [...semGrupo, ...fundidas];
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

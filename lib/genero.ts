const NOME_GENERO = /g[eé]nero/i;

/** Match case-insensitive por nome de característica, igual ao usado em
 *  sugestoesOpcao.ts — cobre "Género", "genero", "GÉNERO", etc. */
export function ehCaracteristicaGenero(nome: string | null | undefined): boolean {
  return !!nome && NOME_GENERO.test(nome);
}

export type ResultadoFusaoGenero = 'colapsar' | 'fundir' | null;

/**
 * Avalia um conjunto de valores de "Género" e diz o que fazer:
 *
 * - 'colapsar': tem Masculino + Feminino + Unissexo ao mesmo tempo →
 *   Unissexo já engloba os outros dois, não há ambiguidade nenhuma.
 *   Quem chama isto aplica direto, sem perguntar ao lojista.
 * - 'fundir': tem exatamente Masculino + Feminino (sem Unissexo) → é uma
 *   sugestão, não uma certeza — o produto pode mesmo ser vendido só para
 *   os dois, sem ser "unissexo" na cabeça do lojista. Quem chama isto
 *   mostra um banner e deixa o lojista decidir.
 * - null: qualquer outra combinação (um valor só, ou Unissexo sozinho, ou
 *   um dos dois + Unissexo mas não os dois juntos) — não mexe em nada.
 */
export function avaliarValoresGenero(valores: string[]): ResultadoFusaoGenero {
  const set = new Set(valores);
  const temMasculino = set.has('Masculino');
  const temFeminino = set.has('Feminino');
  const temUnissexo = set.has('Unissexo');

  if (temMasculino && temFeminino && temUnissexo) return 'colapsar';
  if (temMasculino && temFeminino) return 'fundir';
  return null;
}

/**
 * Devolve a lista de valores com Masculino/Feminino/Unissexo colapsados
 * num único "Unissexo", preservando a ordem e quaisquer outros valores
 * livres que o lojista tenha escrito (esta característica é texto livre,
 * não é garantido que só tenha os 3 valores padrão).
 */
export function aplicarFusaoGenero(valores: string[]): string[] {
  const outros = valores.filter((v) => v !== 'Masculino' && v !== 'Feminino' && v !== 'Unissexo');
  return [...outros, 'Unissexo'];
}

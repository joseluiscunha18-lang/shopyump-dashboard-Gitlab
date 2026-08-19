export type UnidadePeso = 'g' | 'kg' | 'lb' | 'oz';

/** Quantos kg equivale 1 unidade de cada tipo. */
const FATOR_KG: Record<UnidadePeso, number> = {
  g: 0.001,
  kg: 1,
  lb: 0.45359237,
  oz: 0.0283495231,
};

/** Converte um valor digitado (na unidade escolhida pelo vendedor) para kg,
 *  que é a unidade sempre guardada na base de dados (`peso` em
 *  ProdutoVersao/ProdutoMaisOpcoes). */
export function pesoParaKg(valor: number, unidade: UnidadePeso): number {
  return valor * FATOR_KG[unidade];
}

/** Converte um peso em kg para a unidade escolhida, para preencher o campo
 *  quando o vendedor troca de unidade sem perder o valor já digitado. */
export function kgParaUnidade(kg: number, unidade: UnidadePeso): number {
  const v = kg / FATOR_KG[unidade];
  // Evita lixo tipo 149.99999999999997 ao ir e voltar entre unidades.
  return Math.round(v * 1000) / 1000;
}

/** Formata um peso em kg para exibição compacta — usa g abaixo de 1kg
 *  para não mostrar "0.15 kg" quando "150 g" é mais natural. */
export function formatarPeso(kg: number): string {
  if (kg < 1) {
    const g = Math.round(kg * 1000);
    return `${g} g`;
  }
  const arredondado = Math.round(kg * 100) / 100;
  return `${arredondado} kg`;
}

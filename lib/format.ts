/**
 * Formatação numérica dedicada aos cards de "Visão geral" / financeiros.
 *
 * Propositalmente NÃO usa `toLocaleString('pt-MZ' | 'pt-PT')`: dependendo
 * da versão do ICU embutida no Node/browser, esses locales devolvem um
 * espaço (normal ou insecável) como separador de milhar em vez do ponto
 * ("12 850" em vez de "12.850") — o resto do projeto usa "12 850 MZN"
 * (ver ProductRow, OrdersList), mas o mockup pedido para esta etapa é
 * explícito em usar ponto ("12.850 MT", "6.420 Visitas", "48.750 MT").
 * Um formatador manual garante o mesmo resultado em qualquer ambiente,
 * sem depender de qual CLDR está instalado.
 */
export function formatNumberDot(value: number): string {
  const arredondado = Math.round(value);
  const negativo = arredondado < 0;
  const digitos = Math.abs(arredondado).toString();
  const comPontos = digitos.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return negativo ? `-${comPontos}` : comPontos;
}

/** "+18,4%" / "-3,2%" — vírgula decimal, sinal sempre explícito quando positivo. */
export function formatSignedPercent(value: number, casasDecimais = 1): string {
  const sinal = value > 0 ? '+' : '';
  return `${sinal}${value.toFixed(casasDecimais).replace('.', ',')}%`;
}

/**
 * Biblioteca de cores sugeridas para a opção "Cor" — usada pelo
 * SuggestInput para mostrar uma bolinha colorida junto ao nome (em vez de
 * só texto), tanto nas sugestões como nos chips já escolhidos. O vendedor
 * não está limitado a esta lista: pode escolher "Criar outra cor" e
 * definir o hex à mão (color picker nativo).
 */
export interface CorSugerida {
  nome: string;
  hex: string;
}

export const CORES_SUGERIDAS: CorSugerida[] = [
  { nome: 'Vermelho', hex: '#EF4444' },
  { nome: 'Laranja', hex: '#F97316' },
  { nome: 'Amarelo', hex: '#EAB308' },
  { nome: 'Verde', hex: '#22C55E' },
  { nome: 'Azul', hex: '#3B82F6' },
  { nome: 'Azul-marinho', hex: '#1E3A8A' },
  { nome: 'Roxo', hex: '#A855F7' },
  { nome: 'Rosa', hex: '#EC4899' },
  { nome: 'Castanho', hex: '#92400E' },
  { nome: 'Bege', hex: '#D9C7A3' },
  { nome: 'Cinza', hex: '#9CA3AF' },
  { nome: 'Preto', hex: '#171717' },
  { nome: 'Branco', hex: '#FFFFFF' },
  { nome: 'Dourado', hex: '#CA9A32' },
  { nome: 'Prateado', hex: '#C0C0C8' },
];

/** Procura o hex de uma cor sugerida pelo nome (ignora maiúsculas/minúsculas). */
export function hexDaCorSugerida(nome: string): string | undefined {
  return CORES_SUGERIDAS.find((c) => c.nome.toLowerCase() === nome.trim().toLowerCase())?.hex;
}

/** Gera um hex estável (não aleatório) para nomes de cor sem correspondência
 *  na lista sugerida nem no mapa de cores personalizadas — evita mostrar um
 *  círculo cinzento genérico sempre igual quando há várias cores "novas". */
export function hexFallback(nome: string): string {
  let hash = 0;
  for (let i = 0; i < nome.length; i++) hash = nome.charCodeAt(i) + ((hash << 5) - hash);
  const hue = Math.abs(hash) % 360;
  return `hsl(${hue}, 62%, 55%)`;
}

/** Resolve o hex final de um valor de cor: cores personalizadas definidas
 *  pelo vendedor > biblioteca sugerida > fallback estável por nome. */
export function resolverHexCor(nome: string, personalizadas?: Record<string, string>): string {
  return personalizadas?.[nome] ?? hexDaCorSugerida(nome) ?? hexFallback(nome);
}

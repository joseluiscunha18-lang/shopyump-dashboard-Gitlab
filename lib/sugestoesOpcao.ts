/**
 * Sugestões de valores por característica — para que o painel flutuante
 * do SuggestInput nunca apareça vazio quando a opção não é "Cor". Cada
 * lista é só um ponto de partida (o vendedor pode sempre escrever um
 * valor que não está aqui); o match do nome da característica é
 * case-insensitive e cobre também nomes livres parecidos (ex: "cor da
 * tampa" continua a mostrar as cores).
 */
const TAMANHOS_LETRA = ['PP', 'P', 'M', 'G', 'GG', 'XG', 'XXG', 'Único'];
const TAMANHOS_ROUPA_INFANTIL = ['RN', '0-3M', '3-6M', '6-9M', '9-12M', '12-18M', '18-24M'];
const TAMANHOS_NUMERO = ['30', '32', '34', '36', '38', '40', '42', '44', '46'];
const TAMANHOS_CALCADO = ['34', '35', '36', '37', '38', '39', '40', '41', '42', '43', '44', '45', '46'];

const SUGESTOES_POR_NOME: { padrao: RegExp; valores: string[] }[] = [
  { padrao: /^tamanho$/i, valores: [...TAMANHOS_LETRA, ...TAMANHOS_NUMERO] },
  { padrao: /cal[cç]ado|n[uú]mero/i, valores: TAMANHOS_CALCADO },
  { padrao: /infantil|beb[eé]/i, valores: TAMANHOS_ROUPA_INFANTIL },
  { padrao: /g[eé]nero/i, valores: ['Masculino', 'Feminino', 'Unissexo'] },
  {
    padrao: /material/i,
    valores: [
      'Algodão',
      'Poliéster',
      'Couro',
      'Couro sintético',
      'Linho',
      'Seda',
      'Metal',
      'Plástico',
      'Madeira',
      'Vidro',
      'Silicone',
      'Alumínio',
      'Aço inoxidável',
    ],
  },
  {
    padrao: /capacidade|volume|tamanho.*embalagem/i,
    valores: ['250ml', '500ml', '750ml', '1L', '1.5L', '2L', '5L', '250g', '500g', '1kg', '2kg', '16GB', '32GB', '64GB', '128GB', '256GB'],
  },
];

/** Devolve a lista de sugestões para uma característica não-cor (ex:
 *  Tamanho, Género, Material, Capacidade). Vazio se não houver match — o
 *  campo continua a funcionar normalmente, só sem sugestões pré-definidas. */
export function sugestoesParaCaracteristica(nome: string): string[] {
  const encontrada = SUGESTOES_POR_NOME.find((s) => s.padrao.test(nome));
  return encontrada?.valores ?? [];
}

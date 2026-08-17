/**
 * Hand-written types matching the schema inferred from Shopyump-main's
 * Supabase queries (see architecture doc §2.2 / §6.1).
 *
 * IMPORTANT: these are a best-effort reconstruction, not a generated
 * schema. Before shipping, run:
 *
 *   supabase gen types typescript --project-id <id> > types/supabase.ts
 *
 * ...against the real project and reconcile any drift with this file.
 * Every query/mutation in lib/queries and lib/mutations is written
 * against the domain types below, so once the generated types land,
 * only this file (and the two lib/ folders, if fields actually differ)
 * need to change — components never talk to Supabase directly.
 */

export interface Loja {
  id: string;
  perfil_id: string;
  slug: string;
  nome: string;
  whatsapp: string | null;
  descricao: string | null;
  banner_url: string | null;
  banner_botao: string | null;
  instagram: string | null;
  facebook: string | null;
  tiktok: string | null;
  email: string | null;
  mostrar_instagram: boolean | null;
  mostrar_facebook: boolean | null;
  mostrar_tiktok: boolean | null;
  mostrar_sobre: boolean | null;
  mostrar_entrega: boolean | null;
  mostrar_termos: boolean | null;
  conteudo_sobre: string | null;
  conteudo_entrega: string | null;
  conteudo_termos: string | null;
  created_at: string;
}

export type LojaUpdate = Partial<Omit<Loja, 'id' | 'perfil_id' | 'created_at'>>;

/**
 * Nova estrutura de variantes (ver doc "nova_estrutura.txt"):
 * o produto pode ter até 3 opções (Cor, Tamanho, Género), cada uma com
 * uma lista de valores. Quando há mais de uma opção, as combinações são
 * geradas automaticamente — cada combinação é uma "variante vendível"
 * com o seu próprio preço/estoque/imagens opcionais.
 */
/**
 * @deprecated estrutura antiga (lista plana de opções). Ver ProdutoOpcaoRaiz/ProdutoOpcaoFilha.
 */
export const OPCOES_VARIANTE_DISPONIVEIS = ['Cor', 'Tamanho', 'Género'] as const;
export type NomeOpcaoVariante = (typeof OPCOES_VARIANTE_DISPONIVEIS)[number];

/** @deprecated ver ProdutoOpcaoRaiz/ProdutoOpcaoFilha. */
export interface ProdutoOpcao {
  nome: NomeOpcaoVariante;
  valores: string[];
}

/** @deprecated ver ProdutoVersao. */
export interface ProdutoCombinacao {
  /** Identificador estável, ex: "Preto / M" — junta os valores pela ordem das opções. */
  chave: string;
  /** ex: { Cor: 'Preto', Tamanho: 'M' } */
  valores: Record<string, string>;
  /** null/undefined = herda o preço principal do produto. */
  preco?: number | null;
  estoque?: number | null;
  sku?: string | null;
  /** kg. null/undefined = herda o peso padrão do produto (só existe quando o produto não tem variantes). */
  peso?: number | null;
  /**
   * URLs escolhidas da galeria geral do produto (`produto.fotos`) para
   * esta combinação específica. Opcional — se vazio, a loja usa a
   * galeria geral. Nunca é upload próprio: são sempre imagens que já
   * existem em `fotos`.
   */
  imagens?: string[];
  /**
   * false = combinação existe (por causa do cruzamento de opções) mas o
   * vendedor não a vende — ex.: "Preto / L" não existe fisicamente.
   * Fica escondida na loja e fora do total de estoque, mas os dados não
   * são apagados (pode reativar). undefined/true = ativa normalmente.
   */
  ativa?: boolean;
}

/**
 * Estrutura de variantes em árvore (ver doc "variacoes_arvore.txt"): o
 * vendedor não pensa em "variantes" — só diz quais versões do produto
 * vende. Até 3 características (raiz → filha → neta, ex: Cor → Material →
 * Tamanho); os valores de cada nível podem ser diferentes por combinação
 * do(s) nível(eis) acima (o vendedor nunca é obrigado a criar uma
 * combinação que não existe). Só a combinação final (a folha da árvore)
 * recebe estoque/preço/imagens.
 */
export const CARACTERISTICAS_SUGERIDAS = ['Cor', 'Tamanho', 'Material', 'Capacidade', 'Género'] as const;

export const GENEROS = ['Masculino', 'Feminino', 'Unissexo'] as const;
export type Genero = (typeof GENEROS)[number];

export interface ProdutoOpcaoRaiz {
  /** ex: "Cor" — pode ser um valor de CARACTERISTICAS_SUGERIDAS ou texto livre ("Outra"). */
  nome: string;
  valores: string[];
  /**
   * Só relevante quando `nome === 'Cor'`: hex escolhido pelo vendedor para
   * cores personalizadas (fora da biblioteca sugerida em lib/cores.ts).
   * Cores da biblioteca não precisam de entrada aqui — o hex é resolvido
   * pelo nome. ex: { "Verde-oliva": "#6B7A3A" }
   */
  cores?: Record<string, string>;
}

export interface ProdutoOpcaoFilha {
  /** ex: "Tamanho" */
  nome: string;
  /** true = todos os valores da raiz partilham `valoresComuns`.
   *  false = cada valor da raiz tem a sua própria lista em `valoresPorRaiz`. */
  mesmosValoresParaTodas: boolean;
  valoresComuns?: string[];
  valoresPorRaiz?: Record<string, string[]>;
  /** Só relevante quando `nome === 'Cor'` — ver ProdutoOpcaoRaiz.cores. */
  cores?: Record<string, string>;
}

/**
 * Terceira característica (ex: "Tamanho" em Cor → Material → Tamanho) — só
 * existe quando já há raiz e filha. Os seus valores podem ser comuns a
 * todas as combinações de raiz+filha, ou diferentes por combinação.
 */
export interface ProdutoOpcaoNeta {
  /** ex: "Tamanho" */
  nome: string;
  /** true = todas as combinações raiz+filha partilham `valoresComuns`.
   *  false = cada combinação tem a sua própria lista em `valoresPorCombinacao`. */
  mesmosValoresParaTodas: boolean;
  valoresComuns?: string[];
  /** chave = "raizValor / filhaValor" (mesmo formato usado na chave das versões de 2 níveis). */
  valoresPorCombinacao?: Record<string, string[]>;
  /** Só relevante quando `nome === 'Cor'` — ver ProdutoOpcaoRaiz.cores. */
  cores?: Record<string, string>;
}

export interface ProdutoVersao {
  /** Identificador estável: "Amarelo / 30", ou só "Amarelo"/"30" se só houver uma característica. */
  chave: string;
  /** ex: { Cor: 'Amarelo', Tamanho: '30' } */
  valores: Record<string, string>;
  /** null/undefined = herda o preço principal do produto. */
  preco?: number | null;
  estoque?: number | null;
  sku?: string | null;
  /** kg. null/undefined = herda o peso padrão do produto (só existe quando o produto não tem versões). */
  peso?: number | null;
  /**
   * URLs escolhidas da galeria geral do produto (`produto.fotos`) para
   * esta versão específica. Opcional — se vazio, a loja usa a galeria
   * geral. Nunca é upload próprio: são sempre imagens que já existem em
   * `fotos`.
   */
  imagens?: string[];
  /**
   * false = versão existe na árvore mas o vendedor não a vende (ex.:
   * "Preto / L" foi criada e depois esvaziada). Fica escondida na loja e
   * fora do total de estoque, mas os dados não são apagados. undefined/
   * true = ativa normalmente.
   */
  ativa?: boolean;
}

export interface ProdutoVariantes {
  raiz?: ProdutoOpcaoRaiz | null;
  filha?: ProdutoOpcaoFilha | null;
  neta?: ProdutoOpcaoNeta | null;
  versoes: ProdutoVersao[];

  /**
   * Imagens associadas a um VALOR de uma característica (ex: "Vermelho"
   * dentro de "Cor"), não a uma versão final — servem de imagem padrão
   * para todas as versões que tenham esse valor, sem o lojista escolher
   * a mesma foto em cada combinação (ex: Vermelho/30, Vermelho/32,
   * Vermelho/34 herdam automaticamente a foto de "Vermelho").
   *
   * Chave externa = nome da característica tal como está em
   * raiz.nome/filha.nome/neta.nome (normalmente a que muda visualmente,
   * ex: "Cor" — mas não é obrigatório ser a raiz). Chave interna = valor
   * dentro dessa característica (ex: "Vermelho").
   *
   * Nunca é a única fonte: ver `imagensParaVersao()` em lib/variantes.ts
   * para a hierarquia completa (imagem própria da versão → imagem da
   * característica → galeria geral do produto).
   */
  imagensPorCaracteristica?: Record<string, Record<string, string[]>>;

  /** @deprecated estrutura anterior (lista plana de opções + produto
   *  cartesiano). Mantido só para não partir produtos gravados antes
   *  desta migração — código novo usa raiz/filha/versoes. */
  opcoes?: ProdutoOpcao[];
  combinacoes?: ProdutoCombinacao[];
  imagensPorValor?: Record<string, string[]>;
  tamanhos?: string[];
  cores?: string[];
  numeracao?: (string | number)[];
}

/** Tudo o que fica escondido em "Mais opções" — nunca obrigatório. */
export interface ProdutoMaisOpcoes {
  sku?: string | null;
  /** kg. Peso padrão do produto; cada variante pode sobrescrever em `combinacao.peso`. */
  peso?: number | null;
  infoEntrega?: string | null;
  /**
   * SEO é gerado automaticamente (ver lib/seo.ts) a partir do nome do
   * produto + nome da loja. Estes campos ficam reservados para uma futura
   * opção avançada "Editar SEO" — não são expostos no formulário principal
   * hoje, mas se estiverem preenchidos, `gerarSeoProduto` usa-os como
   * override.
   */
  seoTitulo?: string | null;
  seoDescricao?: string | null;
}

export interface Produto {
  id: string;
  loja_id: string;
  nome: string;
  preco: number;
  preco_promo: number | null;
  categoria: string;
  descricao: string | null;
  /**
   * Informação geral do produto — não cria versões. Só vale a pena usar
   * "Género" como característica de variação (dentro de `variantes`)
   * quando o mesmo produto tem mesmo versões diferentes por género.
   */
  genero?: Genero | null;
  /** Galeria geral do produto — imagens partilhadas por todas as variantes. */
  fotos: string[];
  variantes: ProdutoVariantes | null;
  ativo: boolean;
  /** Estoque total. Sem variantes: valor editável directamente. Com
   *  variantes: soma calculada automaticamente a partir das combinações
   *  (mantido aqui também para a listagem de produtos não precisar de
   *  somar nada). */
  estoque?: number | null;
  mais_opcoes?: ProdutoMaisOpcoes | null;
  created_at: string;
}

export type ProdutoInsert = Omit<Produto, 'id' | 'created_at'>;
export type ProdutoUpdate = Partial<Omit<Produto, 'id' | 'loja_id' | 'created_at'>>;

export type PedidoStatus = 'pendente' | 'confirmado' | 'enviado' | 'concluido' | 'cancelado';

export interface PedidoItem {
  id: string;
  nome: string;
  preco: number;
  quantidade: number;
  imagem?: string;
  corSelecionada?: string | null;
  tamanhoSelecionado?: string | null;
}

export interface Pedido {
  id: string;
  loja_id: string;
  cliente_nome: string;
  cliente_telefone: string;
  cliente_endereco: string | null;
  itens: PedidoItem[];
  total: number;
  status: PedidoStatus;
  created_at: string;
}

export interface Visita {
  id: string;
  loja_id: string;
  created_at: string;
}

export interface AdminRow {
  email: string;
}

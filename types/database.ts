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
export const OPCOES_VARIANTE_DISPONIVEIS = ['Cor', 'Tamanho', 'Género'] as const;
export type NomeOpcaoVariante = (typeof OPCOES_VARIANTE_DISPONIVEIS)[number];

export interface ProdutoOpcao {
  /** Um dos valores de OPCOES_VARIANTE_DISPONIVEIS. */
  nome: NomeOpcaoVariante;
  valores: string[];
}

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

export interface ProdutoVariantes {
  opcoes: ProdutoOpcao[];
  combinacoes: ProdutoCombinacao[];

  /** @deprecated substituído por `combinacao.imagens` — imagens pertencem
   *  à combinação (a coisa que o cliente compra), não a um valor de opção
   *  isolado. Mantido só para não partir produtos gravados antes desta
   *  migração; código novo não deve escrever aqui. */
  imagensPorValor?: Record<string, string[]>;

  /** @deprecated campos da estrutura antiga, mantidos só para não partir
   *  produtos já gravados antes desta migração. Não usar em código novo. */
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

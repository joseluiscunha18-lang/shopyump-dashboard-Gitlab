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

export interface ProdutoVariantes {
  tamanhos?: string[];
  numeracao?: (string | number)[];
  cores?: string[];
}

export interface Produto {
  id: string;
  loja_id: string;
  nome: string;
  preco: number;
  preco_promo: number | null;
  categoria: string;
  descricao: string | null;
  fotos: string[];
  variantes: ProdutoVariantes | null;
  ativo: boolean;
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

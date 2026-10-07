import { LumeTheme } from '@/lib/store/themes/lume';
import type { LojaPublica } from '@/lib/queries/lojaPublica';
import type { ProdutoPublico } from '@/lib/queries/produtosPublicos';

/**
 * Rota temporária só para ver o tema Lume a funcionar sem precisar de
 * nenhuma loja real no Supabase. Não é usada por nada em produção —
 * apaga esta pasta (app/preview-lume/) quando já não precisares dela.
 *
 * O Lume ainda está em modo demo (ver LumeTheme.tsx): mostra sempre os
 * 6 produtos fictícios dele próprio, por isso `loja`/`produtos` aqui
 * são só para satisfazer o tipo — os valores não aparecem no ecrã.
 */
const lojaFicticia: LojaPublica = {
  id: 'preview',
  nome: 'Loja de Pré-visualização',
  slug: 'preview',
  descricao: null,
  banner_url: null,
  whatsapp: null,
  instagram: null,
  facebook: null,
  tiktok: null,
  mostrar_instagram: false,
  mostrar_facebook: false,
  mostrar_tiktok: false,
  mostrar_sobre: false,
  mostrar_entrega: false,
  mostrar_termos: false,
  conteudo_sobre: null,
  conteudo_entrega: null,
  conteudo_termos: null,
  theme_id: 'lume',
  tema_personalizacao: null,
};

const produtosFicticios: ProdutoPublico[] = [];

export default function PreviewLumePage() {
  return <LumeTheme loja={lojaFicticia} produtos={produtosFicticios} />;
}

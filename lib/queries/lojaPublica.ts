import { cache } from 'react';
import { createPublicClient } from '@/lib/supabase/publicClient';

/**
 * Forma pública da loja — só os campos que a loja pública (e o
 * StoreRenderer/temas) têm o direito de ver. Deliberadamente mais
 * estreita que `Loja` (types/database.ts): nunca inclui `perfil_id`
 * nem qualquer campo interno/administrativo. Se a loja pública precisar
 * de mais um campo amanhã, acrescenta-se aqui E na query — nunca se usa
 * `select('*')` numa rota pública.
 */
export interface LojaPublica {
  id: string;
  nome: string;
  slug: string;
  descricao: string | null;
  banner_url: string | null;
  whatsapp: string | null;
  instagram: string | null;
  facebook: string | null;
  tiktok: string | null;
  mostrar_instagram: boolean | null;
  mostrar_facebook: boolean | null;
  mostrar_tiktok: boolean | null;
  mostrar_sobre: boolean | null;
  mostrar_entrega: boolean | null;
  mostrar_termos: boolean | null;
  conteudo_sobre: string | null;
  conteudo_entrega: string | null;
  conteudo_termos: string | null;
  theme_id: string;
  /**
   * Customização feita no editor (theme-editor). `null` = loja sem
   * personalização (tema original). Validada/convertida por cada tema — ver
   * lib/store/themes/lume/lib/personalizacao.ts.
   */
  tema_personalizacao: unknown | null;
}

const LOJA_PUBLICA_COLUNAS =
  'id, nome, slug, descricao, banner_url, whatsapp, instagram, facebook, tiktok, ' +
  'mostrar_instagram, mostrar_facebook, mostrar_tiktok, mostrar_sobre, mostrar_entrega, mostrar_termos, ' +
  'conteudo_sobre, conteudo_entrega, conteudo_termos, theme_id, tema_personalizacao';

/**
 * `cache()` do React deduplica chamadas com o mesmo argumento DENTRO do
 * mesmo pedido — se `generateMetadata` e a página em si precisarem os
 * dois da loja (é o caso), isto poupa uma segunda viagem ao Supabase por
 * pedido, sem precisar de passar a loja manualmente entre as duas
 * funções.
 *
 * `slug` já devia ter um índice único em `lojas` (é como o onboarding
 * garante URLs únicas) — sem esse índice, esta query degrada com o
 * número de lojas.
 */
export const getLojaPublicaBySlug = cache(async (slug: string): Promise<LojaPublica | null> => {
  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from('lojas')
    .select(LOJA_PUBLICA_COLUNAS)
    .eq('slug', slug)
    .maybeSingle();
  if (error) throw error;
  return data as LojaPublica | null;
});

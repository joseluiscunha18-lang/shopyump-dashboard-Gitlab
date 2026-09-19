import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getLojaPublicaBySlug } from '@/lib/queries/lojaPublica';
import { getProdutosPublicos } from '@/lib/queries/produtosPublicos';
import { StoreRenderer } from '@/components/store/StoreRenderer';

/**
 * Loja pública — a cadeia completa:
 *
 *   URL (/loja/[slug]) → slug → loja (Supabase) → theme_id
 *     → StoreRenderer → tema → produtos (Supabase)
 *
 * ESCALA — porque isto é visto por visitantes anónimos (não vendedores
 * logados), e não por uma única pessoa de cada vez como o painel:
 *
 * - `revalidate`: a página é gerada uma vez e servida em cache (ISR) por
 *   até 60s; só depois disso o próximo pedido volta a tocar o Supabase.
 *   Ajustar para mais alto se o catálogo mudar pouco, ou adicionar
 *   `revalidatePath('/loja/'+slug)` nas mutations de produto/loja para
 *   invalidar na hora em vez de esperar o tempo passar.
 * - As queries usam `createPublicClient()` (chave anon, sem `cookies()`)
 *   — nunca `lib/supabase/server.ts` aqui, ou a rota perderia a
 *   capacidade de ser cacheada (ver comentário em publicClient.ts).
 * - `getLojaPublicaBySlug` é `cache()`d — mesmo que `generateMetadata` e
 *   esta função corram as duas neste pedido, o Supabase só é consultado
 *   uma vez.
 */
export const revalidate = 60;

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const loja = await getLojaPublicaBySlug(slug);
  if (!loja) return { title: 'Loja não encontrada' };
  return {
    title: loja.nome,
    description: loja.descricao ?? undefined,
  };
}

export default async function LojaPublicaPage({ params }: PageProps) {
  const { slug } = await params;

  const loja = await getLojaPublicaBySlug(slug);
  if (!loja) notFound();

  const produtos = await getProdutosPublicos(loja.id);

  return <StoreRenderer themeId={loja.theme_id} loja={loja} produtos={produtos} />;
}

import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getLojaPublicaBySlug } from '@/lib/queries/lojaPublica';
import { getProdutoPublico, getProdutosPublicos } from '@/lib/queries/produtosPublicos';
import { StoreRenderer } from '@/components/store/StoreRenderer';

/**
 * Link partilhável de um produto: https://nome.shopyump.com/p/<id>
 * (o vercel.json reescreve nome.shopyump.com/p/<id> para /loja/nome/p/<id>).
 *
 * Mostra a loja normal, mas aberta diretamente na página do produto.
 * Só produtos ativos e não rascunho existem aqui — qualquer outro caso
 * (rascunho, inativo, apagado, ID de outra loja, ID inválido) é 404, tal
 * como a própria loja pública já os esconde.
 *
 * Mesmas regras de escala da página da loja: ISR de 60s e queries com o
 * cliente público (sem cookies), para a rota continuar cacheável.
 */
export const revalidate = 60;

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

interface PageProps {
  params: Promise<{ slug: string; id: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug, id } = await params;
  const naoEncontrado: Metadata = { title: 'Produto não encontrado' };
  if (!UUID_RE.test(id)) return naoEncontrado;

  const loja = await getLojaPublicaBySlug(slug);
  if (!loja) return naoEncontrado;

  const produto = await getProdutoPublico(loja.id, id);
  if (!produto) return naoEncontrado;

  // Pré-visualização do link (WhatsApp, Facebook, etc.): nome + foto do produto.
  const title = `${produto.nome} — ${loja.nome}`;
  const description = produto.descricao?.slice(0, 160) ?? undefined;
  const foto = produto.fotos?.find((f) => /^https?:\/\//.test(f));

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'website',
      images: foto ? [foto] : undefined,
    },
    twitter: {
      card: foto ? 'summary_large_image' : 'summary',
      title,
      description,
      images: foto ? [foto] : undefined,
    },
  };
}

export default async function ProdutoPublicoPage({ params }: PageProps) {
  const { slug, id } = await params;
  if (!UUID_RE.test(id)) notFound();

  const loja = await getLojaPublicaBySlug(slug);
  if (!loja) notFound();

  const [produto, produtos] = await Promise.all([
    getProdutoPublico(loja.id, id),
    getProdutosPublicos(loja.id),
  ]);
  if (!produto) notFound();

  // A página do produto procura-o na lista que o tema recebe. Se a loja
  // tiver mais produtos do que a primeira página (ver getProdutosPublicos),
  // este pode não estar lá — garante que está.
  const lista = produtos.some((p) => p.id === produto.id) ? produtos : [produto, ...produtos];

  return <StoreRenderer themeId={loja.theme_id} loja={loja} produtos={lista} produtoInicialId={produto.id} />;
}

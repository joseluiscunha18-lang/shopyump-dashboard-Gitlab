import type { Metadata } from 'next';
import { getUserContext } from '@/lib/auth/getUserContext';
import { getProdutosParaPreview } from '@/lib/queries/produtos';
import { PersonalizarLojaPage } from '@/components/loja/customize/PersonalizarLojaPage';

export const metadata: Metadata = { title: 'Personalizar loja | Shopyump' };

export default async function LojaPage() {
  const ctx = await getUserContext();
  if (!ctx.loja) return null;

  // Só as colunas necessárias para a prévia (id/nome/preco/fotos), já
  // filtradas e limitadas no Supabase — ver o comentário em
  // getProdutosParaPreview sobre por que isto importa em ligações lentas.
  const produtos = await getProdutosParaPreview(ctx.loja.id, 4);

  return <PersonalizarLojaPage loja={ctx.loja} produtos={produtos} />;
}

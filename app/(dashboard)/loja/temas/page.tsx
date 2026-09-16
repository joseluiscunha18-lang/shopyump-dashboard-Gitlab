import type { Metadata } from 'next';
import { getUserContext } from '@/lib/auth/getUserContext';
import { getProdutosParaPreview } from '@/lib/queries/produtos';
import { ThemeCatalog } from '@/components/loja/customize/ThemeCatalog';

export const metadata: Metadata = { title: 'Temas | Shopyump' };

export default async function TemasPage() {
  const ctx = await getUserContext();
  if (!ctx.loja) return null;

  const produtos = await getProdutosParaPreview(ctx.loja.id, 4);

  return <ThemeCatalog loja={ctx.loja} produtos={produtos} />;
}

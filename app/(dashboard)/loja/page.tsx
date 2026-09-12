import type { Metadata } from 'next';
import { getUserContext } from '@/lib/auth/getUserContext';
import { getProdutosByLoja } from '@/lib/queries/produtos';
import { PersonalizarLojaPage } from '@/components/loja/customize/PersonalizarLojaPage';

export const metadata: Metadata = { title: 'Personalizar loja | Shopyump' };

export default async function LojaPage() {
  const ctx = await getUserContext();
  if (!ctx.loja) return null;

  const produtos = await getProdutosByLoja(ctx.loja.id);

  return <PersonalizarLojaPage loja={ctx.loja} produtos={produtos} />;
}

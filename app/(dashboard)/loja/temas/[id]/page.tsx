import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getUserContext } from '@/lib/auth/getUserContext';
import { getProdutosParaPreview } from '@/lib/queries/produtos';
import { THEMES } from '@/types/theme';
import { ThemeDetail } from '@/components/loja/customize/ThemeDetail';

export function generateStaticParams() {
  return THEMES.map((t) => ({ id: t.id }));
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const theme = THEMES.find((t) => t.id === id);
  return { title: theme ? `Tema ${theme.name} | Shopyump` : 'Tema | Shopyump' };
}

export default async function TemaDetalhePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const theme = THEMES.find((t) => t.id === id);
  if (!theme) notFound();

  const ctx = await getUserContext();
  if (!ctx.loja) return null;

  const produtos = await getProdutosParaPreview(ctx.loja.id, 4);

  return <ThemeDetail loja={ctx.loja} produtos={produtos} theme={theme} />;
}

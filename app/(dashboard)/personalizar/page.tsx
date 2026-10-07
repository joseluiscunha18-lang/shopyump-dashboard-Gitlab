import type { Metadata } from 'next';
import PersonalizarPageClient from '@/theme-editor/pages/PersonalizarPageClient';
import { getUserContext } from '@/lib/auth/getUserContext';
import { getEditorInit } from '@/lib/queries/personalizacaoEditor';

export const metadata: Metadata = { title: 'Personalizar loja | Shopyump' };

export default async function PersonalizarPage() {
  const ctx = await getUserContext();
  // Admin sem loja própria: o editor abre com os dados de demonstração.
  const initial = ctx.loja ? await getEditorInit(ctx.loja) : undefined;
  return <PersonalizarPageClient initial={initial} />;
}

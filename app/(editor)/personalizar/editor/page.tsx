import type { Metadata } from 'next';
import EditorPageClient from '@/theme-editor/pages/EditorPageClient';
import { getUserContext } from '@/lib/auth/getUserContext';
import { getEditorInit } from '@/lib/queries/personalizacaoEditor';

export const metadata: Metadata = { title: 'Editor da loja | Shopyump' };

export default async function EditorPage() {
  const ctx = await getUserContext();
  const initial = ctx.loja ? await getEditorInit(ctx.loja) : undefined;
  return <EditorPageClient initial={initial} />;
}

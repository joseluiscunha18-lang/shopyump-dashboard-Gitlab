import type { Metadata } from 'next';
import EditorPageClient from '@/theme-editor/pages/EditorPageClient';

export const metadata: Metadata = { title: 'Editor da loja | Shopyump' };

export default function EditorPage() {
  return <EditorPageClient />;
}

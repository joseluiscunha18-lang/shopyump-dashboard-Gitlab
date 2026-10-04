import type { Metadata } from 'next';
import PersonalizarPageClient from '@/theme-editor/pages/PersonalizarPageClient';

export const metadata: Metadata = { title: 'Personalizar loja | Shopyump' };

export default function PersonalizarPage() {
  return <PersonalizarPageClient />;
}

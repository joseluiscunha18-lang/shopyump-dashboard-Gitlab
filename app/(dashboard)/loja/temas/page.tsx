import type { Metadata } from 'next';
import { ThemeCatalog } from '@/components/loja/customize/ThemeCatalog';

export const metadata: Metadata = { title: 'Temas | Shopyump' };

// As miniaturas do catálogo são composições abstratas feitas só dos
// tokens do tema (cores, espaçamento) — não usam dados da loja nem dos
// produtos, então esta página não precisa buscar nada no Supabase.
// Os dados reais só entram na página de detalhe do tema.
export default function TemasPage() {
  return <ThemeCatalog />;
}

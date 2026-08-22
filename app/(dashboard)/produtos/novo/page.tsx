import type { Metadata } from 'next';
import { getUserContext } from '@/lib/auth/getUserContext';
import { ProductForm } from '@/components/produtos/ProductForm';

export const metadata: Metadata = { title: 'Novo produto | Shopyump' };

export default async function NovoProdutoPage() {
  const ctx = await getUserContext();
  if (!ctx.loja) return null;

  return (
    <div className="flex flex-col gap-8">
      <ProductForm lojaId={ctx.loja.id} />
    </div>
  );
}

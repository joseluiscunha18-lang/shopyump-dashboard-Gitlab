import type { Metadata } from 'next';
import { getUserContext } from '@/lib/auth/getUserContext';
import { ProductForm } from '@/components/produtos/ProductForm';
import { ProductFormHeader } from '@/components/produtos/ProductFormHeader';

export const metadata: Metadata = { title: 'Novo produto | Shopyump' };

export default async function NovoProdutoPage() {
  const ctx = await getUserContext();
  if (!ctx.loja) return null;

  return (
    <div className="flex flex-col gap-8">
      <ProductFormHeader mode="criar" />
      <ProductForm lojaId={ctx.loja.id} />
    </div>
  );
}

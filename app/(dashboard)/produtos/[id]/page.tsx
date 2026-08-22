import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getUserContext } from '@/lib/auth/getUserContext';
import { getProdutoById } from '@/lib/queries/produtos';
import { ProductForm } from '@/components/produtos/ProductForm';
import { ProductFormHeader } from '@/components/produtos/ProductFormHeader';

export const metadata: Metadata = { title: 'Editar produto | Shopyump' };

export default async function EditarProdutoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ctx = await getUserContext();
  if (!ctx.loja) return null;

  const produto = await getProdutoById(id);
  if (!produto || produto.loja_id !== ctx.loja.id) notFound();

  return (
    <div className="flex flex-col gap-6">
      <ProductFormHeader mode="editar" />
      <ProductForm lojaId={ctx.loja.id} produto={produto} />
    </div>
  );
}

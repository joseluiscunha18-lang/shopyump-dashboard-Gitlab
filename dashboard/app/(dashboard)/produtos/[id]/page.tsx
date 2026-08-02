import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getUserContext } from '@/lib/auth/getUserContext';
import { getProdutoById } from '@/lib/queries/produtos';
import { ProductForm } from '@/components/produtos/ProductForm';

export const metadata: Metadata = { title: 'Editar produto | Shopyump' };

export default async function EditarProdutoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ctx = await getUserContext();
  if (!ctx.loja) return null;

  const produto = await getProdutoById(id);
  if (!produto || produto.loja_id !== ctx.loja.id) notFound();

  return (
    <div className="flex flex-col gap-6 pt-2">
      <div>
        <h2 className="text-lg font-black text-ink tracking-tight">Editar produto</h2>
        <p className="text-[12px] font-medium text-slate-400">{produto.nome}</p>
      </div>
      <ProductForm lojaId={ctx.loja.id} produto={produto} />
    </div>
  );
}

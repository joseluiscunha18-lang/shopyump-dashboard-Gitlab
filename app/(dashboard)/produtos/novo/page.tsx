import type { Metadata } from 'next';
import { getUserContext } from '@/lib/auth/getUserContext';
import { ProductForm } from '@/components/produtos/ProductForm';

export const metadata: Metadata = { title: 'Novo produto | Shopyump' };

export default async function NovoProdutoPage() {
  const ctx = await getUserContext();
  if (!ctx.loja) return null;

  return (
    <div className="flex flex-col gap-6 pt-2">
      <div>
        <h2 className="text-lg font-black text-ink tracking-tight">Novo produto</h2>
        <p className="text-[12px] font-medium text-slate-400">Adiciona um produto ao teu catálogo</p>
      </div>
      <ProductForm lojaId={ctx.loja.id} />
    </div>
  );
}

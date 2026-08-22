import type { Metadata } from 'next';
import { getUserContext } from '@/lib/auth/getUserContext';
import { ProductForm } from '@/components/produtos/ProductForm';

export const metadata: Metadata = { title: 'Novo produto | Shopyump' };

export default async function NovoProdutoPage() {
  const ctx = await getUserContext();
  if (!ctx.loja) return null;

  return (
    <div className="flex flex-col gap-8 pt-2">
      <div className="flex flex-col gap-1">
        <h2 className="text-[26px] font-extrabold leading-tight tracking-tight text-[#111110]">
          Novo produto
        </h2>
        <p className="text-[13px] font-medium text-[#71717A]">
          Adiciona um produto ao teu catálogo
        </p>
      </div>
      <ProductForm lojaId={ctx.loja.id} />
    </div>
  );
}

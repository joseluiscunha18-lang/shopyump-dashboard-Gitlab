import type { Metadata } from 'next';
import { getUserContext } from '@/lib/auth/getUserContext';
import { getProdutosCount } from '@/lib/queries/produtos';
import { ProductForm } from '@/components/produtos/ProductForm';

export const metadata: Metadata = { title: 'Novo produto | Shopyump' };

export default async function NovoProdutoPage() {
  const ctx = await getUserContext();
  if (!ctx.loja) return null;

  // Decide, ainda no servidor, se esta publicação será a 1ª da loja — é
  // esse instante (contagem ANTES do insert) que define se o card "Seu
  // primeiro produto está no ar" deve nascer no fim. Calcular isto depois
  // (via router.refresh) exigiria mostrar o banner otimista e escondê-lo de
  // novo caso afinal não fosse o primeiro — aqui evita-se esse "flash".
  const souPrimeiroProduto = (await getProdutosCount(ctx.loja.id)) === 0;

  return (
    <div className="flex flex-col gap-8">
      <ProductForm lojaId={ctx.loja.id} souPrimeiroProduto={souPrimeiroProduto} />
    </div>
  );
}

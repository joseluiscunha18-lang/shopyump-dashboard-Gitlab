'use client';

import { PlaceholderImage } from './PlaceholderImage';
import { formatMzn } from '../cart/whatsappOrder';
import type { ProdutoPublico } from '@/lib/queries/produtosPublicos';

export function ProductCard({ produto, onAdicionar }: { produto: ProdutoPublico; onAdicionar: () => void }) {
  const foto = produto.fotos[0];
  const precoEfetivo = produto.preco_promo ?? produto.preco;

  return (
    <div className="flex flex-col overflow-hidden rounded-[12px] border border-[#EAE7E1]">
      <div className="aspect-square w-full overflow-hidden">
        {foto ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={foto} alt={produto.nome} className="h-full w-full object-cover" />
        ) : (
          <PlaceholderImage variante="produto" />
        )}
      </div>

      <div className="flex flex-col gap-1.5 p-3">
        <span className="line-clamp-2 text-[12.5px] font-semibold leading-snug text-[#141414]">{produto.nome}</span>

        <div className="flex items-baseline gap-1.5">
          <span className="text-[13px] font-bold text-[#141414]">{formatMzn(precoEfetivo)}</span>
          {produto.preco_promo && (
            <span className="text-[10.5px] font-medium text-[#B5AFA5] line-through">{formatMzn(produto.preco)}</span>
          )}
        </div>

        <button
          type="button"
          onClick={onAdicionar}
          className="mt-1 rounded-[8px] bg-[#141414] py-2 text-[11.5px] font-bold text-white active:opacity-80"
        >
          Adicionar
        </button>
      </div>
    </div>
  );
}

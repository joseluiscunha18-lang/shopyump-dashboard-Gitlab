'use client';

import { formatMzn } from '../cart/whatsappOrder';
import type { ProdutoPublico } from '@/lib/queries/produtosPublicos';

export function ProductDetail({ produto, onAdicionar }: { produto: ProdutoPublico; onAdicionar: () => void }) {
  const foto = produto.fotos[0];
  const precoEfetivo = produto.preco_promo ?? produto.preco;

  return (
    <div className="flex flex-col gap-5 px-4 py-5">
      <div className="aspect-square w-full overflow-hidden rounded-[28px] border border-[oklch(0.88224_0_0)] bg-[oklch(0.965_0_0)]">
        {foto && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={foto} alt={produto.nome} className="h-full w-full object-cover" />
        )}
      </div>

      <div className="flex flex-col gap-2">
        <span className="text-[11px] font-black uppercase tracking-widest text-[oklch(0.52081_0_0)]">
          {produto.categoria}
        </span>
        <h1 className="font-[family-name:'Manrope',_sans-serif] text-[22px] font-extrabold leading-tight text-[oklch(0.24353_0_0)]">
          {produto.nome}
        </h1>
        <div className="flex items-baseline gap-2">
          <span className="text-[18px] font-bold text-[oklch(0.24353_0_0)]">{formatMzn(precoEfetivo)}</span>
          {produto.preco_promo && (
            <span className="text-[13px] font-medium text-[oklch(0.52081_0_0)] line-through">
              {formatMzn(produto.preco)}
            </span>
          )}
        </div>
        {produto.descricao && (
          <p className="mt-1 text-[13.5px] leading-relaxed text-[oklch(0.52081_0_0)]">{produto.descricao}</p>
        )}
      </div>

      <button
        type="button"
        onClick={onAdicionar}
        className="rounded-[12px] bg-[oklch(0.24353_0_0)] py-3.5 text-[13.5px] font-bold text-white active:opacity-80"
      >
        Adicionar ao carrinho
      </button>
    </div>
  );
}

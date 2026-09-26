'use client';

import { PlaceholderImage } from './PlaceholderImage';
import { formatMzn } from '../cart/whatsappOrder';
import { isProdutoDemo } from '../demo/demoData';
import type { ProdutoPublico } from '@/lib/queries/produtosPublicos';

export function ProductCard({
  produto,
  emModoDemo,
  onAdicionar,
  onAbrirDetalhe,
}: {
  produto: ProdutoPublico;
  emModoDemo: boolean;
  onAdicionar: () => void;
  onAbrirDetalhe: () => void;
}) {
  const foto = produto.fotos[0];
  const precoEfetivo = produto.preco_promo ?? produto.preco;
  // Ilustrações-exemplo (LUME) ficam melhor "contidas", com a moldura à
  // volta — fotos reais de produto (do lojista) ficam melhor a preencher
  // o quadrado por completo, como qualquer loja online normal.
  const imagemContida = isProdutoDemo(produto.id);

  return (
    <article className="flex flex-col">
      <button
        type="button"
        onClick={onAbrirDetalhe}
        disabled={emModoDemo}
        aria-label={emModoDemo ? produto.nome : `Ver ${produto.nome}`}
        className="aspect-square w-full overflow-hidden rounded-[28px] border border-[oklch(0.88224_0_0)] bg-[oklch(0.965_0_0)] disabled:cursor-default"
      >
        {foto ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={foto}
            alt={produto.nome}
            className={imagemContida ? 'h-full w-full object-contain p-4' : 'h-full w-full object-cover'}
          />
        ) : (
          <PlaceholderImage variante="produto" />
        )}
      </button>

      <div className="mt-3 flex flex-col gap-1.5">
        <span className="line-clamp-2 text-[12.5px] font-semibold leading-snug text-[oklch(0.24353_0_0)]">
          {produto.nome}
        </span>

        <div className="flex items-baseline gap-1.5">
          <span className="text-[13px] font-bold text-[oklch(0.24353_0_0)]">{formatMzn(precoEfetivo)}</span>
          {produto.preco_promo && (
            <span className="text-[10.5px] font-medium text-[oklch(0.52081_0_0)] line-through">
              {formatMzn(produto.preco)}
            </span>
          )}
        </div>

        {!emModoDemo && (
          <button
            type="button"
            onClick={onAdicionar}
            className="mt-1 rounded-[10px] bg-[oklch(0.24353_0_0)] py-2 text-[11.5px] font-bold text-white active:opacity-80"
          >
            Adicionar
          </button>
        )}
      </div>
    </article>
  );
}

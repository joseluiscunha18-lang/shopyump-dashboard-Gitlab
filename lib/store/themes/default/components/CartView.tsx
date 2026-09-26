'use client';

import { PlaceholderImage } from './PlaceholderImage';
import { formatMzn } from '../cart/whatsappOrder';
import { useCart } from '../cart/CartContext';

export function CartView({ onFinalizar, onContinuarComprando }: { onFinalizar: () => void; onContinuarComprando: () => void }) {
  const { items, remover, definirQuantidade, total } = useCart();

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center gap-4 px-4 py-20 text-center">
        <p className="text-[13.5px] font-medium text-[oklch(0.52081_0_0)]">O teu carrinho está vazio.</p>
        <button
          type="button"
          onClick={onContinuarComprando}
          className="rounded-[10px] bg-[oklch(0.24353_0_0)] px-5 py-2.5 text-[13px] font-bold text-white active:opacity-80"
        >
          Ver produtos
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 px-4 py-5">
      <div className="flex flex-col divide-y divide-[oklch(0.88224_0_0)]">
        {items.map((item) => (
          <div key={item.produtoId} className="flex gap-3 py-4">
            <div className="h-16 w-16 shrink-0 overflow-hidden rounded-[10px]">
              {item.foto ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={item.foto} alt={item.nome} className="h-full w-full object-cover" />
              ) : (
                <PlaceholderImage variante="produto" />
              )}
            </div>

            <div className="flex flex-1 flex-col gap-1.5">
              <span className="text-[12.5px] font-semibold leading-snug text-[oklch(0.24353_0_0)]">{item.nome}</span>
              <span className="text-[12px] font-bold text-[oklch(0.24353_0_0)]">{formatMzn(item.preco)}</span>

              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => definirQuantidade(item.produtoId, item.quantidade - 1)}
                  aria-label="Diminuir quantidade"
                  className="flex h-6 w-6 items-center justify-center rounded-full border border-[oklch(0.88224_0_0)] text-[13px] font-bold text-[oklch(0.24353_0_0)] active:opacity-60"
                >
                  −
                </button>
                <span className="min-w-4 text-center text-[12.5px] font-bold text-[oklch(0.24353_0_0)]">{item.quantidade}</span>
                <button
                  type="button"
                  onClick={() => definirQuantidade(item.produtoId, item.quantidade + 1)}
                  aria-label="Aumentar quantidade"
                  className="flex h-6 w-6 items-center justify-center rounded-full border border-[oklch(0.88224_0_0)] text-[13px] font-bold text-[oklch(0.24353_0_0)] active:opacity-60"
                >
                  +
                </button>

                <button
                  type="button"
                  onClick={() => remover(item.produtoId)}
                  className="ml-auto text-[11.5px] font-bold text-[oklch(0.52081_0_0)] active:opacity-60"
                >
                  Remover
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between border-t border-[oklch(0.88224_0_0)] pt-4">
        <span className="text-[13px] font-bold text-[oklch(0.24353_0_0)]">Total</span>
        <span className="text-[16px] font-black text-[oklch(0.24353_0_0)]">{formatMzn(total)}</span>
      </div>

      <button
        type="button"
        onClick={onFinalizar}
        className="rounded-[10px] bg-[oklch(0.24353_0_0)] py-3.5 text-[13.5px] font-bold text-white active:opacity-80"
      >
        Finalizar pedido
      </button>
    </div>
  );
}

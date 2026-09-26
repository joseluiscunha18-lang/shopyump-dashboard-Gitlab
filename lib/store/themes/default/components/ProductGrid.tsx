'use client';

import { ProductCard } from './ProductCard';
import type { ProdutoPublico } from '@/lib/queries/produtosPublicos';

export function ProductGrid({
  produtos,
  emModoDemo,
  onAdicionar,
  onAbrirDetalhe,
}: {
  produtos: ProdutoPublico[];
  emModoDemo: boolean;
  onAdicionar: (p: ProdutoPublico) => void;
  onAbrirDetalhe: (p: ProdutoPublico) => void;
}) {
  return (
    <div className="flex flex-col gap-3 px-4 pb-10 pt-6">
      <span className="text-[11px] font-black uppercase tracking-widest text-[oklch(0.52081_0_0)]">Produtos</span>

      {produtos.length === 0 ? (
        <p className="py-14 text-center text-[13px] font-medium text-[oklch(0.52081_0_0)]">
          Nenhum produto encontrado.
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          {produtos.map((p) => (
            <ProductCard
              key={p.id}
              produto={p}
              emModoDemo={emModoDemo}
              onAdicionar={() => onAdicionar(p)}
              onAbrirDetalhe={() => onAbrirDetalhe(p)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

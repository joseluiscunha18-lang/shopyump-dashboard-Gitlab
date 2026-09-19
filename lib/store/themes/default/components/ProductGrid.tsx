'use client';

import { ProductCard } from './ProductCard';
import type { ProdutoPublico } from '@/lib/queries/produtosPublicos';

export function ProductGrid({
  produtos,
  onAdicionar,
}: {
  produtos: ProdutoPublico[];
  onAdicionar: (p: ProdutoPublico) => void;
}) {
  return (
    <div className="flex flex-col gap-3 px-4 pb-10 pt-6">
      <span className="text-[11px] font-black uppercase tracking-widest text-[#A8A29E]">Produtos</span>

      {produtos.length === 0 ? (
        <p className="py-14 text-center text-[13px] font-medium text-[#A8A29E]">Nenhum produto encontrado.</p>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {produtos.map((p) => (
            <ProductCard key={p.id} produto={p} onAdicionar={() => onAdicionar(p)} />
          ))}
        </div>
      )}
    </div>
  );
}

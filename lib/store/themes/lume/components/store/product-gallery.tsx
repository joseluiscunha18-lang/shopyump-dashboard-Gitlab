'use client';

import { ProductArt } from "./product-art";
import type { Product } from "../../lib/store-data";

export function ProductGallery({ product }: { product: Product }) {
  return (
    <div className="min-w-0 self-start">
      <div className="product-gallery-slide relative p-0" aria-label={`Imagem de ${product.name}`}>
        <ProductArt kind={product.kind} className="absolute inset-0" />
      </div>
    </div>
  );
}

'use client';

import { Link } from "../../router";
import { formatPrice, isInStock, type Product } from "../../lib/store-data";
import { FavouriteButton } from "./favourite-button";
import { ProductArt } from "./product-art";
import { useStore } from "./store-context";

export function ProductCard({ product }: { product: Product }) {
  const { favourites, toggleFavourite } = useStore();
  const liked = favourites.includes(product.id);
  const available = isInStock(product);
  return (
    <article className="group min-w-0">
      <div className="relative">
        <Link
          to="/produto/$productId"
          params={{ productId: product.id }}
          className="product-frame flex items-center justify-center bg-product-gallery p-0"
          aria-label={`Ver ${product.name}`}
        >
          <ProductArt kind={product.kind} className="transition-transform duration-500 group-hover:-translate-y-1 group-hover:scale-[1.04]" />
        </Link>
        {!available && (
          <span className="absolute left-2 top-2 z-10 rounded-full bg-foreground px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-background">
            Esgotado
          </span>
        )}
        <FavouriteButton productName={product.name} liked={liked} onToggle={() => toggleFavourite(product.id)} className="absolute right-2 top-2 z-10" />
      </div>
      <div className="mt-3 min-w-0">
        <Link to="/produto/$productId" params={{ productId: product.id }} title={product.name} className="block truncate text-sm font-medium leading-tight text-foreground hover:underline">{product.name}</Link>
        <p className="mt-1 text-sm font-bold text-foreground">{formatPrice(product.price)}</p>
      </div>
    </article>
  );
}

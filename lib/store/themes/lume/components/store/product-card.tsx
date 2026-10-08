'use client';

import { Link } from "../../router";
import { formatPrice, isInStock, type Product } from "../../lib/store-data";
import { ProductArt } from "./product-art";
import { ProductCardView } from "./product-card-view";
import { useStore } from "./store-context";

/**
 * Cartão de produto da loja pública: liga o cartão partilhado (`ProductCardView`,
 * o mesmo que o editor desenha) ao router, aos favoritos e ao stock.
 */
export function ProductCard({ product }: { product: Product }) {
  const { favourites, toggleFavourite } = useStore();
  return (
    <ProductCardView
      name={product.name}
      priceLabel={formatPrice(product.price)}
      photo={product.images?.[0]}
      fallback={<ProductArt kind={product.kind} className="transition-transform duration-500 group-hover:-translate-y-1 group-hover:scale-[1.04]" />}
      available={isInStock(product)}
      liked={favourites.includes(product.id)}
      onToggleFavourite={() => toggleFavourite(product.id)}
      renderLink={({ children, ...rest }) => (
        <Link to="/produto/$productId" params={{ productId: product.id }} {...rest}>
          {children}
        </Link>
      )}
    />
  );
}

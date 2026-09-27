'use client';

import { CircleCheck, ShoppingCart } from "lucide-react";
import { useEffect, useRef, useState, type RefObject } from "react";
import { Button } from "../ui/button";
import { cn } from "../../lib/utils";
import type { Product } from "../../lib/store-data";
import { productImage } from "./product-art";
import { useStore, type CartVariantSelection } from "./store-context";

type Props = {
  product: Product;
  quantity?: number;
  flyFrom?: RefObject<HTMLElement | null>;
  className?: string;
  variant?: "default" | "outline";
  size?: "default" | "lg";
  label?: string;
  /** Versão/variante escolhida na página do produto (undefined = produto sem variantes). */
  selectedVariant?: CartVariantSelection;
};

export function AddToCartButton({
  product,
  quantity = 1,
  flyFrom,
  className,
  variant = "outline",
  size = "lg",
  label = "Adicionar ao Carrinho",
  selectedVariant,
}: Props) {
  const { addToCart, flyToCart } = useStore();
  const buttonRef = useRef<HTMLButtonElement>(null);
  const timer = useRef<number | null>(null);
  const [added, setAdded] = useState(false);

  useEffect(() => () => {
    if (timer.current) window.clearTimeout(timer.current);
  }, []);

  const handleClick = () => {
    const gallery = flyFrom?.current;
    const galleryBox = gallery?.getBoundingClientRect();
    const visibleImage = gallery && galleryBox && [...gallery.querySelectorAll<HTMLElement>(".product-gallery-slide img")].find((image) => {
      const box = image.getBoundingClientRect();
      return box.left < galleryBox.right && box.right > galleryBox.left && box.top < galleryBox.bottom && box.bottom > galleryBox.top;
    });
    const source = visibleImage ?? gallery ?? buttonRef.current;
    if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      buttonRef.current?.animate(
        [{ transform: "scale(1)" }, { transform: "scale(0.96)", offset: 0.4 }, { transform: "scale(1)" }],
        { duration: 280, easing: "cubic-bezier(0.22, 1, 0.36, 1)" },
      );
    }
    flyToCart(source, selectedVariant?.image ?? product.images?.[0] ?? productImage(product.kind), () =>
      addToCart(product, quantity, selectedVariant),
    );
    setAdded(true);
    if (timer.current) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setAdded(false), 1600);
  };

  return (
    <Button
      ref={buttonRef}
      type="button"
      variant={variant}
      size={size}
      onClick={handleClick}
      aria-live="polite"
      className={cn("add-to-cart-button min-w-0 gap-2 shadow-none max-sm:text-xs", className)}
      data-added={added ? "true" : undefined}
    >
      <span className="add-to-cart-labels">
        <span className="add-to-cart-content add-to-cart-idle" aria-hidden={added}>
          <ShoppingCart aria-hidden="true" />
          <span>{label}</span>
        </span>
        <span className="add-to-cart-content add-to-cart-success" aria-hidden={!added}>
          <CircleCheck aria-hidden="true" />
          <span>Adicionado!</span>
        </span>
      </span>
    </Button>
  );
}

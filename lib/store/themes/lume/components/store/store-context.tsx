'use client';

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { Product } from "../../lib/store-data";

/**
 * Opções de uma versão/variante escolhida ao adicionar ao carrinho.
 * Quando ausente, o item usa preço/imagem/estoque do produto base
 * (produto sem variantes).
 */
export type CartVariantSelection = {
  /** `versao.chave` — usado para diferenciar linhas do mesmo produto. */
  chave: string;
  /** ex: "Preto / M" — mostrado no carrinho/checkout. */
  label: string;
  /** preço resolvido para esta versão (já com fallback ao preço base). */
  unitPrice: number;
  image?: string;
};

type CartItem = { product: Product; quantity: number; variant?: CartVariantSelection };
/** Identidade de uma linha do carrinho: mesmo produto + mesma variante. */
const cartItemKey = (productId: string, variantChave?: string) => `${productId}::${variantChave ?? ""}`;

type StoreValue = {
  cart: CartItem[];
  favourites: string[];
  cartOpen: boolean;
  setCartOpen: (open: boolean) => void;
  addToCart: (product: Product, quantity?: number, variant?: CartVariantSelection) => void;
  updateQuantity: (itemKey: string, quantity: number) => void;
  removeFromCart: (itemKey: string) => void;
  toggleFavourite: (id: string) => void;
  subtotal: number;
  cartCount: number;
  registerCartTarget: (element: HTMLElement | null) => () => void;
  flyToCart: (source: HTMLElement | null, imageSrc: string, onArrival: () => void) => void;
};

const StoreContext = createContext<StoreValue | undefined>(undefined);

const isVisible = (element: HTMLElement) => {
  const rect = element.getBoundingClientRect();
  return rect.width > 0 && rect.height > 0 && element.offsetParent !== null;
};

export function StoreProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [favourites, setFavourites] = useState<string[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const cartTargets = useRef<Set<HTMLElement>>(new Set());

  const registerCartTarget = useCallback((element: HTMLElement | null) => {
    if (!element) return () => {};
    const targets = cartTargets.current;
    targets.add(element);
    return () => {
      targets.delete(element);
    };
  }, []);

  const pulseCart = useCallback(() => {
    for (const target of cartTargets.current) {
      if (!isVisible(target)) continue;
      target.classList.remove("cart-target-pulse");
      // force reflow so the animation can restart
      void target.offsetWidth;
      target.classList.add("cart-target-pulse");
      window.setTimeout(() => target.classList.remove("cart-target-pulse"), 620);
    }
  }, []);

  const flyToCart = useCallback(
    (source: HTMLElement | null, imageSrc: string, onArrival: () => void) => {
      if (typeof window === "undefined") return;
      const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const target = [...cartTargets.current].find((item) => item.dataset["cartHeader"] === "true" && isVisible(item));
      if (!source || !target || prefersReduced || typeof source.animate !== "function") {
        onArrival();
        pulseCart();
        return;
      }

      const from = source.getBoundingClientRect();
      const to = target.getBoundingClientRect();
      const size = Math.min(72, Math.max(44, from.width * 0.16));

      const ghost = document.createElement("div");
      ghost.className = "cart-fly-ghost";
      ghost.style.width = `${size}px`;
      ghost.style.height = `${size}px`;
      ghost.style.left = `${from.left + from.width / 2 - size / 2}px`;
      ghost.style.top = `${from.top + from.height / 2 - size / 2}px`;
      const image = document.createElement("img");
      image.src = imageSrc;
      image.alt = "";
      ghost.appendChild(image);
      document.body.appendChild(ghost);

      const dx = to.left + to.width / 2 - (from.left + from.width / 2);
      const dy = to.top + to.height / 2 - (from.top + from.height / 2);
      const steps = 24;
      const frames = Array.from({ length: steps + 1 }, (_, index) => {
        const t = index / steps;
        const x = dx * t;
        const y = dy * t;
        const scale = 1 - 0.9 * t;
        return {
          transform: `translate3d(${x}px, ${y}px, 0) scale(${scale})`,
          opacity: t > 0.72 ? String((1 - t) / 0.28) : "1",
        };
      });

      const animation = ghost.animate(frames, {
         duration: 650,
        easing: "cubic-bezier(0.22, 0.61, 0.36, 1)",
        fill: "forwards",
      });
      animation.finished
        .then(() => {
          ghost.remove();
          onArrival();
          pulseCart();
        })
        .catch(() => { ghost.remove(); onArrival(); });
    },
    [pulseCart],
  );

  const addToCart = (product: Product, quantity = 1, variant?: CartVariantSelection) => {
    setCart((current) => {
      const key = cartItemKey(product.id, variant?.chave);
      const existing = current.find((item) => cartItemKey(item.product.id, item.variant?.chave) === key);
      return existing
        ? current.map((item) =>
            cartItemKey(item.product.id, item.variant?.chave) === key
              ? { ...item, quantity: item.quantity + quantity }
              : item,
          )
        : [...current, { product, quantity, variant }];
    });
  };

  const updateQuantity = (itemKey: string, quantity: number) => {
    if (quantity < 1) return;
    setCart((current) =>
      current.map((item) => (cartItemKey(item.product.id, item.variant?.chave) === itemKey ? { ...item, quantity } : item)),
    );
  };
  const removeFromCart = (itemKey: string) =>
    setCart((current) => current.filter((item) => cartItemKey(item.product.id, item.variant?.chave) !== itemKey));
  const toggleFavourite = (id: string) => setFavourites((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);

  const value = useMemo(() => ({
    cart, favourites, cartOpen, setCartOpen, addToCart, updateQuantity, removeFromCart, toggleFavourite,
    registerCartTarget, flyToCart,
    subtotal: cart.reduce((sum, item) => sum + (item.variant?.unitPrice ?? item.product.price) * item.quantity, 0),
    cartCount: cart.reduce((sum, item) => sum + item.quantity, 0),
  }), [cart, favourites, cartOpen, registerCartTarget, flyToCart]);

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const value = useContext(StoreContext);
  if (!value) throw new Error("useStore must be used inside StoreProvider");
  return value;
}

export { cartItemKey };
export type { CartItem };

'use client';

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

export interface CartItem {
  produtoId: string;
  nome: string;
  preco: number; // preço já efectivo (promo quando existe)
  foto: string | null;
  quantidade: number;
}

interface CartContextValue {
  items: CartItem[];
  adicionar: (item: Omit<CartItem, 'quantidade'>) => void;
  remover: (produtoId: string) => void;
  definirQuantidade: (produtoId: string, quantidade: number) => void;
  limpar: () => void;
  total: number;
  contagem: number;
}

const CartContext = createContext<CartContextValue | null>(null);

/**
 * Um `localStorage` por loja (`sy_cart_<lojaId>`) — importante porque a
 * loja pública é multi-tenant: a mesma pessoa pode visitar duas lojas
 * Shopyump diferentes no mesmo telemóvel/browser, e os carrinhos não se
 * podem misturar.
 */
function chaveCarrinho(lojaId: string) {
  return `sy_cart_${lojaId}`;
}

export function CartProvider({ lojaId, children }: { lojaId: string; children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [hidratado, setHidratado] = useState(false);

  // Carrega do localStorage só no cliente (evita mismatch de SSR).
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(chaveCarrinho(lojaId));
      if (raw) setItems(JSON.parse(raw));
    } catch {
      // localStorage indisponível (modo privado, etc.) — carrinho fica só em memória.
    }
    setHidratado(true);
  }, [lojaId]);

  useEffect(() => {
    if (!hidratado) return;
    try {
      window.localStorage.setItem(chaveCarrinho(lojaId), JSON.stringify(items));
    } catch {
      // idem
    }
  }, [items, lojaId, hidratado]);

  function adicionar(item: Omit<CartItem, 'quantidade'>) {
    setItems((atual) => {
      const existe = atual.find((i) => i.produtoId === item.produtoId);
      if (existe) {
        return atual.map((i) => (i.produtoId === item.produtoId ? { ...i, quantidade: i.quantidade + 1 } : i));
      }
      return [...atual, { ...item, quantidade: 1 }];
    });
  }

  function remover(produtoId: string) {
    setItems((atual) => atual.filter((i) => i.produtoId !== produtoId));
  }

  function definirQuantidade(produtoId: string, quantidade: number) {
    if (quantidade <= 0) return remover(produtoId);
    setItems((atual) => atual.map((i) => (i.produtoId === produtoId ? { ...i, quantidade } : i)));
  }

  function limpar() {
    setItems([]);
  }

  const total = useMemo(() => items.reduce((soma, i) => soma + i.preco * i.quantidade, 0), [items]);
  const contagem = useMemo(() => items.reduce((soma, i) => soma + i.quantidade, 0), [items]);

  return (
    <CartContext.Provider value={{ items, adicionar, remover, definirQuantidade, limpar, total, contagem }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart tem de ser usado dentro de <CartProvider>');
  return ctx;
}

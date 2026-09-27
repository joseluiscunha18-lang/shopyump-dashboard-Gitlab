'use client';

import { Link } from "../../router";
import { Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import { Button } from "../ui/button";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "../ui/sheet";
import { formatPrice } from "../../lib/store-data";
import { ProductArt } from "./product-art";
import { useStore, cartItemKey } from "./store-context";

export function CartDrawer() {
  const { cart, cartOpen, setCartOpen, updateQuantity, removeFromCart, subtotal } = useStore();
  return (
    <Sheet open={cartOpen} onOpenChange={setCartOpen}>
      <SheetContent className="flex w-[92vw] max-w-md flex-col p-0" aria-describedby="cart-description">
        <SheetHeader className="border-b border-border px-5 py-5 text-left">
          <SheetTitle>O seu carrinho</SheetTitle>
          <SheetDescription id="cart-description">Revise os artigos antes de finalizar a compra.</SheetDescription>
        </SheetHeader>
        <div className="flex-1 overflow-y-auto px-5 py-4">
          {cart.length === 0 ? <div className="flex h-full min-h-72 flex-col items-center justify-center text-center"><span className="grid size-14 place-items-center rounded-full bg-muted"><ShoppingBag /></span><h3 className="mt-4 font-semibold">O carrinho está vazio</h3><p className="mt-1 max-w-56 text-sm text-muted-foreground">Adicione produtos para começar o seu pedido.</p></div> : <div className="grid gap-5">{cart.map(({ product, quantity, variant }) => { const key = cartItemKey(product.id, variant?.chave); const price = variant?.unitPrice ?? product.price; return <div key={key} className="grid grid-cols-[76px_1fr] gap-3 border-b border-border pb-5"><div className={`product-mini product-tone-${product.tone}`}>{variant?.image ? <img src={variant.image} alt="" className="h-full w-full object-cover" /> : <ProductArt kind={product.kind}/>}</div><div><div className="flex justify-between gap-3"><div><p className="text-sm font-semibold">{product.name}</p>{variant?.label && <p className="text-xs text-muted-foreground">{variant.label}</p>}<p className="mt-1 text-xs text-muted-foreground">{formatPrice(price)}</p></div><Button variant="ghost" size="icon-sm" aria-label={`Remover ${product.name}`} onClick={() => removeFromCart(key)}><Trash2 /></Button></div><div className="mt-3 inline-flex h-8 items-center rounded-full border border-border"><Button variant="ghost" size="icon-sm" aria-label="Diminuir quantidade" onClick={() => updateQuantity(key, quantity - 1)} disabled={quantity === 1}><Minus /></Button><span className="w-7 text-center text-xs font-semibold">{quantity}</span><Button variant="ghost" size="icon-sm" aria-label="Aumentar quantidade" onClick={() => updateQuantity(key, quantity + 1)}><Plus /></Button></div></div></div>; })}</div>}
        </div>
        <div className="border-t border-border bg-background p-5"><div className="mb-4 flex items-center justify-between"><span className="text-sm text-muted-foreground">Subtotal</span><strong className="text-lg">{formatPrice(subtotal)}</strong></div><Button asChild size="lg" className="w-full" disabled={cart.length === 0}><Link to="/checkout" onClick={() => setCartOpen(false)}>Finalizar Compra</Link></Button></div>
      </SheetContent>
    </Sheet>
  );
}

'use client';

import { useState } from "react";
import { createFileRoute, Link } from "../router";
import { ArrowLeft, MapPin, ShoppingBag } from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import { ProductArt } from "../components/store/product-art";
import { useStore } from "../components/store/store-context";
import { useAuth } from "../components/store/auth-context";
import { formatPrice } from "../lib/store-data";

export const Route = createFileRoute("/checkout")({
  head: () => ({
    meta: [
      { title: "Finalizar Compra — LUME." },
      { name: "description", content: "Confirme os dados de entrega e finalize o seu pedido LUME." },
      { property: "og:title", content: "Finalizar Compra — LUME." },
      { property: "og:description", content: "Confirme os dados de entrega e finalize o seu pedido LUME." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: CheckoutPage,
});

function CheckoutPage() {
  const { cart, subtotal } = useStore();
  const { account, saveDelivery, addOrder } = useAuth();
  const [editing, setEditing] = useState(false);
  const saved = account?.delivery ?? null;

  const submitOrder = (details: { name: string; phone: string; address: string }) => {
    saveDelivery(details);
    addOrder({
      total: subtotal,
      items: cart.map(({ product, quantity, variant }) => ({
        name: variant?.label ? `${product.name} (${variant.label})` : product.name,
        quantity,
      })),
    });
    const items = cart
      .map(({ product, quantity, variant }) => `${quantity}x ${product.name}${variant?.label ? ` (${variant.label})` : ""}`)
      .join(", ");
    const message = `Olá, sou ${details.name}. Pedido: ${items}. Total: ${formatPrice(subtotal)}. WhatsApp: ${details.phone}. Entrega: ${details.address}.`;
    window.open(`https://wa.me/258840000000?text=${encodeURIComponent(message)}`, "_blank", "noopener,noreferrer");
  };

  const handleFormSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    submitOrder({
      name: String(data.get("name") ?? ""),
      phone: String(data.get("phone") ?? ""),
      address: String(data.get("address") ?? ""),
    });
    setEditing(false);
  };

  if (!cart.length)
    return (
      <section className="mx-auto flex min-h-[520px] max-w-6xl flex-col items-center justify-center px-5 text-center">
        <span className="grid size-14 place-items-center rounded-full bg-muted"><ShoppingBag /></span>
        <h1 className="mt-4 text-xl font-bold">O carrinho está vazio</h1>
        <p className="mt-2 text-sm text-muted-foreground">Adicione um produto antes de finalizar a compra.</p>
        <Button asChild className="mt-5"><Link to="/">Ver produtos</Link></Button>
      </section>
    );

  const showPreview = Boolean(saved) && !editing;

  return (
    <section className="mx-auto max-w-6xl px-5 py-8 sm:px-6 sm:py-12">
      <Button asChild variant="ghost" size="sm" className="mb-6 -ml-2"><Link to="/"><ArrowLeft /> Continuar a explorar</Link></Button>
      <h1 className="text-2xl font-bold">Finalizar compra</h1>
      <div className="mt-7 grid gap-10 md:grid-cols-[1fr_.8fr]">
        {showPreview && saved ? (
          <div className="grid content-start gap-4">
            <div className="rounded-2xl border border-border bg-card p-5">
              <p className="text-xs font-semibold uppercase text-muted-foreground">Entregar em</p>
              <div className="mt-3 flex items-start gap-3 text-sm">
                <MapPin className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                <div>
                  <p className="font-semibold">{saved.name}</p>
                  <p className="text-muted-foreground">{saved.address}</p>
                  <p className="text-muted-foreground">{saved.phone}</p>
                </div>
              </div>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button size="lg" onClick={() => submitOrder(saved)}>Confirmar pedido</Button>
              <Button size="lg" variant="outline" onClick={() => setEditing(true)}>Alterar endereço</Button>
            </div>
          </div>
        ) : (
          <form className="grid content-start gap-4" onSubmit={handleFormSubmit}>
            <label className="grid gap-2 text-sm font-semibold">Nome completo<Input name="name" required defaultValue={saved?.name ?? ""} placeholder="O seu nome" /></label>
            <label className="grid gap-2 text-sm font-semibold">WhatsApp<Input name="phone" required type="tel" defaultValue={saved?.phone ?? ""} placeholder="+258 84 000 0000" /></label>
            <label className="grid gap-2 text-sm font-semibold">Endereço<Textarea name="address" required defaultValue={saved?.address ?? ""} className="min-h-28" placeholder="Bairro, rua e referência" /></label>
            <Button size="lg" type="submit">Enviar pedido via WhatsApp</Button>
          </form>
        )}
        <aside className="h-fit rounded-2xl border border-border bg-card p-5 shadow-soft">
          <h2 className="font-semibold">Resumo do pedido</h2>
          <div className="mt-5 grid gap-4">
            {cart.map(({ product, quantity, variant }) => (
              <div key={`${product.id}::${variant?.chave ?? ""}`} className="grid grid-cols-[52px_1fr_auto] items-center gap-3">
                <div className={`product-mini product-tone-${product.tone}`}>
                  {variant?.image ? <img src={variant.image} alt="" className="h-full w-full object-cover" /> : <ProductArt kind={product.kind} />}
                </div>
                <div>
                  <p className="text-sm font-medium">{product.name}</p>
                  {variant?.label && <p className="text-xs text-muted-foreground">{variant.label}</p>}
                  <p className="text-xs text-muted-foreground">Quantidade: {quantity}</p>
                </div>
                <strong className="text-sm">{formatPrice((variant?.unitPrice ?? product.price) * quantity)}</strong>
              </div>
            ))}
          </div>
          <div className="mt-5 flex justify-between border-t border-border pt-4">
            <span className="text-sm text-muted-foreground">Total</span>
            <strong>{formatPrice(subtotal)}</strong>
          </div>
        </aside>
      </div>
    </section>
  );
}

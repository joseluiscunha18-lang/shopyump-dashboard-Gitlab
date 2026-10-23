'use client';

import { useState } from "react";
import { createFileRoute, Link } from "../router";
import { ArrowLeft, CheckCircle2, MapPin, ShoppingCart } from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import { ProductArt } from "../components/store/product-art";
import { useStore } from "../components/store/store-context";
import { useAuth } from "../components/store/auth-context";
import { useLumeLoja } from "../components/store/lume-loja-context";
import { criarPedidoPublico, codigoPedido } from "@/lib/mutations/pedidosPublicos";
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

/** Só dígitos, com indicativo. Números moçambicanos de 9 dígitos (8X…) recebem 258. */
function whatsappDigits(raw: string | undefined): string | null {
  if (!raw) return null;
  let d = raw.replace(/\D/g, "");
  if (d.startsWith("00")) d = d.slice(2);
  if (d.length === 9 && d.startsWith("8")) d = `258${d}`;
  return d.length >= 8 ? d : null;
}

function CheckoutPage() {
  const { cart, subtotal, clearCart } = useStore();
  const { account, saveDelivery, addOrder } = useAuth();
  const { contactos, lojaId, usandoDemo } = useLumeLoja();
  const [editing, setEditing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState<{ code: string | null; url: string } | null>(null);
  const saved = account?.delivery ?? null;
  const lojaWhatsapp = whatsappDigits(contactos.whatsapp);

  const submitOrder = async (details: { name: string; phone: string; address: string }) => {
    if (submitting || !lojaWhatsapp) return;
    setSubmitting(true);

    const itens = cart.map(({ product, quantity, variant }) => ({
      id: product.id,
      nome: product.name,
      preco: variant?.unitPrice ?? product.price,
      quantidade: quantity,
      imagem: variant?.image ?? product.images?.[0],
      corSelecionada: variant?.label ?? null,
      tamanhoSelecionado: null,
    }));

    // 1) Regista o pedido no dashboard (não regista na loja de demonstração).
    let code: string | null = null;
    if (!usandoDemo) {
      const res = await criarPedidoPublico({
        lojaId,
        nome: details.name.trim(),
        telefone: details.phone.trim(),
        endereco: details.address.trim(),
        itens,
        total: subtotal,
      });
      if (res.ok) code = codigoPedido(res.id);
    }

    // 2) Histórico local do cliente (conta de cliente da loja).
    saveDelivery(details);
    addOrder({
      total: subtotal,
      items: cart.map(({ product, quantity, variant }) => ({
        name: variant?.label ? `${product.name} (${variant.label})` : product.name,
        quantity,
      })),
    });

    // 3) Abre o WhatsApp DA LOJA (número configurado no dashboard).
    const items = cart
      .map(({ product, quantity, variant }) => `${quantity}x ${product.name}${variant?.label ? ` (${variant.label})` : ""}`)
      .join(", ");
    const message = `Olá, sou ${details.name}.${code ? ` Pedido ${code}.` : ""} Pedido: ${items}. Total: ${formatPrice(subtotal)}. WhatsApp: ${details.phone}. Entrega: ${details.address}.`;
    const url = `https://wa.me/${lojaWhatsapp}?text=${encodeURIComponent(message)}`;

    clearCart();
    setDone({ code, url });
    setSubmitting(false);
    // Se o navegador bloquear o novo separador, segue na mesma janela.
    const w = window.open(url, "_blank", "noopener,noreferrer");
    if (!w) window.location.href = url;
  };

  const handleFormSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    void submitOrder({
      name: String(data.get("name") ?? ""),
      phone: String(data.get("phone") ?? ""),
      address: String(data.get("address") ?? ""),
    });
    setEditing(false);
  };

  if (done)
    return (
      <section className="mx-auto flex min-h-[520px] max-w-6xl flex-col items-center justify-center px-5 text-center">
        <span className="grid size-14 place-items-center rounded-full bg-muted"><CheckCircle2 /></span>
        <h1 className="mt-4 text-xl font-bold">Pedido enviado{done.code ? ` · ${done.code}` : ""}</h1>
        <p className="mt-2 max-w-sm text-sm text-muted-foreground">
          Falta só um passo: envie a mensagem no WhatsApp para a loja confirmar o seu pedido.
        </p>
        <Button asChild className="mt-5"><a href={done.url} target="_blank" rel="noopener noreferrer">Abrir WhatsApp</a></Button>
        <Button asChild variant="ghost" className="mt-2"><Link to="/">Continuar a explorar</Link></Button>
      </section>
    );

  if (!cart.length)
    return (
      <section className="mx-auto flex min-h-[520px] max-w-6xl flex-col items-center justify-center px-5 text-center">
        <span className="grid size-14 place-items-center rounded-full bg-muted"><ShoppingCart /></span>
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
      {!lojaWhatsapp && <p role="alert" className="mt-3 text-sm text-destructive">Esta loja ainda não configurou o número de WhatsApp, por isso não é possível enviar pedidos.</p>}
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
              <Button size="lg" disabled={submitting || !lojaWhatsapp} onClick={() => void submitOrder(saved)}>{submitting ? "A enviar…" : "Confirmar pedido"}</Button>
              <Button size="lg" variant="outline" onClick={() => setEditing(true)}>Alterar endereço</Button>
            </div>
          </div>
        ) : (
          <form className="grid content-start gap-4" onSubmit={handleFormSubmit}>
            <label className="grid gap-2 text-sm font-semibold">Nome completo<Input name="name" required defaultValue={saved?.name ?? ""} placeholder="O seu nome" /></label>
            <label className="grid gap-2 text-sm font-semibold">WhatsApp<Input name="phone" required type="tel" defaultValue={saved?.phone ?? ""} placeholder="+258 84 000 0000" /></label>
            <label className="grid gap-2 text-sm font-semibold">Endereço<Textarea name="address" required defaultValue={saved?.address ?? ""} className="min-h-28" placeholder="Bairro, rua e referência" /></label>
            <Button size="lg" type="submit" disabled={submitting || !lojaWhatsapp}>{submitting ? "A enviar…" : "Enviar pedido via WhatsApp"}</Button>
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

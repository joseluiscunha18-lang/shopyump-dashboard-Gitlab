'use client';

import { createFileRoute, notFound, useNavigate } from "../router";
import { BellRing, Minus, Plus } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "../components/ui/button";
import { AddToCartButton } from "../components/store/add-to-cart-button";
import { FavouriteButton } from "../components/store/favourite-button";
import { ProductGallery } from "../components/store/product-gallery";
import { ProductCard } from "../components/store/product-card";
import { useAuth } from "../components/store/auth-context";
import { useStore } from "../components/store/store-context";
import { formatPrice, getProduct, isInStock, maxQuantity } from "../lib/store-data";
import { useLumeLoja } from "../components/store/lume-loja-context";

export const Route = createFileRoute("/produto/$productId")({
  loader: ({ params }) => {
    // Para produtos demo: devolve o produto estático.
    // Para produtos reais (IDs do Supabase): getProduct retorna undefined,
    // mas não lançamos notFound() aqui — o componente vai buscar nos
    // produtos do LumeLojaContext e tratar o caso de não encontrado.
    const product = getProduct(params.productId);
    return product ?? { id: params.productId, name: "", price: 0, category: "Destaques" as const, kind: "coat" as const, tone: "blue" as const };
  },
  head: ({ loaderData }) => ({
    meta: [
      { title: loaderData ? `${loaderData.name} — LUME.` : "Produto indisponível — LUME." },
      { name: "description", content: loaderData ? `Conheça ${loaderData.name}, disponível na LUME.` : "Este produto não está disponível." },
      { property: "og:title", content: loaderData ? `${loaderData.name} — LUME.` : "Produto indisponível — LUME." },
      { property: "og:description", content: loaderData ? `Conheça ${loaderData.name}, disponível na LUME.` : "Este produto não está disponível." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ProductPage,
});

function ProductPage() {
  const loaderProduct = Route.useLoaderData();
  const navigate = useNavigate();
  const { addToCart, favourites, setCartOpen, toggleFavourite } = useStore();
  const { restockAlerts, requestRestockAlert } = useAuth();
  const { produtos: produtosContexto } = useLumeLoja();
  const [quantity, setQuantity] = useState(1);
  const [colour, setColour] = useState("Preto");
  const [size, setSize] = useState("M");
  const [awaitingAuth, setAwaitingAuth] = useState(false);
  const galleryRef = useRef<HTMLDivElement>(null);

  // Procura o produto nos dados do contexto (reais ou demo); fallback para o loader
  const productFromContext = produtosContexto.find((p) => p.id === loaderProduct.id);
  const product = productFromContext ?? (loaderProduct.name ? loaderProduct : null);

  // Se não existe em lado nenhum, o RouteNotFoundBoundary no LumeTheme.tsx
  // mostra o fallback de produto não encontrado.
  if (!product) throw new (class extends Error { constructor() { super("not-found"); } })();

  const liked = favourites.includes(product.id);
  const recommendations = produtosContexto.filter((item) => item.id !== product.id).slice(0, 4);
  const available = isInStock(product);
  const limit = maxQuantity(product);
  const alertActive = restockAlerts.includes(product.id);

  useEffect(() => {
    setQuantity(1);
  }, [product.id]);

  useEffect(() => {
    if (awaitingAuth && alertActive) {
      setAwaitingAuth(false);
      toast.success("Notificação ativada com sucesso!");
    }
  }, [awaitingAuth, alertActive]);

  const buyNow = () => {
    addToCart(product, quantity);
    setCartOpen(false);
    void navigate({ to: "/checkout" });
  };

  const notifyMe = () => {
    if (alertActive) {
      toast.success("Já vamos avisá-lo assim que chegar.");
      return;
    }
    const result = requestRestockAlert(product.id);
    if (result === "registered") toast.success("Notificação ativada com sucesso!");
    else setAwaitingAuth(true);
  };

  return (
    <div className="mx-auto max-w-6xl px-5 pb-14 pt-5 sm:px-6 sm:pb-20 sm:pt-10">
      <div className="grid gap-7 md:grid-cols-2 md:gap-12">
        <div ref={galleryRef} className="min-w-0">
          <ProductGallery product={product} />
        </div>


        <div className="flex flex-col justify-center">
          <div className="flex items-start justify-between gap-4">
            <h1 className="text-2xl font-bold">{product.name}</h1>
            <FavouriteButton productName={product.name} liked={liked} onToggle={() => toggleFavourite(product.id)} />
          </div>
          <p className="mt-1 text-lg font-semibold">{formatPrice(product.price)}</p>

          <div className="mt-3 space-y-3">
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase">Cor <span className="ml-1 font-normal normal-case text-muted-foreground">{colour}</span></p>
              <div className="mt-2 flex gap-2.5" role="group" aria-label="Escolher cor">
                {[
                  { name: "Preto", className: "bg-swatch-black" },
                  { name: "Branco", className: "bg-swatch-white" },
                  { name: "Bege", className: "bg-swatch-beige" },
                ].map((item) => (
                  <button
                    key={item.name}
                    type="button"
                    onClick={() => setColour(item.name)}
                    aria-label={item.name}
                    aria-pressed={colour === item.name}
                    className={`grid size-9 place-items-center rounded-full transition-shadow ${colour === item.name ? "ring-1 ring-foreground ring-offset-2 ring-offset-background" : "focus-visible:ring-1 focus-visible:ring-ring focus-visible:ring-offset-2"}`}
                  >
                    <span className={`size-full rounded-full border border-border ${item.className}`} aria-hidden="true" />
                  </button>
                ))}
              </div>
            </div>

            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase">Tamanho <span className="ml-1 font-normal normal-case text-muted-foreground">{size}</span></p>
              <div className="mt-2 flex flex-wrap gap-2">
                {["PP", "P", "M", "G", "XL"].map((item) => (
                  <Button key={item} variant={size === item ? "default" : "outline"} onClick={() => setSize(item)} aria-pressed={size === item} className="min-h-10 min-w-10 rounded-sm px-3.5 shadow-none">
                    {item}
                  </Button>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-4 grid gap-2.5">
            {available ? (
              <>
                <Button size="lg" className="h-12 w-full rounded-2xl text-sm font-semibold" onClick={buyNow}>Comprar Agora</Button>
                <div className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-2.5">
                  <div className="flex h-12 items-center rounded-2xl border border-border bg-card">
                    <Button variant="ghost" size="icon" className="rounded-2xl" onClick={() => setQuantity(Math.max(1, quantity - 1))} aria-label="Diminuir quantidade" disabled={quantity === 1}><Minus /></Button>
                    <span className="min-w-6 text-center text-sm font-semibold" aria-live="polite">{quantity}</span>
                    <Button variant="ghost" size="icon" className="rounded-2xl" onClick={() => setQuantity(Math.min(limit, quantity + 1))} aria-label="Aumentar quantidade" disabled={quantity >= limit}><Plus /></Button>
                  </div>
                   <AddToCartButton product={product} quantity={quantity} flyFrom={galleryRef} className="h-12 w-full rounded-2xl font-semibold" />
                </div>
              </>
            ) : (
              <>
                <p className="text-xs font-semibold uppercase text-muted-foreground">Esgotado de momento</p>
                <Button
                  size="lg"
                  onClick={notifyMe}
                  aria-pressed={alertActive}
                  className="add-to-cart-button h-12 w-full gap-2 rounded-2xl text-sm font-semibold"
                >
                  <BellRing aria-hidden="true" />
                  {alertActive ? "Já será avisado" : "Avisar-me quando chegar"}
                </Button>
              </>
            )}
          </div>

          <p className="mt-4 text-sm leading-6 text-muted-foreground">
            Uma peça versátil, confortável e fácil de combinar. Apresentação demonstrativa pronta para receber os detalhes reais do seu produto.
          </p>
        </div>
      </div>

      <section className="mt-14 sm:mt-20" aria-labelledby="recommendations-title">
        <h2 id="recommendations-title" className="text-xl font-bold sm:text-2xl">Você também pode gostar</h2>
        <div className="mt-6 grid grid-cols-2 gap-x-3 gap-y-7 sm:gap-x-5 sm:gap-y-9">
          {recommendations.map((item) => <ProductCard key={item.id} product={item} />)}
        </div>
      </section>
    </div>
  );
}

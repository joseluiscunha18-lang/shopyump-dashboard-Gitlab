'use client';

import { createFileRoute, notFound, useNavigate } from "../router";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { AddToCartButton } from "../components/store/add-to-cart-button";
import { ProductPurchasePanel } from "../components/store/product-purchase-panel";
import { ProductGallery } from "../components/store/product-gallery";
import { ProductCard } from "../components/store/product-card";
import { useAuth } from "../components/store/auth-context";
import { useStore } from "../components/store/store-context";
import { formatPrice, getProduct } from "../lib/store-data";
import { useProductGallery, useProductSelection } from "../lib/use-product-selection";
import { useLumeLoja } from "../components/store/lume-loja-context";
import { useLumePersonalizacao } from "../components/store/lume-personalizacao-context";
import { getRecommendations, shouldShowRecommendations } from "@/lib/store/shared/storefront-logic";

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
  const p = useLumePersonalizacao();
  const [awaitingAuth, setAwaitingAuth] = useState(false);
  const galleryRef = useRef<HTMLDivElement>(null);

  // Procura o produto nos dados do contexto (reais ou demo); fallback para o loader
  const productFromContext = produtosContexto.find((p) => p.id === loaderProduct.id);
  const product = productFromContext ?? (loaderProduct.name ? loaderProduct : null);

  // Se não existe em lado nenhum, o RouteNotFoundBoundary no LumeTheme.tsx
  // mostra o fallback de produto não encontrado.
  if (!product) throw new (class extends Error { constructor() { super("not-found"); } })();

  const liked = favourites.includes(product.id);
  const recommendations = getRecommendations(produtosContexto, product.id);
  const alertActive = restockAlerts.includes(product.id);

  // Variante escolhida, quantidade, preço, stock e "pode comprar?" — o MESMO hook
  // que o editor usa no preview (theme-editor/themes/lume/Renderer.tsx).
  const selection = useProductSelection(product);
  const { caracteristicas, temVariantes, versaoAtual, price, quantity, images: galleryImages } = selection;
  // Galeria com TODAS as fotos (scroll livre); trocar de cor posiciona-a na
  // foto dessa cor, e fazer swipe para a foto de outra cor atualiza a cor.
  // Mesmo hook que o editor usa.
  const { galeria, aoMudarFoto } = useProductGallery(product, selection);
  useEffect(() => {
    if (awaitingAuth && alertActive) {
      setAwaitingAuth(false);
      toast.success("Notificação ativada com sucesso!");
    }
  }, [awaitingAuth, alertActive]);

  const variantSelecionada = temVariantes && versaoAtual
    ? { chave: versaoAtual.chave, label: caracteristicas.map((c) => versaoAtual.valores[c.nome]).filter(Boolean).join(" / "), unitPrice: price, image: galleryImages[0] }
    : undefined;

  const buyNow = () => {
    addToCart(product, quantity, variantSelecionada);
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
        <div ref={galleryRef} className="min-w-0 -mx-5 sm:-mx-6 md:mx-0">
          <ProductGallery product={product} images={galeria.imagens} alvos={galeria.alvos} onSelectIndex={aoMudarFoto} />
        </div>


        <ProductPurchasePanel
          name={product.name}
          priceLabel={formatPrice(price)}
          description={product.description}
          product={product}
          selection={selection}
          labels={{ buyNow: p?.ui.buyNow ?? "Comprar Agora", addToCart: p?.ui.addToCart ?? "Adicionar ao Carrinho" }}
          liked={liked}
          onToggleFavourite={() => toggleFavourite(product.id)}
          onBuyNow={buyNow}
          onNotify={notifyMe}
          alertActive={alertActive}
          addToCartSlot={<AddToCartButton product={product} quantity={quantity} flyFrom={galleryRef} selectedVariant={variantSelecionada} className="h-12 w-full rounded-full font-semibold" />}
        />
      </div>

      {shouldShowRecommendations(recommendations, !p || p.showRecommendations) && <section className="mt-14 sm:mt-20" aria-labelledby="recommendations-title">
        <h2 id="recommendations-title" className="text-xl font-bold sm:text-2xl">{p?.ui.recommendations ?? "Você também pode gostar"}</h2>
        <div className="mt-6 grid grid-cols-2 gap-x-3 gap-y-7 sm:gap-x-5 sm:gap-y-9">
          {recommendations.map((item) => <ProductCard key={item.id} product={item} />)}
        </div>
      </section>}
    </div>
  );
}

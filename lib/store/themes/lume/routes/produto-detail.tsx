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
import {
  formatPrice,
  getProduct,
  isInStock,
  maxQuantity,
  caracteristicasDoProduto,
  valoresParaCaracteristica,
  encontrarVersao,
  versaoInicial,
  precoDaVersao,
  estoqueDaVersao,
  imagensDaVersao,
  galeriaDoProduto,
} from "../lib/store-data";
import { useLumeLoja } from "../components/store/lume-loja-context";
import { useLumePersonalizacao } from "../components/store/lume-personalizacao-context";
import { resolveBuyState } from "@/lib/store/shared/storefront-logic";

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
  const [quantity, setQuantity] = useState(1);
  const [selecao, setSelecao] = useState<Record<string, string>>({});
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
  const alertActive = restockAlerts.includes(product.id);

  const caracteristicas = caracteristicasDoProduto(product);
  const temVariantes = caracteristicas.length > 0;
  const versaoAtual = temVariantes ? encontrarVersao(product, selecao) : undefined;
  const selecaoCompleta = temVariantes ? caracteristicas.every((c) => Boolean(selecao[c.nome])) : true;

  const price = precoDaVersao(product, versaoAtual);
  const stock = estoqueDaVersao(product, versaoAtual);
  const galleryImages = imagensDaVersao(product, versaoAtual);
  // Galeria com TODAS as fotos (scroll livre); trocar de cor posiciona-a na
  // foto dessa cor, e fazer swipe para a foto de outra cor atualiza a cor.
  const galeria = galeriaDoProduto(product, versaoAtual);
  const aoMudarFoto = (indice: number) => {
    const dono = galeria.donos[indice];
    const nomeCar = galeria.caracteristica;
    if (!nomeCar || dono == null || selecao[nomeCar] === dono) return;
    setSelecao((atual) => {
      const proxima = { ...atual, [nomeCar]: dono };
      const pos = caracteristicas.findIndex((c) => c.nome === nomeCar);
      for (const c of caracteristicas.slice(pos + 1)) {
        if (!valoresParaCaracteristica(product, c.nome, proxima).includes(proxima[c.nome])) delete proxima[c.nome];
      }
      return proxima;
    });
  };
  // Fonte única da regra "pode comprar?" — a mesma função que o editor usa
  // para decidir o que mostrar no seletor de variantes e nos botões de
  // compra (ver theme-editor/themes/lume/Renderer.tsx). Isto garante que o
  // editor nunca mostra "Comprar Agora" ativo quando a loja real pediria
  // primeiro a escolha de variante, e nunca omite o seletor quando o
  // produto tem variantes.
  const buyState = resolveBuyState({
    hasVariants: temVariantes,
    selectionComplete: selecaoCompleta,
    versionActive: versaoAtual?.ativa,
    stock,
  });
  const available = buyState.status === "available" && isInStock(product, 1, stock);
  const limit = maxQuantity(product, stock);

  // Ao trocar de produto, reinicia quantidade e escolhe a primeira versão
  // ativa/em estoque (se o produto tiver variantes).
  useEffect(() => {
    setQuantity(1);
    const inicial = versaoInicial(product);
    setSelecao(inicial ? { ...inicial.valores } : {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product.id]);

  const escolher = (nomeCaracteristica: string, valor: string) => {
    setSelecao((atual) => {
      const proxima = { ...atual, [nomeCaracteristica]: valor };
      // Limpa as escolhas das características seguintes se deixarem de
      // ser válidas para o novo valor (ex: trocou a cor e o tamanho
      // selecionado não existe nessa cor).
      const indice = caracteristicas.findIndex((c) => c.nome === nomeCaracteristica);
      for (const c of caracteristicas.slice(indice + 1)) delete proxima[c.nome];
      return proxima;
    });
  };

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


        <div className="flex flex-col justify-center">
          <div className="flex items-start justify-between gap-4">
            <h1 className="text-2xl font-bold">{product.name}</h1>
            <FavouriteButton productName={product.name} liked={liked} onToggle={() => toggleFavourite(product.id)} className="size-10 [&_svg]:size-5!" />
          </div>
          <p className="mt-1 text-lg font-semibold">{formatPrice(price)}</p>

          {temVariantes && (
            <div className="mt-3 space-y-3">
              {caracteristicas.map((caracteristica) => {
                const valores = valoresParaCaracteristica(product, caracteristica.nome, selecao);
                const isCor = caracteristica.nome === "Cor";
                return (
                  <div key={caracteristica.nome} className="min-w-0">
                    <p className="text-xs font-semibold uppercase">
                      {caracteristica.nome}
                      {selecao[caracteristica.nome] && (
                        <span className="ml-1 font-normal normal-case text-muted-foreground">{selecao[caracteristica.nome]}</span>
                      )}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-2.5" role="group" aria-label={`Escolher ${caracteristica.nome}`}>
                      {valores.map((valor) => {
                        const ativo = selecao[caracteristica.nome] === valor;
                        const hex = caracteristica.cores?.[valor];
                        if (isCor) {
                          return (
                            <button
                              key={valor}
                              type="button"
                              onClick={() => escolher(caracteristica.nome, valor)}
                              aria-label={valor}
                              aria-pressed={ativo}
                              className={`grid size-8 place-items-center rounded-full transition-shadow ${ativo ? "ring-1 ring-foreground ring-offset-2 ring-offset-background" : "focus-visible:ring-1 focus-visible:ring-ring focus-visible:ring-offset-2"}`}
                            >
                              <span
                                className="size-full rounded-full border border-border"
                                style={hex ? { backgroundColor: hex } : undefined}
                                aria-hidden="true"
                              />
                            </button>
                          );
                        }
                        return (
                          <Button
                            key={valor}
                            variant={ativo ? "default" : "outline"}
                            onClick={() => escolher(caracteristica.nome, valor)}
                            aria-pressed={ativo}
                            className="min-h-10 min-w-10 rounded-2xl px-3.5 shadow-none"
                          >
                            {valor}
                          </Button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
              {!selecaoCompleta && (
                <p className="text-xs text-muted-foreground">Escolha as opções acima para continuar.</p>
              )}
            </div>
          )}

          <div className="mt-4 grid gap-2.5">
            {!selecaoCompleta ? (
              <Button size="lg" disabled className="h-12 w-full rounded-full text-sm font-semibold">
                Escolha as opções
              </Button>
            ) : available ? (
              <>
                <Button size="lg" className="h-12 w-full rounded-full text-sm font-semibold" onClick={buyNow}>{p?.ui.buyNow ?? "Comprar Agora"}</Button>
                <div className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-2.5">
                  <div className="flex h-12 items-center rounded-full border border-border bg-card">
                    <Button variant="ghost" size="icon" className="rounded-full" onClick={() => setQuantity(Math.max(1, quantity - 1))} aria-label="Diminuir quantidade" disabled={quantity === 1}><Minus /></Button>
                    <span className="min-w-6 text-center text-sm font-semibold" aria-live="polite">{quantity}</span>
                    <Button variant="ghost" size="icon" className="rounded-full" onClick={() => setQuantity(Math.min(limit, quantity + 1))} aria-label="Aumentar quantidade" disabled={quantity >= limit}><Plus /></Button>
                  </div>
                   <AddToCartButton product={product} quantity={quantity} flyFrom={galleryRef} selectedVariant={variantSelecionada} className="h-12 w-full rounded-full font-semibold" />
                </div>
              </>
            ) : (
              <>
                <p className="text-xs font-semibold uppercase text-muted-foreground">Esgotado de momento</p>
                <Button
                  size="lg"
                  onClick={notifyMe}
                  aria-pressed={alertActive}
                  className="add-to-cart-button h-12 w-full gap-2 rounded-full text-sm font-semibold"
                >
                  <BellRing aria-hidden="true" />
                  {alertActive ? "Já será avisado" : "Avisar-me quando chegar"}
                </Button>
              </>
            )}
          </div>

          <p className="mt-4 text-sm leading-6 text-muted-foreground">
            {product.description ??
              "Uma peça versátil, confortável e fácil de combinar. Apresentação demonstrativa pronta para receber os detalhes reais do seu produto."}
          </p>
        </div>
      </div>

      {(!p || p.showRecommendations) && <section className="mt-14 sm:mt-20" aria-labelledby="recommendations-title">
        <h2 id="recommendations-title" className="text-xl font-bold sm:text-2xl">{p?.ui.recommendations ?? "Você também pode gostar"}</h2>
        <div className="mt-6 grid grid-cols-2 gap-x-3 gap-y-7 sm:gap-x-5 sm:gap-y-9">
          {recommendations.map((item) => <ProductCard key={item.id} product={item} />)}
        </div>
      </section>}
    </div>
  );
}

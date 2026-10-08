'use client';

import type { MouseEvent, ReactNode } from "react";
import { BellRing, Minus, Plus, ShoppingCart } from "lucide-react";
import { Button } from "../ui/button";
import { FavouriteButton } from "./favourite-button";
import { valoresParaCaracteristica, type ProdutoComVariantes } from "../../lib/store-data";
import type { ProductSelection } from "../../lib/use-product-selection";

export const DEFAULT_PRODUCT_DESCRIPTION =
  "Uma peça versátil, confortável e fácil de combinar. Apresentação demonstrativa pronta para receber os detalhes reais do seu produto.";

export type PurchaseButtonId = "buyNow" | "addToCart";

export interface ProductPurchasePanelProps {
  name: string;
  /** Preço já formatado (ex: "1 999 MT"). */
  priceLabel: string;
  description?: string;
  product: ProdutoComVariantes;
  /** Estado de compra vindo de `useProductSelection` — o mesmo hook na loja e no editor. */
  selection: ProductSelection;
  labels: { buyNow: string; addToCart: string };

  showFavourite?: boolean;
  liked?: boolean;
  onToggleFavourite?: () => void;

  onBuyNow?: () => void;
  onNotify?: () => void;
  /** "Avisar-me quando chegar" já ativo para este produto. */
  alertActive?: boolean;

  /**
   * Botão "Adicionar ao Carrinho" com estado próprio da loja (animação para o
   * carrinho, "Adicionado!"). Sem isto desenha-se o botão estático — é o que
   * o editor usa, porque não tem carrinho.
   */
  addToCartSlot?: ReactNode;
  /** O editor envolve cada botão de compra para o poder selecionar/editar. */
  wrapButton?: (id: PurchaseButtonId, node: ReactNode) => ReactNode;
  /** Editor: clicar numa variante/quantidade muda o preview sem selecionar a secção. */
  stopClickPropagation?: boolean;
}

/**
 * Painel de compra da página de produto do tema Lume: título, preço, variantes,
 * botões de compra, contador de quantidade e descrição.
 *
 * Só apresentação: sem router, sem carrinho, sem sessão. A loja pública liga-o a
 * esses serviços (`routes/produto-detail.tsx`); o editor liga-o ao preview
 * (`theme-editor/themes/lume/Renderer.tsx`). O HTML e as classes são os mesmos
 * nos dois — por isso o editor deixa de poder divergir da loja.
 */
export function ProductPurchasePanel({
  name,
  priceLabel,
  description,
  product,
  selection,
  labels,
  showFavourite = true,
  liked = false,
  onToggleFavourite,
  onBuyNow,
  onNotify,
  alertActive = false,
  addToCartSlot,
  wrapButton,
  stopClickPropagation = false,
}: ProductPurchasePanelProps) {
  const { caracteristicas, temVariantes, selecao, selecaoCompleta, escolher, available, limit, quantity, setQuantity } = selection;
  const wrap = (id: PurchaseButtonId, node: ReactNode) => (wrapButton ? wrapButton(id, node) : node);
  const act = (fn: () => void) => (event: MouseEvent) => {
    if (stopClickPropagation) event.stopPropagation();
    fn();
  };

  return (
    <div className="flex flex-col justify-center">
      <div className="flex items-start justify-between gap-4">
        <h1 className="text-2xl font-bold">{name}</h1>
        {showFavourite && (
          <FavouriteButton productName={name} liked={liked} onToggle={onToggleFavourite ?? (() => {})} className="size-10 [&_svg]:size-5!" />
        )}
      </div>
      <p className="mt-1 text-lg font-semibold">{priceLabel}</p>

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
                          onClick={act(() => escolher(caracteristica.nome, valor))}
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
                        onClick={act(() => escolher(caracteristica.nome, valor))}
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
          {!selecaoCompleta && <p className="text-xs text-muted-foreground">Escolha as opções acima para continuar.</p>}
        </div>
      )}

      <div className="mt-4 grid gap-2.5">
        {!selecaoCompleta ? (
          <Button size="lg" disabled className="h-12 w-full rounded-full text-sm font-semibold">
            Escolha as opções
          </Button>
        ) : available ? (
          <>
            {wrap(
              "buyNow",
              <Button size="lg" className="h-12 w-full rounded-full text-sm font-semibold" onClick={onBuyNow}>
                {labels.buyNow}
              </Button>,
            )}
            <div className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-2.5">
              <div className="flex h-12 items-center rounded-full border border-border bg-card">
                <Button variant="ghost" size="icon" className="rounded-full" onClick={act(() => setQuantity(Math.max(1, quantity - 1)))} aria-label="Diminuir quantidade" disabled={quantity === 1}>
                  <Minus />
                </Button>
                <span className="min-w-6 text-center text-sm font-semibold" aria-live="polite">{quantity}</span>
                <Button variant="ghost" size="icon" className="rounded-full" onClick={act(() => setQuantity(Math.min(limit, quantity + 1)))} aria-label="Aumentar quantidade" disabled={quantity >= limit}>
                  <Plus />
                </Button>
              </div>
              {wrap(
                "addToCart",
                addToCartSlot ?? (
                  <Button variant="outline" size="lg" className="h-12 w-full min-w-0 gap-2 rounded-full font-semibold shadow-none max-sm:text-xs">
                    <ShoppingCart aria-hidden="true" />
                    <span>{labels.addToCart}</span>
                  </Button>
                ),
              )}
            </div>
          </>
        ) : (
          <>
            <p className="text-xs font-semibold uppercase text-muted-foreground">Esgotado de momento</p>
            <Button
              size="lg"
              onClick={onNotify}
              aria-pressed={alertActive}
              className="add-to-cart-button h-12 w-full gap-2 rounded-full text-sm font-semibold"
            >
              <BellRing aria-hidden="true" />
              {alertActive ? "Já será avisado" : "Avisar-me quando chegar"}
            </Button>
          </>
        )}
      </div>

      <p className="mt-4 text-sm leading-6 text-muted-foreground">{description ?? DEFAULT_PRODUCT_DESCRIPTION}</p>
    </div>
  );
}

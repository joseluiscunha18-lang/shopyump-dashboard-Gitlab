'use client';

import { createFileRoute, Link } from "../router";
import { Heart } from "lucide-react";
import { Button } from "../components/ui/button";
import { PageHeading } from "../components/store/page-heading";
import { ProductCard } from "../components/store/product-card";
import { useStore } from "../components/store/store-context";
import { useLumeLoja } from "../components/store/lume-loja-context";

export const Route = createFileRoute("/favoritos")({ head: () => ({ meta: [{ title: "Favoritos — LUME." }, { name: "description", content: "Consulte os produtos guardados na sua lista de desejos." }, { property: "og:title", content: "Favoritos — LUME." }, { property: "og:description", content: "Consulte os produtos guardados na sua lista de desejos." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" }] }), component: FavouritesPage });
function FavouritesPage() {
  const { favourites } = useStore();
  // Antes filtrava sempre contra os 6 produtos de demonstração — os
  // favoritos guardados de produtos reais nunca apareciam. Filtra agora
  // contra o catálogo em uso (real ou demo, conforme LumeLojaContext).
  const { produtos } = useLumeLoja();
  const saved = produtos.filter((product) => favourites.includes(product.id));
  return <><PageHeading pageKey="wishlist" eyebrow="A sua selecção" title="Favoritos" description="Guarde aqui os produtos que quer rever mais tarde."/><section className="mx-auto min-h-[360px] max-w-6xl px-4 py-9 sm:px-6">{saved.length ? <div data-sy="wishlist-grid" className="grid grid-cols-2 gap-x-3 gap-y-8 sm:grid-cols-3 lg:grid-cols-4">{saved.map((product) => <ProductCard key={product.id} product={product}/>)}</div> : <div className="flex min-h-72 flex-col items-center justify-center text-center"><span className="grid size-14 place-items-center rounded-full bg-muted"><Heart/></span><h2 className="mt-4 text-lg font-semibold">Sua lista de desejos está vazia</h2><p className="mt-2 max-w-sm text-sm text-muted-foreground">Toque no coração de um produto para guardá-lo aqui.</p><Button asChild className="mt-5"><Link to="/">Ver produtos</Link></Button></div>}</section></>;
}

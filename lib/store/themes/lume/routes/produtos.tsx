'use client';

import { createFileRoute, Link } from "../router";
import { useEffect, useMemo, useRef, useState } from "react";
import { z } from "zod";
import { Check, Settings2 } from "lucide-react";
import { Button } from "../components/ui/button";
import { Sheet, SheetClose, SheetContent, SheetTitle } from "../components/ui/sheet";
import { ProductCard } from "../components/store/product-card";
import { categoryFromSlug, categorySlug } from "../lib/store-data";
import { useLumeLoja } from "../components/store/lume-loja-context";
import { useLumePersonalizacao } from "../components/store/lume-personalizacao-context";

const sorts = { relevancia: "Relevância", "preco-asc": "Preço: menor", "preco-desc": "Preço: maior", nome: "Nome A–Z" } as const;
type Sort = keyof typeof sorts;

const searchSchema = z.object({
  categoria: z.string().optional().catch(undefined),
  ordenar: z.enum(["relevancia", "preco-asc", "preco-desc", "nome"]).optional().catch(undefined),
});

export const Route = createFileRoute("/produtos")({
  validateSearch: searchSchema,
  head: () => ({
    meta: [
      { title: "Catálogo — LUME." },
      { name: "description", content: "Explore todo o catálogo LUME: vestuário, acessórios e destaques." },
      { property: "og:title", content: "Catálogo — LUME." },
      { property: "og:description", content: "Explore todo o catálogo LUME: vestuário, acessórios e destaques." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: CatalogPage,
});

const PAGE = 8;

function CatalogPage() {
  const { categoria, ordenar } = Route.useSearch();
  const navigate = Route.useNavigate();
  const { produtos, categorias } = useLumeLoja();
  const p = useLumePersonalizacao();

  const active = categoryFromSlug(categoria);
  const sort: Sort = ordenar ?? "relevancia";
  const [filterOpen, setFilterOpen] = useState(false);
  const [visible, setVisible] = useState(PAGE);
  const sentinel = useRef<HTMLDivElement>(null);

  const list = useMemo(() => {
    const base = produtos.filter((p) => !active || p.category === active);
    const sorted = [...base];
    if (sort === "preco-asc") sorted.sort((a, b) => a.price - b.price);
    if (sort === "preco-desc") sorted.sort((a, b) => b.price - a.price);
    if (sort === "nome") sorted.sort((a, b) => a.name.localeCompare(b.name, "pt"));
    return sorted;
  }, [produtos, active, sort]);

  useEffect(() => setVisible(PAGE), [active, sort]);

  useEffect(() => {
    const el = sentinel.current;
    if (!el) return;
    const io = new IntersectionObserver((entries) => {
      if (entries[0]?.isIntersecting) setVisible((v) => Math.min(v + PAGE, list.length));
    }, { rootMargin: "300px" });
    io.observe(el);
    return () => io.disconnect();
  }, [list.length]);

  return (
    <div className="mx-auto max-w-6xl px-4 pt-7 sm:px-6 sm:pt-10">
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 sm:flex sm:justify-between">
        <h1 className="truncate text-2xl font-bold sm:text-3xl">{p?.pages.collection?.title ?? "Produtos"}</h1>
        <Button variant="outline" onClick={() => setFilterOpen(true)} aria-label="Abrir filtros" className="h-8 shrink-0 rounded-full bg-background px-3 text-xs font-semibold shadow-none">
          <Settings2 className="!size-3.5" /> Filtrar
        </Button>
      </div>

      {p?.pages.collection?.description && <p className="mt-2 text-sm text-muted-foreground">{p.pages.collection.description}</p>}
      <div data-sy="catalog-grid" className="mt-6 grid grid-cols-2 gap-x-3 gap-y-5 sm:grid-cols-3 sm:gap-x-5 sm:gap-y-7 lg:grid-cols-4">
        {list.slice(0, visible).map((p) => <div key={p.id} className="animate-in fade-in duration-500"><ProductCard product={p} /></div>)}
      </div>
      {visible < list.length && <div ref={sentinel} className="py-8 text-center text-xs text-muted-foreground">A carregar mais…</div>}
      {list.length === 0 && <p className="py-10 text-center text-sm text-muted-foreground">Sem produtos nesta categoria.</p>}
      <div className="h-8" />

      <Sheet open={filterOpen} onOpenChange={setFilterOpen}>
        <SheetContent side="bottom" className="rounded-t-2xl px-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] pt-4 sm:left-1/2 sm:max-w-xl sm:-translate-x-1/2">
          <SheetTitle className="text-base font-bold">Filtros</SheetTitle>
          <section className="mt-3">
            <h2 className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Categoria</h2>
            <div className="mt-1.5 grid gap-0.5">
              {[undefined, ...categorias].map((category) => {
                const selected = category === active;
                return (
                  <Link key={category ?? "todos"} to="/produtos" search={(search) => ({ ...search, categoria: category ? categorySlug(category) : undefined })} replace
                    className={`grid grid-cols-[minmax(0,1fr)_auto] items-center rounded-md px-3 py-2 text-sm ${selected ? "bg-secondary font-semibold text-foreground" : "text-muted-foreground hover:text-foreground"}`}>
                    <span>{category ?? "Todos"}</span>{selected && <Check className="size-4 shrink-0" aria-hidden="true" />}
                  </Link>
                );
              })}
            </div>
          </section>
          <section className="mt-3 border-t border-border pt-3">
            <h2 className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Ordenar por</h2>
            <div className="mt-1.5 grid gap-0.5">
              {(Object.keys(sorts) as Sort[]).map((option) => {
                const selected = option === sort;
                return (
                  <Button key={option} variant="ghost" onClick={() => navigate({ search: (search) => ({ ...search, ordenar: option === "relevancia" ? undefined : option }), replace: true })}
                    className={`grid h-auto grid-cols-[minmax(0,1fr)_auto] justify-stretch rounded-md px-3 py-2 text-left text-sm ${selected ? "bg-secondary font-semibold text-foreground" : "text-muted-foreground"}`}>
                    <span>{sorts[option]}</span>{selected && <Check className="size-4 shrink-0" aria-hidden="true" />}
                  </Button>
                );
              })}
            </div>
          </section>
          <SheetClose asChild>
            <Button className="mt-4 h-11 w-full rounded-full text-sm font-semibold">Aplicar filtros</Button>
          </SheetClose>
        </SheetContent>
      </Sheet>
    </div>
  );
}

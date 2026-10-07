'use client';

import { Fragment } from "react";
import { createFileRoute, Link } from "../router";
import { ArrowRight, MessageCircle } from "lucide-react";
import { Button } from "../components/ui/button";
import { ProductCard } from "../components/store/product-card";
import { useLumeLoja } from "../components/store/lume-loja-context";
import { useLumePersonalizacao } from "../components/store/lume-personalizacao-context";
import type { LumePersonalizacao } from "../lib/personalizacao";
import { categorySlug, type Product, type Category } from "../lib/store-data";

export const Route = createFileRoute("/")({
  head: () => ({ meta: [{ title: "LUME. — Moda essencial" }, { name: "description", content: "Descubra a nova colecção e os destaques da loja LUME." }, { property: "og:title", content: "LUME. — Moda essencial" }, { property: "og:description", content: "Descubra a nova colecção e os destaques da loja LUME." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" }] }),
  component: HomePage,
});

const BLOCK_LIMIT = 6;
const MIN_PRODUCTS_PER_BLOCK = 4;

const sectionTitles: Record<Category, string> = {
  Destaques: "Lançamentos",
  Vestuário: "Coleção de Vestuário",
  Acessórios: "Acessórios em Destaque",
};

type ProductSection = {
  title: string;
  products: Product[];
  category?: Product["category"];
};

function getHomeSections(products: Product[], categorias: Category[]): ProductSection[] {
  const newest = [...products].sort((a, b) => {
    const aTime = a.createdAt ? Date.parse(a.createdAt) : 0;
    const bTime = b.createdAt ? Date.parse(b.createdAt) : 0;
    return bTime - aTime;
  });

  const categorySections = categorias
    .map((category) => ({
      title: sectionTitles[category] ?? category,
      category,
      products: newest.filter((product) => product.category === category).slice(0, BLOCK_LIMIT),
    }))
    .filter((section) => section.products.length >= MIN_PRODUCTS_PER_BLOCK);

  if (products.length <= BLOCK_LIMIT || categorySections.length < 2) {
    return [{ title: "Produtos", products: newest.slice(0, BLOCK_LIMIT) }];
  }

  return categorySections;
}

/** Lista de produtos pedida pelo lojista no editor (origem / quantidade / ordem). */
function applyProductsQuery(produtos: Product[], q: NonNullable<LumePersonalizacao["productsQuery"]>): Product[] {
  let list = produtos;
  if (q.mode === "manual" && q.picked.length) {
    list = q.picked.map((id) => produtos.find((item) => item.id === id)).filter((item): item is Product => !!item);
  }
  if (q.sort === "priceAsc") list = [...list].sort((a, b) => a.price - b.price);
  else if (q.sort === "priceDesc") list = [...list].sort((a, b) => b.price - a.price);
  else list = [...list].sort((a, b) => (b.createdAt ? Date.parse(b.createdAt) : 0) - (a.createdAt ? Date.parse(a.createdAt) : 0));
  return list.slice(0, q.count);
}

function HomePage() {
  const { produtos, categorias, contactos } = useLumeLoja();
  const p = useLumePersonalizacao();
  const sections: ProductSection[] = p?.productsQuery
    ? [{ title: "Produtos", products: applyProductsQuery(produtos, p.productsQuery) }]
    : getHomeSections(produtos, categorias);
  const order = p?.homeOrder ?? (["hero", "products", "whatsappCta"] as const);

  const whatsappUrl = contactos.whatsapp
    ? `https://wa.me/${contactos.whatsapp.replace(/\D/g, "")}`
    : null;

  const blocks = {
    hero: <>
    <section data-sy="hero" className="bg-hero">
      <div className="relative mx-auto flex min-h-[263px] max-w-6xl items-center overflow-hidden px-5 py-14 text-left sm:min-h-[403px] sm:grid sm:grid-cols-[minmax(0,1.05fr)_minmax(300px,0.95fr)] sm:gap-10 sm:px-12 sm:py-16">
        <div className="relative z-10 max-w-[80%] self-center sm:max-w-xl">
          <h1 data-sy="hero-title" className="whitespace-nowrap text-[22px] font-extrabold leading-tight tracking-tight text-foreground sm:whitespace-normal sm:text-5xl">{p?.text.heroTitle ?? "BEM-VINDO À LOJA"}</h1>
          {p?.showHeroSubtitle && <p data-sy="hero-subtitle" className="mt-2 text-sm text-muted-foreground sm:text-lg">{p.text.heroSubtitle ?? "Descubra a nova colecção."}</p>}
          <Button asChild variant="hero" size="lg" className="mt-6 rounded-full px-6 sm:mt-8"><a href="#produtos">{p?.text.heroButton ?? "Ver Produtos"} <ArrowRight /></a></Button>
        </div>
        <div data-sy="hero-illustration" className="pointer-events-none absolute inset-y-0 right-0 flex w-[44%] items-center justify-end sm:static sm:h-full sm:w-auto" aria-hidden="true">
          <svg viewBox="0 0 480 360" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="h-auto w-[190px] max-w-full text-muted-foreground opacity-30 sm:w-full sm:max-w-[440px] sm:opacity-55">
            <circle cx="330" cy="180" r="150" strokeWidth="1.5" />
            <circle cx="86" cy="52" r="30" strokeWidth="1.5" />
            <path d="M293 88c0-11 16-11 16 0 0 7-8 7-8 14v9" />
            <path d="M301 111 226 162h150z" />
            <rect x="238" y="208" width="130" height="112" rx="18" />
            <path d="M270 208v-22a33 33 0 0 1 66 0v22" />
          </svg>
        </div>
      </div>
    </section>
    </>,
    products: <>
    <div id="produtos" className="mx-auto max-w-6xl px-4 pb-6 pt-8 sm:px-6 sm:pb-8 sm:pt-11">
      {sections.map((section, index) => {
        const search = section.category ? { categoria: categorySlug(section.category) } : {};
        return (
          <section key={section.title} className={index > 0 ? "mt-10 border-t border-border pt-8 sm:mt-14 sm:pt-10" : undefined}>
            <h2 data-sy="products-title" className="text-xl font-bold sm:text-2xl">{index === 0 && p?.text.productsTitle ? p.text.productsTitle : section.title}</h2>
            <div data-sy="product-grid" className="mt-5 grid grid-cols-2 gap-x-3 gap-y-6 sm:grid-cols-3 sm:gap-x-5 sm:gap-y-8">
              {section.products.map((product) => <ProductCard key={product.id} product={product} />)}
            </div>
            <Link to="/produtos" search={search} className="mx-auto mt-6 flex w-fit items-center gap-1.5 rounded-full border border-border bg-transparent px-5 py-2.5 text-sm font-semibold text-muted-foreground transition-colors hover:border-foreground/30 hover:text-foreground sm:mt-7">
              {p?.text.viewAll ?? "Explorar mais"} <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
          </section>
        );
      })}
    </div>
    </>,
    whatsappCta: <PreFooter whatsappUrl={whatsappUrl} />,
  };

  return <>{order.map((id) => <Fragment key={id}>{blocks[id]}</Fragment>)}</>;
}

function PreFooter({ whatsappUrl }: { whatsappUrl: string | null }) {
  const p = useLumePersonalizacao();
  if (!whatsappUrl) return null;
  return (
    <section className="bg-background">
      <div className="mx-auto max-w-3xl px-5 pb-6 pt-6 sm:px-6 sm:pb-9 sm:pt-8">
        <div data-sy="whats-card" className="flex flex-col items-center gap-3 rounded-2xl border border-border/60 bg-muted/40 px-5 py-5 text-center sm:flex-row sm:justify-between sm:gap-6 sm:px-8 sm:py-6 sm:text-left">
          <div>
            <h2 data-sy="whats-title" className="text-base font-semibold sm:text-lg">{p?.text.whatsTitle ?? "Ficou com alguma dúvida sobre os produtos?"}</h2>
            <p data-sy="whats-text" className="mt-1 text-sm text-muted-foreground">{p?.text.whatsText ?? "Fale diretamente connosco."}</p>
          </div>
          <Button asChild variant="whatsapp" size="lg" className="shrink-0 rounded-full px-5">
            <a href={whatsappUrl} target="_blank" rel="noreferrer">
              <MessageCircle className="size-4" aria-hidden="true" />
              {p?.text.whatsButton ?? "Falar no WhatsApp"}
            </a>
          </Button>
        </div>
      </div>
    </section>
  );
}

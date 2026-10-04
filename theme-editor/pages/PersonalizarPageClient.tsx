"use client";

import { useRouter } from "next/navigation";
import { Component, useCallback, useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { ArrowRight, Copy, ExternalLink, MoreHorizontal, Pencil, Eye, Palette } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/theme-editor/ui/dropdown-menu";
import { toast } from "sonner";
import { EditorRoot } from "@/theme-editor/ui/editor-root";
import { Toaster } from "@/theme-editor/ui/sonner";
import { Button } from "@/theme-editor/ui/button";
import { Skeleton } from "@/theme-editor/ui/skeleton";
import { ThemeProvider } from "@/theme-editor/editor/sdk";
import { mockAdapter, setAdapterExternalHandler } from "@/theme-editor/mocks/adapter";
import { DemoCommerceRenderer } from "@/theme-editor/themes/demo-commerce/Renderer";
import type { Customization, MediaAsset, ProductLite, CategoryLite, Store, ThemeManifest } from "@/theme-editor/editor/contracts/types";

type Data = {
  manifest: ThemeManifest | null;
  store: Store;
  custom: Customization;
  media: MediaAsset[];
  products: ProductLite[];
  categories: CategoryLite[];
};

const PREVIEW_W = 390;
const PREVIEW_H = 560;

function relativeTime(iso?: string): string {
  if (!iso) return "Ainda não personalizada";
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return "Ainda não personalizada";
  const s = Math.max(0, Math.round((Date.now() - t) / 1000));
  const rtf = new Intl.RelativeTimeFormat("pt", { numeric: "auto" });
  let txt: string;
  if (s < 45) txt = "agora mesmo";
  else if (s < 3600) txt = rtf.format(-Math.round(s / 60), "minute");
  else if (s < 86400) txt = rtf.format(-Math.round(s / 3600), "hour");
  else if (s < 2592000) txt = rtf.format(-Math.round(s / 86400), "day");
  else if (s < 31536000) txt = rtf.format(-Math.round(s / 2592000), "month");
  else txt = rtf.format(-Math.round(s / 31536000), "year");
  return `Última edição: ${txt}`;
}

class PreviewBoundary extends Component<{ fallback: ReactNode; children: ReactNode }, { failed: boolean }> {
  override state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  override render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}

function PreviewUnavailable() {
  return (
    <div className="grid h-full place-items-center bg-muted px-6 text-center text-sm text-muted-foreground">
      Não foi possível mostrar a pré-visualização
    </div>
  );
}

function MiniPreview({
  data,
  url,
  onOpen,
  onCopy,
  onView,
}: {
  data: Data;
  url: string;
  onOpen: () => void;
  onCopy: () => void;
  onView: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setWidth(el.clientWidth));
    ro.observe(el);
    setWidth(el.clientWidth);
    return () => ro.disconnect();
  }, []);
  const scale = width ? width / PREVIEW_W : 0;
  const pageId = data.manifest?.pages.find((p) => p.supported)?.id ?? "home";

  return (
    <div
      ref={ref}
      className="relative -mx-4 overflow-hidden bg-muted sm:-mx-6 md:mx-0 md:rounded-3xl"
      style={{ height: PREVIEW_H }}
    >
      {!data.manifest ? (
        <PreviewUnavailable />
      ) : (
        <PreviewBoundary fallback={<PreviewUnavailable />}>
          {scale > 0 ? (
            <div
              aria-hidden
              // @ts-expect-error inert é atributo HTML válido
              inert=""
              className="pointer-events-none select-none bg-background"
              style={{ width: PREVIEW_W, transform: `scale(${scale})`, transformOrigin: "top left" }}
            >
              <ThemeProvider
                value={{
                  manifest: data.manifest,
                  customization: data.custom,
                  store: data.store,
                  media: data.media,
                  products: data.products,
                  categories: data.categories,
                  device: "mobile",
                  mode: "live",
                  showOverlays: false,
                  selectedPath: undefined,
                  onSelect: undefined,
                }}
              >
                <DemoCommerceRenderer pageId={pageId} />
              </ThemeProvider>
            </div>
          ) : null}
        </PreviewBoundary>
      )}

      {/* Toda a área do preview abre o editor */}
      <button
        type="button"
        onClick={onOpen}
        aria-label="Abrir o editor da loja"
        className="absolute inset-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
      />

      {/* Camada inferior de vidro escuro */}
      <div className="absolute inset-x-0 bottom-0 bg-glass-dark px-5 pb-5 pt-4 text-glass-dark-foreground backdrop-blur-2xl backdrop-saturate-150">
        {/* Transição suave entre a loja e a camada escura */}
        <div aria-hidden className="pointer-events-none absolute inset-x-0 -top-40 h-40 bg-[linear-gradient(to_bottom,transparent_0%,oklch(0.18_0_0/0.15)_40%,oklch(0.18_0_0/0.4)_75%,var(--glass-dark)_100%)] backdrop-blur-lg [mask-image:linear-gradient(to_bottom,transparent,black_45%)]" />
        <h2 className="truncate text-xl font-semibold tracking-tight">{data.store.name}</h2>
        <p className="mt-0.5 truncate text-sm text-glass-dark-muted">{url.replace(/^https?:\/\//, "")}</p>
        <p className="mt-0.5 text-xs text-glass-dark-muted">{relativeTime(data.custom.updatedAt)}</p>
        <div className="mt-4 flex items-center gap-2">
          <Button variant="glass" className="h-10 flex-1 px-5" onClick={onOpen}>
            <Pencil className="h-4 w-4" /> Editar loja
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="glassGhost" size="icon" className="h-10 w-12 bg-glass-dark-line" aria-label="Mais ações">
                <MoreHorizontal className="h-6 w-6" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onSelect={onView}>
                <ExternalLink className="h-4 w-4" /> Ver loja
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={onCopy}>
                <Copy className="h-4 w-4" /> Copiar endereço
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
}

function PersonalizarPageInner() {
  const router = useRouter();
  useEffect(() => {
    setAdapterExternalHandler((target) => {
      if (target !== "themes") return false;
      router.push("/loja/temas");
      return true;
    });
    return () => setAdapterExternalHandler(null);
  }, [router]);
  const [data, setData] = useState<Data | null>(null);

  const load = useCallback(() => {
    Promise.all([
      mockAdapter.getThemeManifest().catch(() => null),
      mockAdapter.getStore(),
      mockAdapter.getCustomization(),
      mockAdapter.listMedia(),
      mockAdapter.listProducts(),
      mockAdapter.listCategories(),
    ]).then(([manifest, store, custom, media, products, categories]) =>
      setData({ manifest, store, custom, media, products, categories }),
    );
  }, []);

  // Reler ao montar (incl. ao voltar do editor) e quando a aba volta a ficar visível.
  useEffect(() => {
    load();
    const onVis = () => document.visibilityState === "visible" && load();
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, [load]);

  const url = mockAdapter.getStoreUrl();
  const openEditor = () => router.push("/personalizar/editor");
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      /* ignora — mostra confirmação mesmo assim */
    }
    toast("Endereço copiado");
  };

  return (
    <div>
      <header className="pb-3">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3">
          <h1 className="text-lg font-semibold tracking-tight">Personalizar loja</h1>
          <Button variant="ghost" size="sm" onClick={() => toast(`Abriria ${url}`)}>
            <Eye className="h-4 w-4" /> Ver loja
          </Button>
        </div>
      </header>

      <main className="mx-auto grid max-w-5xl grid-cols-1 gap-2 py-4 md:grid-cols-[minmax(0,440px)_1fr] md:gap-10 md:py-10">
        <section className="min-w-0">
          {data ? (
            <MiniPreview data={data} url={url} onOpen={openEditor} onCopy={copy} onView={() => toast(`Abriria ${url}`)} />
          ) : (
            <Skeleton className="-mx-4 rounded-none sm:-mx-6 md:mx-0 md:rounded-3xl" style={{ height: PREVIEW_H }} />
          )}
        </section>

        <section className="flex min-w-0 flex-col md:justify-end">
          <div className="flex flex-col items-start gap-3 border-b py-4">
            <div className="min-w-0">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Tema atual</p>
              {data ? (
                <p className="mt-1 truncate font-medium">{data.manifest?.name ?? "Tema indisponível"}</p>
              ) : (
                <Skeleton className="mt-1 h-5 w-32" />
              )}
            </div>
            <Button variant="secondary" className="h-11 w-full justify-center md:w-auto rounded-full border px-4 font-semibold shadow-pill hover:bg-accent" onClick={() => mockAdapter.openExternal("themes")}>
              <Palette className="h-4 w-4" /> Explorar temas
            </Button>
          </div>
        </section>
      </main>
      <Toaster position="top-center" />
    </div>
  );
}

export default function PersonalizarPageClient() {
  return (
    <EditorRoot>
      <PersonalizarPageInner />
    </EditorRoot>
  );
}

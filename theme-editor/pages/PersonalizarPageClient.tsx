"use client";

import { useRouter } from "next/navigation";
import { Component, useCallback, useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { Copy, Pencil, Palette, Store as StoreIcon } from "lucide-react";
import { toast } from "sonner";
import { EditorRoot } from "@/theme-editor/ui/editor-root";
import { Toaster } from "@/theme-editor/ui/sonner";
import { Button } from "@/theme-editor/ui/button";
import { Skeleton } from "@/theme-editor/ui/skeleton";
import { ThemeProvider } from "@/theme-editor/editor/sdk";
import { configureAdapter, mockAdapter, setAdapterExternalHandler } from "@/theme-editor/mocks/adapter";
import { createLojaAdapter, type LojaEditorInit } from "@/theme-editor/adapters/loja";
import { saveTemaPersonalizacao } from "@/lib/mutations/personalizacao";
import { ThemeRenderer } from "@/theme-editor/themes/registry";
import { visibleSectionIds } from "@/theme-editor/editor/core/resolve";
import type { Customization, MediaAsset, ProductLite, CategoryLite, Store, ThemeManifest } from "@/theme-editor/editor/contracts/types";

type Data = {
  manifest: ThemeManifest | null;
  store: Store;
  custom: Customization;
  media: MediaAsset[];
  products: ProductLite[];
  categories: CategoryLite[];
};

const PREVIEW_W = 390; // largura lógica (telemóvel) com que o tema é desenhado
const CAPTION_H = 112; // altura da faixa de vidro com o nome da loja
const EMPTY_H = 220; // altura mínima quando não há nenhuma seção para mostrar

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

/** O tema desenhado em pequeno, sem interação. `only` limita a uma seção. */
function ThemeMini({ data, pageId, only, scale }: { data: Data; pageId: string; only: string[]; scale: number }) {
  return (
    <ThemeProvider
      value={{
        manifest: data.manifest!,
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
      <div style={{ width: PREVIEW_W, transform: `scale(${scale})`, transformOrigin: "top left" }}>
        <ThemeRenderer themeId={data.manifest!.id} pageId={pageId} only={only} />
      </div>
    </ThemeProvider>
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
  const boxRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  const [naturalH, setNaturalH] = useState(0);

  useLayoutEffect(() => {
    const box = boxRef.current;
    if (!box) return;
    const ro = new ResizeObserver(() => setWidth(box.clientWidth));
    ro.observe(box);
    setWidth(box.clientWidth);
    return () => ro.disconnect();
  }, []);

  const manifest = data.manifest;
  const pageId = manifest?.pages.find((p) => p.supported)?.id ?? "home";
  // Só a primeira seção visível da página (no tema de demonstração, o banner principal);
  // a barra de anúncio e o cabeçalho da loja não entram na miniatura.
  const first = manifest
    ? visibleSectionIds(manifest, data.custom, pageId).page.find((id) => !data.custom.sections[id]?.hidden)
    : undefined;
  const only = first ? [first] : [];
  const scale = width ? width / PREVIEW_W : 0;

  useLayoutEffect(() => {
    const el = innerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setNaturalH(el.offsetHeight));
    ro.observe(el);
    setNaturalH(el.offsetHeight);
    return () => ro.disconnect();
  }, [scale, first, manifest]);

  const heroH = first ? Math.round(naturalH * scale) : 0;
  const bodyH = Math.max(heroH, first ? 0 : EMPTY_H - CAPTION_H) + CAPTION_H;
  const ready = !!manifest && scale > 0 && (!first || naturalH > 0);

  return (
    <div className="overflow-hidden rounded-2xl border bg-card shadow-pill">
      {/* Barra contextual: delimita a miniatura (sem o cabeçalho da loja) */}
      <div className="flex h-14 items-center justify-between gap-3 border-b bg-card px-4">
        <span className="flex min-w-0 items-center gap-2 text-sm font-semibold leading-none tracking-tight text-foreground">
          <StoreIcon className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
          <span className="truncate">Minha loja</span>
        </span>
        <button
          type="button"
          onClick={onView}
          className="inline-flex h-8 shrink-0 items-center justify-center rounded-full bg-secondary px-3.5 text-xs font-semibold leading-none text-secondary-foreground transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          Ver loja online
        </button>
      </div>

      <div ref={boxRef} className="relative overflow-hidden bg-muted" style={{ height: ready ? bodyH : 360 }}>
        {!manifest ? (
          <PreviewUnavailable />
        ) : (
          <PreviewBoundary fallback={<PreviewUnavailable />}>
            {scale > 0 && first ? (
              <>
                {/* Camada de fundo: a mesma seção, ampliada e desfocada, que continua por baixo da faixa de vidro */}
                <div
                  aria-hidden
                  // @ts-expect-error inert é atributo HTML válido
                  inert=""
                  className="pointer-events-none absolute inset-0 select-none overflow-hidden"
                >
                  <div style={{ transform: "scale(1.4)", transformOrigin: "50% 80%", filter: "blur(22px) saturate(1.15) brightness(0.8)", width: "100%", height: "100%" }}>
                    <ThemeMini data={data} pageId={pageId} only={only} scale={scale} />
                  </div>
                </div>
                {/* Camada nítida: a seção na altura real */}
                <div
                  ref={innerRef}
                  aria-hidden
                  // @ts-expect-error inert é atributo HTML válido
                  inert=""
                  className="pointer-events-none absolute left-0 top-0 select-none"
                  style={{ width: PREVIEW_W, transform: `scale(${scale})`, transformOrigin: "top left" }}
                >
                  <ThemeProvider
                    value={{
                      manifest,
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
                    <ThemeRenderer themeId={manifest.id} pageId={pageId} only={only} />
                  </ThemeProvider>
                </div>
              </>
            ) : null}
          </PreviewBoundary>
        )}

        {/* Toda a área abre o editor */}
        <button
          type="button"
          onClick={onOpen}
          aria-label="Abrir o editor da loja"
          className="absolute inset-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
        />

        {/* Faixa de vidro com o nome da loja */}
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 flex items-center gap-3 bg-glass-dark px-5 text-glass-dark-foreground backdrop-blur-2xl backdrop-saturate-150"
          style={{ height: CAPTION_H }}
        >
          {/* Transição suave entre a seção e a faixa */}
          <div aria-hidden className="pointer-events-none absolute inset-x-0 -top-10 h-10 bg-gradient-to-b from-transparent to-glass-dark" />
          <div className="min-w-0 flex-1">
            <h2 className="truncate text-lg font-semibold tracking-tight">{data.store.name}</h2>
            <div className="mt-0.5 flex items-center gap-1">
              <span className="truncate text-xs text-glass-dark-muted">{url.replace(/^https?:\/\//, "")}</span>
              <button
                type="button"
                onClick={onCopy}
                aria-label="Copiar endereço da loja"
                className="pointer-events-auto grid h-7 w-7 shrink-0 place-items-center rounded-full text-glass-dark-muted hover:bg-glass-dark-line"
              >
                <Copy className="h-3.5 w-3.5" />
              </button>
            </div>
            <p className="text-xs text-glass-dark-muted">{relativeTime(data.custom.updatedAt)}</p>
          </div>
          <Button variant="glass" className="pointer-events-auto h-10 shrink-0 px-4" onClick={onOpen}>
            <Pencil className="h-4 w-4" /> Editar loja
          </Button>
        </div>
      </div>
    </div>
  );
}

function PersonalizarPageInner({ initial }: { initial?: LojaEditorInit }) {
  const router = useRouter();
  // Liga o editor à loja real ANTES do primeiro carregamento (idempotente; sem cleanup — ver EditorPageClient).
  useState(() => {
    configureAdapter(initial ? createLojaAdapter(initial, saveTemaPersonalizacao) : null);
    return null;
  });
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
      <main className="mx-auto grid max-w-5xl grid-cols-1 gap-4 py-2 md:grid-cols-[minmax(0,440px)_1fr] md:gap-10 md:py-6">
        <section className="min-w-0">
          {data ? (
            <MiniPreview data={data} url={url} onOpen={openEditor} onCopy={copy} onView={() => window.open(url, "_blank", "noopener,noreferrer")} />
          ) : (
            <Skeleton className="rounded-2xl" style={{ height: 48 + 360 }} />
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

export default function PersonalizarPageClient({ initial }: { initial?: LojaEditorInit }) {
  return (
    <EditorRoot>
      <PersonalizarPageInner initial={initial} />
    </EditorRoot>
  );
}

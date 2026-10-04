"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { EditorRoot } from "@/theme-editor/ui/editor-root";
import { Toaster } from "@/theme-editor/ui/sonner";
import { EditorProvider, type EditorData } from "@/theme-editor/editor/core/store";
import { EditorShell } from "@/theme-editor/editor/ui/shell/EditorShell";
import { mockAdapter, setAdapterNavigator } from "@/theme-editor/mocks/adapter";
import type { Customization } from "@/theme-editor/editor/contracts/types";

function EditorPageInner() {
  const [loaded, setLoaded] = useState<{ data: EditorData; custom: Customization } | null>(null);
  const [error, setError] = useState(false);

  const load = () => {
    setError(false);
    Promise.all([
      mockAdapter.getThemeManifest(),
      mockAdapter.getStore(),
      mockAdapter.listMedia(),
      mockAdapter.listProducts(),
      mockAdapter.listCategories(),
      mockAdapter.listPages(),
      mockAdapter.getCustomization(),
    ])
      .then(([manifest, store, media, products, categories, pages, custom]) =>
        setLoaded({ data: { manifest, store, media, products, categories, pages }, custom }),
      )
      .catch(() => setError(true));
  };
  useEffect(load, []);
  const router = useRouter();
  useEffect(() => {
    setAdapterNavigator((to) => router.push(to === "editor" ? "/personalizar/editor" : "/personalizar"));
    return () => setAdapterNavigator(null);
  }, [router]);

  if (error)
    return (
      <div className="grid h-dvh place-items-center text-center">
        <div>
          <p className="mb-3">Não foi possível carregar o tema.</p>
          <button className="underline" onClick={load}>Tentar de novo</button>
        </div>
      </div>
    );
  if (!loaded) return <div className="grid h-dvh place-items-center text-sm text-muted-foreground">A carregar o editor…</div>;

  return (
    <EditorProvider data={loaded.data} customization={loaded.custom}>
      <EditorShell />
      <Toaster position="top-center" />
    </EditorProvider>
  );
}

export default function EditorPageClient() {
  return (
    <EditorRoot page>
      <EditorPageInner />
    </EditorRoot>
  );
}

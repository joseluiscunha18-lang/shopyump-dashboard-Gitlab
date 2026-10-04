import type { ThemeManifest } from "@/theme-editor/editor/contracts/types";
import { lumeManifest } from "./lume/manifest";
import { LumeRenderer } from "./lume/Renderer";
import { demoCommerceManifest } from "./demo-commerce/manifest";
import { DemoCommerceRenderer } from "./demo-commerce/Renderer";

/**
 * Registo de temas do editor — o único sítio que liga "id do tema" a
 * "manifesto + renderer". O editor (EditorShell, Personalizar loja, adaptador)
 * nunca importa um tema diretamente: pede ao registo.
 *
 * Adicionar um tema novo (Minimal, Boutique…) é:
 *   1. criar theme-editor/themes/<id>/{manifest.ts,Renderer.tsx};
 *   2. acrescentar UMA linha em THEMES abaixo.
 */

export interface EditorThemeDefinition {
  manifest: ThemeManifest;
  Renderer: (props: { pageId: string; only?: string[] }) => React.ReactElement | null;
}

const THEMES: Record<string, EditorThemeDefinition> = {
  lume: { manifest: lumeManifest, Renderer: LumeRenderer },
  // Tema de demonstração original — mantido só como referência de desenvolvimento.
  "demo-commerce": { manifest: demoCommerceManifest, Renderer: DemoCommerceRenderer },
};

/** O tema padrão da plataforma. Lojas sem tema (ou com um id desconhecido) usam este. */
export const DEFAULT_THEME_ID = "lume";

export function resolveEditorTheme(themeId: string | null | undefined): EditorThemeDefinition {
  return (themeId && THEMES[themeId]) || THEMES[DEFAULT_THEME_ID];
}

/**
 * Desenha a página `pageId` com o renderer do tema da customização atual.
 * Tem de estar dentro de um <ThemeProvider> (usa o manifesto do contexto).
 */
export function ThemeRenderer({ themeId, pageId, only }: { themeId: string; pageId: string; only?: string[] }) {
  const { Renderer } = resolveEditorTheme(themeId);
  return <Renderer pageId={pageId} only={only} />;
}

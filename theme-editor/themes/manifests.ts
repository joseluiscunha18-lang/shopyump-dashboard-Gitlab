import type { Customization, ThemeManifest } from "@/theme-editor/editor/contracts/types";
import { lumeManifest } from "./lume/manifest";
import { demoCommerceManifest } from "./demo-commerce/manifest";

/**
 * Parte do registo de temas que é só DADOS (manifestos) — sem React.
 * Fica separada de registry.tsx (que importa os renderers, código de cliente)
 * para que páginas e queries de SERVIDOR possam usá-la sem arrastar o editor
 * inteiro para o servidor.
 */

const MANIFESTS: Record<string, ThemeManifest> = {
  lume: lumeManifest,
  "demo-commerce": demoCommerceManifest,
};

/** O tema padrão da plataforma. Lojas sem tema (ou com um id desconhecido) usam este. */
export const DEFAULT_THEME_ID = "lume";

export function resolveThemeManifest(themeId: string | null | undefined): ThemeManifest {
  return (themeId && MANIFESTS[themeId]) || MANIFESTS[DEFAULT_THEME_ID];
}

/**
 * Customização inicial de um tema: vazia de propósito. Sem alterações do
 * lojista, editor e loja pública mostram os valores por omissão do manifesto.
 */
export function createEmptyCustomization(themeId: string = DEFAULT_THEME_ID): Customization {
  const manifest = resolveThemeManifest(themeId);
  return { schemaVersion: 1, themeId: manifest.id, themeVersion: manifest.version, global: {}, structure: { pages: {} }, sections: {} };
}

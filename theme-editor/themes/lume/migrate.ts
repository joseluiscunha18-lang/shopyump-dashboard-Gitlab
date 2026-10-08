import type { Customization } from "@/theme-editor/editor/contracts/types";
import { BOTTOM_NAV_DEFAULTS, resolveBottomNavItems } from "@/lib/store/shared/storefront-logic";

const LEGACY_NAV_KEYS = ["showSearch", "showWishlist", "showCart"] as const;

/**
 * Lojas guardadas antes de a barra inferior ter lista de botões trazem 3
 * interruptores (`showSearch/showWishlist/showCart`) que o painel já não mostra.
 * Converte-os em `items` (com os mesmos botões ocultos, na mesma ordem) para o
 * painel e a loja continuarem de acordo. Idempotente; não mexe no original.
 * A loja pública também lê o formato antigo (ver `resolveBottomNavItems`), por
 * isso as lojas que ainda não foram guardadas continuam iguais.
 */
export function migrateLumeCustomization(c: Customization): Customization {
  const settings = c.sections?.bottomNav?.settings;
  if (!settings || !LEGACY_NAV_KEYS.some((k) => k in settings)) return c;
  const next = JSON.parse(JSON.stringify(c)) as Customization;
  const nav = next.sections.bottomNav!.settings!;
  if (!Array.isArray(nav.items)) {
    const visible = new Set(resolveBottomNavItems(undefined, nav).map((i) => i.key));
    nav.items = BOTTOM_NAV_DEFAULTS.map((d) => ({ id: d.key, label: d.label, locked: true, ...(visible.has(d.key) ? {} : { hidden: true }) }));
  }
  for (const k of LEGACY_NAV_KEYS) delete nav[k];
  return next;
}

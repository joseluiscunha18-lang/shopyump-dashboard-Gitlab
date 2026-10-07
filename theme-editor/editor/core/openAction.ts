// Ação de "abrir" (segundo toque). O editor só lê o que o tema declara em `openAction`.
import type { Customization, Device, ElementDef, LinkRef, OpenAction, PageId, ThemeManifest } from "../contracts/types";
import { parsePath, type NodePath } from "./paths";
import { blockTypeOf, resolveValue, sectionTypeOf, settingsForPath } from "./resolve";

/** Tipos de elemento em que o toque serve para escrever: nunca usam o segundo toque. */
const TEXT_KINDS = new Set(["text", "heading"]);

export function elementDefOf(manifest: ThemeManifest, custom: Customization, path: NodePath): ElementDef | undefined {
  const p = parsePath(path);
  if (!p || !p.sectionId) return undefined;
  if (p.kind === "element") return sectionTypeOf(manifest, custom, p.sectionId)?.elements.find((e) => e.id === p.elementId);
  if (p.kind === "blockElement") return blockTypeOf(manifest, custom, p.sectionId, p.blockId!)?.elements.find((e) => e.id === p.elementId);
  return undefined;
}

export function openActionOf(manifest: ThemeManifest, custom: Customization, path: NodePath | undefined): OpenAction | undefined {
  if (!path) return undefined;
  const el = elementDefOf(manifest, custom, path);
  if (!el || TEXT_KINDS.has(el.kind)) return undefined;
  return el.openAction;
}

export type OpenTarget =
  | { kind: "overlay"; id: string }
  | { kind: "page"; page: PageId; productId?: string }
  | { kind: "unavailable"; reason: string };

export function pageAvailable(manifest: ThemeManifest, id: PageId) {
  const pg = manifest.pages.find((p) => p.id === id);
  if (!pg) return false;
  return pg.supported && pg.sections.length > 0 && (!pg.requires || !!manifest.capabilities[pg.requires]);
}

/** Link de navegação (menu, barra inferior) tocado no preview. */
export function linkToPage(link: LinkRef): { page: PageId; productId?: string } | undefined {
  if (!link) return undefined;
  switch (link.type) {
    case "themePage": return link.value ? { page: link.value } : undefined;
    case "home": return { page: "home" };
    case "products":
    case "category": return { page: "collection" };
    case "product": return { page: "product", productId: link.value };
    default: return undefined;
  }
}

/** Resolve o destino de uma ação declarada. Nunca altera o rascunho. */
export function resolveOpenTarget(
  manifest: ThemeManifest,
  custom: Customization,
  path: NodePath,
  device: Device,
  ctx?: Record<string, string>,
): OpenTarget | undefined {
  const action = openActionOf(manifest, custom, path);
  if (!action) return undefined;
  if (action.type === "overlay") {
    const ov = manifest.overlays?.find((o) => o.id === action.id);
    if (!ov || (ov.requires && !manifest.capabilities[ov.requires])) return { kind: "unavailable", reason: "Painel indisponível" };
    return { kind: "overlay", id: ov.id };
  }
  let dest: { page: PageId; productId?: string } | undefined;
  if (action.type === "themePage") dest = { page: action.page, productId: ctx?.productId ?? action.productId };
  else {
    let ref = action.ref ?? null;
    if (action.setting) {
      const def = settingsForPath(manifest, custom, path).find((d) => d.key === action.setting);
      if (def) ref = resolveValue(manifest, custom, path, def, device) as LinkRef;
    }
    dest = linkToPage(ref);
    if (!dest) return { kind: "unavailable", reason: "Este destino não abre no preview" };
  }
  if (!pageAvailable(manifest, dest.page)) {
    return { kind: "unavailable", reason: dest.page === "product" ? "Página do produto em construção" : "Página em construção" };
  }
  return { kind: "page", ...dest };
}

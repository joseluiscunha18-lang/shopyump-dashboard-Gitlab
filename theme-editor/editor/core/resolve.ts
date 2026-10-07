import type { Customization, Device, SettingDef, ThemeManifest } from "../contracts/types";
import { expandSettings, isResponsiveValue, parsePath, pickResponsive, readBag, type NodePath } from "./paths";

/** Valor cru (pode ser ResponsiveValue) depois de defaults + presets + override. */
export function rawValue(
  manifest: ThemeManifest,
  custom: Customization,
  path: NodePath,
  def: SettingDef,
): unknown {
  let v: unknown = def.default;

  const p = parsePath(path);
  if (p?.kind === "global" && p.groupId === "style") {
    const presetId =
      (custom.global["style"]?.["preset"] as string | undefined) ??
      (manifest.global
        .find((g) => g.id === "style")
        ?.settings.find((s) => s.key === "preset")?.default as string | undefined);
    const preset = manifest.stylePresets.find((sp) => sp.id === presetId);
    if (preset && def.key in preset.values) v = preset.values[def.key];
  }

  const bag = readBag(custom, path);
  if (bag && def.key in bag) v = bag[def.key];
  return v;
}

/** Valor final para o dispositivo atual. Fonte única de verdade. */
export function resolveValue<T = unknown>(
  manifest: ThemeManifest,
  custom: Customization,
  path: NodePath,
  def: SettingDef,
  device: Device,
): T {
  return pickResponsive<T>(rawValue(manifest, custom, path, def), device);
}

function valuesEqual(a: unknown, b: unknown): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

export function defaultValue(manifest: ThemeManifest, custom: Customization, path: NodePath, def: SettingDef): unknown {
  let value = def.default;
  const p = parsePath(path);
  if (p?.kind === "global" && p.groupId === "style") {
    const presetId =
      (custom.global["style"]?.["preset"] as string | undefined) ??
      (manifest.global.find((group) => group.id === "style")?.settings.find((setting) => setting.key === "preset")?.default as string | undefined);
    const preset = manifest.stylePresets.find((item) => item.id === presetId);
    if (preset && def.key in preset.values) value = preset.values[def.key];
  }
  return value;
}

export function isDefaultValue(value: unknown, def: SettingDef, baseline: unknown = def.default): boolean {
  if (isResponsiveValue(value) || isResponsiveValue(baseline)) {
    return (["desktop", "tablet", "mobile"] as Device[]).every((device) =>
      valuesEqual(pickResponsive(value, device), pickResponsive(baseline, device)),
    );
  }
  return valuesEqual(value, baseline);
}

export function hasOverride(manifest: ThemeManifest, custom: Customization, path: NodePath, def: SettingDef): boolean {
  const bag = readBag(custom, path);
  return !!bag && def.key in bag && !isDefaultValue(bag[def.key], def, defaultValue(manifest, custom, path, def));
}

export function nodeHasOverrides(custom: Customization, path: NodePath): boolean {
  const bag = readBag(custom, path);
  return !!bag && Object.keys(bag).length > 0;
}

/** Lista de SettingDef de um nó, já expandida a partir do manifesto. */
export function settingsForPath(
  manifest: ThemeManifest,
  custom: Customization,
  path: NodePath,
): SettingDef[] {
  const p = parsePath(path);
  if (!p) return [];
  if (p.kind === "global") {
    return manifest.global.find((g) => g.id === p.groupId)?.settings ?? [];
  }
  const type = sectionTypeOf(manifest, custom, p.sectionId!);
  if (!type) return [];
  if (p.kind === "section") return expandSettings(manifest, type.settings);
  if (p.kind === "element") {
    const el = type.elements.find((e) => e.id === p.elementId);
    return el ? expandSettings(manifest, el.settings) : [];
  }
  const blockType = blockTypeOf(manifest, custom, p.sectionId!, p.blockId!);
  if (!blockType) return [];
  if (p.kind === "block") return blockType.settings ?? [];
  const el = blockType.elements.find((e) => e.id === p.elementId);
  return el ? expandSettings(manifest, el.settings) : [];
}

export function sectionTypeOf(manifest: ThemeManifest, custom: Customization, sectionId: string) {
  const added = Object.values(custom.structure.pages)
    .flatMap((p) => p.added ?? [])
    .find((s) => s.id === sectionId);
  const declared =
    manifest.pages
      .flatMap((p) => [
        ...p.topSections.map((id) => ({ id, type: id })),
        ...p.sections,
        ...p.bottomSections.map((id) => ({ id, type: id })),
        ...(p.fixedSections ?? []).map((id) => ({ id, type: id })),
      ])
      .find((s) => s.id === sectionId) ??
    added ??
    (manifest.overlays?.some((o) => o.sectionIds.includes(sectionId)) ? { id: sectionId, type: sectionId } : undefined);
  const typeName = custom.sections[sectionId]?.type ?? added?.type ?? declared?.type;
  return manifest.sectionTypes.find((t) => t.type === typeName);
}

/**
 * Ids das seções de uma página, já na ordem final e sem as removidas.
 * Genérico: serve a qualquer tema (só lê manifesto + customização).
 * `fixed` = seções coladas ao ecrã (barra inferior…); respeita `requires`.
 */
export function visibleSectionIds(
  manifest: ThemeManifest,
  custom: Customization,
  pageId: string,
): { top: string[]; page: string[]; bottom: string[]; fixed: string[] } {
  const page = manifest.pages.find((p) => p.id === pageId);
  if (!page) return { top: [], page: [], bottom: [], fixed: [] };
  const ok = (id: string) => {
    const t = sectionTypeOf(manifest, custom, id);
    return !t?.requires || !!manifest.capabilities[t.requires];
  };
  const override = custom.structure.pages[pageId];
  const order = override?.order ?? page.sections.map((s) => s.id);
  const removed = new Set(override?.removed ?? []);
  return {
    top: page.topSections.filter((id) => !removed.has(id) && ok(id)),
    page: order.filter((id) => !removed.has(id) && ok(id)),
    bottom: page.bottomSections.filter((id) => !removed.has(id) && ok(id)),
    fixed: (page.fixedSections ?? []).filter((id) => !removed.has(id) && ok(id)),
  };
}

export function blockTypeOf(
  manifest: ThemeManifest,
  custom: Customization,
  sectionId: string,
  blockId: string,
) {
  const explicit = custom.sections[sectionId]?.blocks?.items?.[blockId]?.type;
  if (explicit) return manifest.blockTypes.find((b) => b.type === explicit);
  const sectionType = sectionTypeOf(manifest, custom, sectionId);
  const allowed = sectionType?.blocks?.allowed ?? [];
  return manifest.blockTypes.find((b) => b.type === allowed[0]);
}

/** Lista final de ids de blocos de uma seção (manifesto + overrides de ordem). */
export function blockIdsOf(
  manifest: ThemeManifest,
  custom: Customization,
  sectionId: string,
): string[] {
  const type = sectionTypeOf(manifest, custom, sectionId);
  if (!type?.blocks) return [];
  const order = custom.sections[sectionId]?.blocks?.order;
  if (order) return order;
  return Array.from({ length: type.blocks.defaultCount }, (_, i) => `${sectionId}-b${i + 1}`);
}

/** Valores globais resolvidos de um grupo (ex.: cores) para o dispositivo. */
export function globalValues(
  manifest: ThemeManifest,
  custom: Customization,
  groupId: string,
  device: Device,
): Record<string, unknown> {
  const group = manifest.global.find((g) => g.id === groupId);
  const out: Record<string, unknown> = {};
  for (const def of group?.settings ?? []) {
    out[def.key] = resolveValue(manifest, custom, `global.${groupId}`, def, device);
  }
  return out;
}

/** "token:primary" → valor da cor global. */
export function resolveColor(value: unknown, colors: Record<string, unknown>): string {
  if (typeof value !== "string") return "transparent";
  if (value.startsWith("token:")) {
    const key = value.slice(6);
    const v = colors[key];
    return typeof v === "string" && !v.startsWith("token:") ? v : "#111111";
  }
  return value;
}

/* ---------- Contraste (assistência de design) ---------- */

function srgb(c: number) {
  const s = c / 255;
  return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
}

export function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  const full = h.length === 3 ? h.split("").map((c) => c + c).join("") : h.slice(0, 6);
  const n = parseInt(full || "000000", 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

export function contrastRatio(a: string, b: string): number {
  if (!a.startsWith("#") || !b.startsWith("#")) return 21;
  const lum = (hex: string) => {
    const [r, g, bl] = hexToRgb(hex);
    return 0.2126 * srgb(r) + 0.7152 * srgb(g) + 0.0722 * srgb(bl);
  };
  const l1 = lum(a);
  const l2 = lum(b);
  const [hi, lo] = l1 > l2 ? [l1, l2] : [l2, l1];
  return (hi + 0.05) / (lo + 0.05);
}

/** Visibilidade condicional de uma opção. */
export function isSettingVisible(
  def: SettingDef,
  manifest: ThemeManifest,
  values: Record<string, unknown>,
  blockCount: number,
): boolean {
  if (def.requires && !manifest.capabilities[def.requires]) return false;
  const w = def.visibleWhen;
  if (!w) return true;
  const v = w.key === "$blockCount" ? blockCount : values[w.key];
  if (w.equals !== undefined) return v === w.equals;
  if (w.in) return w.in.includes(v);
  if (w.truthy !== undefined) return w.truthy ? !!v : !v;
  if (w.gt !== undefined) return typeof v === "number" && v > w.gt;
  if (w.lt !== undefined) return typeof v === "number" && v < w.lt;
  return true;
}

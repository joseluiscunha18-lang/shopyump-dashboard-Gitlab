import type {
  Customization,
  Device,
  SectionCustomization,
  SettingDef,
  SettingsSpec,
  ThemeManifest,
} from "../contracts/types";

/**
 * Caminho canónico de um nó editável:
 *   global.<grupo>
 *   sections.<sectionId>.settings
 *   sections.<sectionId>.elements.<elementId>
 *   sections.<sectionId>.blocks.<blockId>
 *   sections.<sectionId>.blocks.<blockId>.elements.<elementId>
 */
export type NodePath = string;

export interface ParsedPath {
  kind: "global" | "section" | "element" | "block" | "blockElement";
  groupId?: string;
  sectionId?: string;
  blockId?: string;
  elementId?: string;
}

export function parsePath(path: NodePath): ParsedPath | null {
  const p = path.split(".");
  if (p[0] === "global" && p[1]) return { kind: "global", groupId: p[1] };
  if (p[0] !== "sections" || !p[1]) return null;
  const sectionId = p[1];
  if (p[2] === "settings" || p.length === 2) return { kind: "section", sectionId };
  if (p[2] === "elements" && p[3]) return { kind: "element", sectionId, elementId: p[3] };
  if (p[2] === "blocks" && p[3]) {
    if (p[4] === "elements" && p[5])
      return { kind: "blockElement", sectionId, blockId: p[3], elementId: p[5] };
    return { kind: "block", sectionId, blockId: p[3] };
  }
  return null;
}

export function sectionPath(id: string) {
  return `sections.${id}.settings`;
}
export function elementPath(sectionId: string, elementId: string) {
  return `sections.${sectionId}.elements.${elementId}`;
}
export function blockPath(sectionId: string, blockId: string) {
  return `sections.${sectionId}.blocks.${blockId}`;
}
export function blockElementPath(sectionId: string, blockId: string, elementId: string) {
  return `sections.${sectionId}.blocks.${blockId}.elements.${elementId}`;
}

/** Devolve o bag de overrides de um nó (ou undefined). */
export function readBag(
  custom: Customization,
  path: NodePath,
): Record<string, unknown> | undefined {
  const p = parsePath(path);
  if (!p) return undefined;
  if (p.kind === "global") return custom.global[p.groupId!];
  const sec = custom.sections[p.sectionId!];
  if (!sec) return undefined;
  if (p.kind === "section") return sec.settings;
  if (p.kind === "element") return sec.elements?.[p.elementId!];
  const item = sec.blocks?.items?.[p.blockId!];
  if (!item) return undefined;
  if (p.kind === "block") return item.settings;
  return item.elements?.[p.elementId!];
}

function ensureSection(custom: Customization, id: string): SectionCustomization {
  if (!custom.sections[id]) custom.sections[id] = {};
  return custom.sections[id];
}

/** Escreve (ou remove, com value === undefined) uma chave num nó. Muta uma cópia profunda feita antes. */
export function writeBagKey(
  custom: Customization,
  path: NodePath,
  key: string,
  value: unknown,
): void {
  const p = parsePath(path);
  if (!p) return;
  let bag: Record<string, unknown>;
  if (p.kind === "global") {
    custom.global[p.groupId!] = custom.global[p.groupId!] ?? {};
    bag = custom.global[p.groupId!]!;
  } else {
    const sec = ensureSection(custom, p.sectionId!);
    if (p.kind === "section") {
      sec.settings = sec.settings ?? {};
      bag = sec.settings;
    } else if (p.kind === "element") {
      sec.elements = sec.elements ?? {};
      sec.elements[p.elementId!] = sec.elements[p.elementId!] ?? {};
      bag = sec.elements[p.elementId!]!;
    } else {
      sec.blocks = sec.blocks ?? {};
      sec.blocks.items = sec.blocks.items ?? {};
      sec.blocks.items[p.blockId!] = sec.blocks.items[p.blockId!] ?? {};
      const item = sec.blocks.items[p.blockId!]!;
      if (p.kind === "block") {
        item.settings = item.settings ?? {};
        bag = item.settings;
      } else {
        item.elements = item.elements ?? {};
        item.elements[p.elementId!] = item.elements[p.elementId!] ?? {};
        bag = item.elements[p.elementId!]!;
      }
    }
  }
  if (value === undefined) delete bag[key];
  else bag[key] = value;
}

/** Expande um SettingsSpec (preset + omit/override/add) numa lista concreta. */
export function expandSettings(manifest: ThemeManifest, spec: SettingsSpec): SettingDef[] {
  if (Array.isArray(spec)) return spec;
  const base = manifest.presets[spec.preset] ?? [];
  const omit = new Set(spec.omit ?? []);
  const out = base
    .filter((s) => !omit.has(s.key))
    .map((s) => ({ ...s, ...(spec.override?.[s.key] ?? {}) }));
  return [...out, ...(spec.add ?? [])];
}

/** Herança responsiva: desktop → tablet → mobile. */
export function pickResponsive<T>(value: unknown, device: Device): T {
  if (value && typeof value === "object" && "$r" in (value as object)) {
    const r = (value as { $r: Partial<Record<Device, T>> }).$r;
    if (device === "mobile") return (r.mobile ?? r.tablet ?? r.desktop) as T;
    if (device === "tablet") return (r.tablet ?? r.desktop) as T;
    return r.desktop as T;
  }
  return value as T;
}

export function isResponsiveValue(value: unknown): boolean {
  return !!value && typeof value === "object" && "$r" in (value as object);
}

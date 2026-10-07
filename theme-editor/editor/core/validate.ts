import type { SettingDef, SettingsSpec, ThemeManifest } from "../contracts/types";

/** Chaves comerciais que nenhum manifesto pode expor como opção editável. */
export const FORBIDDEN_SETTING_KEYS = ["price", "stock", "taxRate", "discountValue", "shippingCost", "paymentStatus"];

function keysOf(spec: SettingsSpec): string[] {
  if (Array.isArray(spec)) return spec.map((d: SettingDef) => d.key);
  return [...(spec.add ?? []).map((d) => d.key), ...Object.keys(spec.override ?? {})];
}

/** Devolve erros em linguagem clara; lista vazia = manifesto válido. */
export function validateManifest(m: ThemeManifest): string[] {
  const errors: string[] = [];
  for (const t of m.sectionTypes) {
    const all = [...keysOf(t.settings), ...t.elements.flatMap((e) => keysOf(e.settings))];
    for (const k of all)
      if (FORBIDDEN_SETTING_KEYS.includes(k))
        errors.push(`A seção "${t.label}" tenta permitir editar "${k}". Valores comerciais não se editam no editor.`);
  }
  return errors;
}

/** Confirma que a customização não guarda ids de dados de demonstração. */
export function findDemoIds(customization: unknown, demoIds: string[]): string[] {
  const json = JSON.stringify(customization);
  return demoIds.filter((id) => json.includes(`"${id}"`));
}

'use client';

import { DEFAULT_CUSTOMIZATION, type LojaCustomization } from './types';

/**
 * Persistência "de mentira" para a personalização de aparência.
 *
 * Os temas desta primeira versão são simulados (§16 da spec) — ainda
 * não existe coluna/tabela no Supabase para "tema aplicado", "cor
 * principal", etc. Em vez de inventar uma tabela que vai ser descartada
 * assim que os temas oficiais chegarem, guardamos por agora em
 * localStorage, isolado por loja.
 *
 * Quando o schema real existir, só este ficheiro muda: as duas funções
 * abaixo passam a chamar `updateLoja` / uma query nova, e todo o resto
 * do editor (que só conhece `LojaCustomization`) continua igual.
 */

function storageKey(lojaId: string): string {
  return `shopyump:personalizar-loja:${lojaId}`;
}

export function loadCustomization(lojaId: string): LojaCustomization {
  if (typeof window === 'undefined') return DEFAULT_CUSTOMIZATION;
  try {
    const raw = window.localStorage.getItem(storageKey(lojaId));
    if (!raw) return DEFAULT_CUSTOMIZATION;
    const parsed = JSON.parse(raw);
    return { ...DEFAULT_CUSTOMIZATION, ...parsed };
  } catch {
    return DEFAULT_CUSTOMIZATION;
  }
}

export function saveCustomization(lojaId: string, data: LojaCustomization): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(storageKey(lojaId), JSON.stringify(data));
  } catch {
    // Armazenamento indisponível (modo privado, quota) — falha em
    // silêncio, o editor continua a funcionar só que sem persistir.
  }
}

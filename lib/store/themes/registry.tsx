import type { StoreThemeDefinition } from './types';
import { LumeTheme } from './lume/LumeTheme';

/**
 * Registo central de temas. Adicionar um tema novo no futuro (Minimal,
 * Boutique, Fashion...) é SÓ:
 *
 *   1. Criar a pasta lib/store/themes/<novo-tema>/ com o componente.
 *   2. Acrescentar uma linha aqui: `<id>: { id: '<id>', Component: <NovoTema> }`.
 *
 * Nunca é preciso tocar em app/loja/[slug]/page.tsx, nas queries, ou no
 * StoreRenderer — todos eles só conhecem `resolveStoreTheme`.
 *
 * O tema 'default' foi descontinuado e removido (ver git history). Lojas
 * antigas com theme_id = 'default' (ou qualquer id desconhecido) caem
 * automaticamente no FALLBACK_THEME_ID abaixo — nunca ficam com ecrã em
 * branco.
 */
const STORE_THEMES: Record<string, StoreThemeDefinition> = {
  lume: { id: 'lume', Component: LumeTheme },
};

const FALLBACK_THEME_ID = 'lume';

/**
 * Resolve um `theme_id` (vindo de `lojas.theme_id`) para a sua definição.
 * Nunca lança nem devolve `undefined`: um id nulo, vazio ou desconhecido
 * (tema descontinuado, dado corrompido, loja criada antes de um tema
 * existir) cai sempre no tema por omissão — a loja pública nunca fica
 * com um ecrã em branco por causa de um `theme_id` inválido.
 */
export function resolveStoreTheme(themeId: string | null | undefined): StoreThemeDefinition {
  if (themeId && STORE_THEMES[themeId]) return STORE_THEMES[themeId];
  return STORE_THEMES[FALLBACK_THEME_ID];
}

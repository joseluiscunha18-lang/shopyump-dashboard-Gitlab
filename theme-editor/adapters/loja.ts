import type {
  CategoryLite,
  Customization,
  EditorAdapter,
  ProductLite,
  Store,
} from "@/theme-editor/editor/contracts/types";
import { resolveEditorTheme } from "@/theme-editor/themes/registry";
import { mockPages } from "@/theme-editor/mocks/data";

/**
 * Dados da loja REAL com que o editor arranca. Montados no servidor
 * (lib/queries/personalizacaoEditor.ts) e passados à página cliente.
 */
export interface LojaEditorInit {
  store: Store;
  products: ProductLite[];
  categories: CategoryLite[];
  customization: Customization;
  /** URL pública da loja (o botão "Ver loja"). */
  storeUrl: string;
}

/**
 * Última customização guardada nesta sessão do navegador, por loja. O editor e
 * "Personalizar loja" são duas páginas; se o Next servir a segunda a partir da
 * cache de navegação, `init.customization` pode estar desatualizada — esta
 * memória garante que o preview mostra sempre o que acabou de ser guardado.
 */
const lastSaved = new Map<string, Customization>();

function pickNewest(a: Customization, b?: Customization): Customization {
  if (!b) return a;
  return (b.updatedAt ?? "") > (a.updatedAt ?? "") ? b : a;
}

/**
 * Adaptador do editor para a loja real: lê o que veio do servidor e guarda a
 * customização através de `save` (server action). O que ainda não tem
 * equivalente real (biblioteca de imagens, páginas) continua a vir do
 * adaptador de demonstração — por isso devolve só os métodos que substitui.
 */
export function createLojaAdapter(
  init: LojaEditorInit,
  save: (c: Customization) => Promise<{ ok: boolean; error?: string }>,
): Partial<EditorAdapter> {
  let current: Customization = pickNewest(init.customization, lastSaved.get(init.storeUrl));
  return {
    async getStore() {
      return init.store;
    },
    async getThemeManifest() {
      return resolveEditorTheme(current.themeId).manifest;
    },
    async getCustomization() {
      return current;
    },
    async listMedia() {
      return [];
    },
    async listProducts(q) {
      let list = init.products;
      if (q?.categoryId) list = list.filter((p) => p.categoryId === q.categoryId);
      if (q?.search) list = list.filter((p) => p.name.toLowerCase().includes(q.search!.toLowerCase()));
      return list;
    },
    async listCategories() {
      return init.categories;
    },
    async listPages() {
      return mockPages;
    },
    async saveCustomization(c) {
      const next = { ...c, updatedAt: new Date().toISOString() };
      const res = await save(next);
      if (!res.ok) throw new Error(res.error ?? "Não foi possível guardar. Verifique a ligação.");
      current = next;
      lastSaved.set(init.storeUrl, next);
    },
    getStoreUrl() {
      return init.storeUrl;
    },
  };
}

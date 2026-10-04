import { toast } from "sonner";
import type {
  Customization,
  EditorAdapter,
  ExternalTarget,
  MediaAsset,
} from "@/theme-editor/editor/contracts/types";
import { DEFAULT_THEME_ID, resolveEditorTheme } from "@/theme-editor/themes/registry";
import {
  mockCategories,
  mockCustomization,
  mockMedia,
  mockPages,
  mockProducts,
  mockStore,
} from "./data";

const externalLabels: Record<ExternalTarget, string> = {
  themes: "Temas",
  "store-info": "Informações da loja",
  "social-links": "Redes sociais",
  policies: "Páginas e políticas",
  "navigation-menus": "Menus",
  products: "Produtos",
  categories: "Categorias",
  pages: "Páginas",
  shipping: "Entrega",
  payments: "Pagamentos",
  "media-library": "Biblioteca de imagens",
};

export const externalTargetLabel = (t: ExternalTarget) => externalLabels[t];

type Nav = (to: "back" | "personalizar" | "editor") => void;
let navigator: Nav | null = null;
/** O host (rotas) regista aqui a navegação real; o editor só chama adapter.navigate. */
export function setAdapterNavigator(fn: Nav | null) {
  navigator = fn;
}

// Só para a fase de demonstração: guarda a customização no navegador para
// sobreviver a recarregar a página. O adaptador real (Supabase) substitui isto.
const STORAGE_KEY = "shopyump:theme-editor:mock-customization";
function initialCustomization(): Customization {
  if (typeof window !== "undefined") {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const saved = JSON.parse(raw) as Customization;
        // Customizações guardadas por outro tema (ex.: o antigo "demo-commerce")
        // não servem ao tema padrão: descarta-as e recomeça do padrão do Lume.
        if (saved.themeId === DEFAULT_THEME_ID) return saved;
      }
    } catch {
      /* ignora e usa o padrão */
    }
  }
  return JSON.parse(JSON.stringify(mockCustomization));
}
type ExternalHandler = (target: ExternalTarget) => boolean;
let externalHandler: ExternalHandler | null = null;
/** O host regista aqui os destinos que já existem no painel (ex.: temas). Devolve true se tratou o pedido. */
export function setAdapterExternalHandler(fn: ExternalHandler | null) {
  externalHandler = fn;
}

let memoryCustomization: Customization = initialCustomization();
let failNextSave = false;

export function setFailNextSave(v: boolean) {
  failNextSave = v;
}

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

export const mockAdapter: EditorAdapter = {
  async getStore() {
    await delay(60);
    return mockStore;
  },
  async getThemeManifest() {
    await delay(60);
    return resolveEditorTheme(memoryCustomization.themeId).manifest;
  },
  async getCustomization() {
    await delay(60);
    return memoryCustomization;
  },
  async listMedia() {
    return mockMedia;
  },
  async listProducts(q) {
    let list = mockProducts;
    if (q?.categoryId) list = list.filter((p) => p.categoryId === q.categoryId);
    if (q?.search) list = list.filter((p) => p.name.toLowerCase().includes(q.search!.toLowerCase()));
    return list;
  },
  async listCategories() {
    return mockCategories;
  },
  async listPages() {
    return mockPages;
  },
  async saveCustomization(c) {
    await delay(700);
    if (failNextSave) {
      failNextSave = false;
      throw new Error("Não foi possível guardar. Verifique a ligação.");
    }
    memoryCustomization = JSON.parse(JSON.stringify({ ...c, updatedAt: new Date().toISOString() }));
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(memoryCustomization));
    } catch {
      /* sem espaço/privado: continua só em memória */
    }
  },
  async uploadMedia(file: File): Promise<MediaAsset> {
    await delay(500);
    const url = URL.createObjectURL(file);
    const dims = await new Promise<{ w: number; h: number }>((resolve) => {
      const i = new Image();
      i.onload = () => resolve({ w: i.naturalWidth, h: i.naturalHeight });
      i.onerror = () => resolve({ w: 0, h: 0 });
      i.src = url;
    });
    return {
      id: `up-${Math.random().toString(36).slice(2, 8)}`,
      url,
      name: file.name,
      width: dims.w,
      height: dims.h,
      tags: ["recent"],
    };
  },
  navigate(to) {
    if (navigator) return navigator(to);
    toast("Navegação", { description: `Em breve — ir para "${to}".` });
  },
  openExternal(target, ctx) {
    if (externalHandler?.(target)) return;
    if (target === "themes") {
      toast("Em breve — mais temas");
      return;
    }
    toast(`Em breve — gerido em ${externalLabels[target]}`, {
      description: ctx?.label ? `Contexto: ${ctx.label}` : undefined,
    });
  },
  getStoreUrl() {
    return "https://casa-aurora.exemplo";
  },
};

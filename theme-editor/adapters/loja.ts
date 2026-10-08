import type {
  CategoryLite,
  MediaAsset,
  Customization,
  EditorAdapter,
  ProductLite,
  Store,
} from "@/theme-editor/editor/contracts/types";
import { resolveEditorTheme } from "@/theme-editor/themes/registry";
import { createClient } from "@/lib/supabase/client";
import { BUCKETS } from "@/lib/storageBuckets";
import { mockPages } from "@/theme-editor/mocks/data";

/**
 * Dados da loja REAL com que o editor arranca. Montados no servidor
 * (lib/queries/personalizacaoEditor.ts) e passados à página cliente.
 */
export interface LojaEditorInit {
  /** Id da loja: as imagens vão para a pasta `<lojaId>/` do bucket (a RLS só deixa o dono escrever lá). */
  lojaId: string;
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

const MEDIA_EXT: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };
const MEDIA_FILE = /^(logo|banner|image)-[0-9a-f-]{36}\.(jpg|png|webp)$/i;

function mediaAsset(lojaId: string, name: string, width = 0, height = 0): MediaAsset {
  const path = `${lojaId}/${name}`;
  const { data } = createClient().storage.from(BUCKETS.lojas).getPublicUrl(path);
  const kind = name.split("-")[0];
  // `id` = caminho no bucket: é o que fica guardado na personalização e o que o
  // servidor transforma outra vez em URL público (ver lib/store/themes/lume/lib/personalizacao.ts).
  return { id: path, url: data.publicUrl, name, width, height, tags: [kind] };
}

function measure(file: File): Promise<{ w: number; h: number }> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      resolve({ w: img.naturalWidth, h: img.naturalHeight });
      URL.revokeObjectURL(url);
    };
    img.onerror = () => {
      resolve({ w: 0, h: 0 });
      URL.revokeObjectURL(url);
    };
    img.src = url;
  });
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
      const { data, error } = await createClient()
        .storage.from(BUCKETS.lojas)
        .list(init.lojaId, { limit: 200, sortBy: { column: "created_at", order: "desc" } });
      if (error || !data) return [];
      return data.filter((f) => MEDIA_FILE.test(f.name)).map((f) => mediaAsset(init.lojaId, f.name));
    },
    async uploadMedia(file, kind = "image") {
      const ext = MEDIA_EXT[file.type];
      if (!ext) throw new Error("Formato não suportado. Use JPG, PNG ou WebP.");
      const name = `${kind}-${crypto.randomUUID()}.${ext}`;
      const { error } = await createClient()
        .storage.from(BUCKETS.lojas)
        .upload(`${init.lojaId}/${name}`, file, { cacheControl: "31536000", contentType: file.type, upsert: false });
      if (error) throw new Error(error.message);
      const dims = await measure(file);
      return mediaAsset(init.lojaId, name, dims.w, dims.h);
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

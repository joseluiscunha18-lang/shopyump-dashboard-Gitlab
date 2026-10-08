import type {
  CategoryLite,
  Customization,
  MediaAsset,
  ProductLite,
  Store,
  StorePageLite,
} from "@/theme-editor/editor/contracts/types";

const img = (seed: string, w: number, h: number) => `https://picsum.photos/seed/${seed}/${w}/${h}`;
/** Imagens de demonstração do tema Lume (public/tema-lume/products). */
const lumeImg = (name: string) => `/tema-lume/products/${name}.png`;

export const mockStore: Store = {
  name: "Casa Aurora",
  description: "Peças simples e bem feitas para o dia a dia.",
  logoUrl:
    "data:image/svg+xml;utf8," +
    encodeURIComponent(
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 220 48"><text x="0" y="34" font-family="Georgia,serif" font-size="30" letter-spacing="1">Casa Aurora</text></svg>`,
    ),
  email: "ola@casaaurora.example",
  phone: "+258 84 000 0000",
  whatsapp: "+258 84 000 0000",
  address: "Av. 25 de Setembro, Maputo",
  hours: "Seg a Sex, 9h–18h",
  currency: "MT",
  social: {
    instagram: "https://instagram.com/casaaurora",
    facebook: "https://facebook.com/casaaurora",
    tiktok: "https://tiktok.com/@casaaurora",
    whatsapp: "https://wa.me/258840000000",
    youtube: "https://youtube.com/@casaaurora",
  },
  menus: [
    {
      id: "main",
      label: "Menu principal",
      items: [
        { label: "Novidades", href: "#" },
        { label: "Vestidos", href: "#" },
        { label: "Acessórios", href: "#" },
        { label: "Promoções", href: "#" },
      ],
    },
    {
      id: "help",
      label: "Ajuda",
      items: [
        { label: "Contactos", href: "#" },
        { label: "Envios", href: "#" },
        { label: "Devoluções", href: "#" },
      ],
    },
  ],
  // Demo: as duas páginas opcionais ligadas, para o preview de demonstração
  // mostrar o mesmo conjunto de links que a loja real mostraria por omissão.
  paginas: {
    entrega: { mostrar: true },
    termos: { mostrar: true },
  },
};

export const mockCategories: CategoryLite[] = [
  { id: "c1", name: "Destaques", image: lumeImg("coat"), productCount: 2 },
  { id: "c2", name: "Vestuário", image: lumeImg("shirt"), productCount: 4 },
  { id: "c3", name: "Acessórios", image: lumeImg("bag"), productCount: 4 },
];

export const mockProducts: ProductLite[] = [
  { id: "p1", name: "Casaco essencial", price: 1999, images: [lumeImg("coat")], categoryId: "c1", inStock: true },
  { id: "p2", name: "Camisa leve", price: 1999, images: [lumeImg("shirt")], categoryId: "c2", inStock: true },
  { id: "p3", name: "Bolsa mini", price: 1999, images: [lumeImg("bag")], categoryId: "c3", inStock: false },
  { id: "p4", name: "Vestido solto", price: 1999, images: [lumeImg("dress")], categoryId: "c2", inStock: true },
  { id: "p5", name: "T-shirt studio", price: 1999, images: [lumeImg("tee")], categoryId: "c1", inStock: true },
  { id: "p6", name: "Carteira compacta", price: 1999, images: [lumeImg("wallet")], categoryId: "c3", inStock: true },
  { id: "p7", name: "Hoodie conforto", price: 2499, images: [lumeImg("hoodie")], categoryId: "c2", inStock: true },
  { id: "p8", name: "Boné clássico", price: 899, images: [lumeImg("cap")], categoryId: "c3", inStock: true },
];

export const mockPages: StorePageLite[] = [
  { id: "pg1", title: "Sobre nós", kind: "page" },
  { id: "pol1", title: "Política de devolução", kind: "policy" },
  { id: "pol2", title: "Política de privacidade", kind: "policy" },
  { id: "pol3", title: "Termos e condições", kind: "policy" },
  { id: "pol4", title: "Política de envio", kind: "policy" },
];

export const mockMedia: MediaAsset[] = [
  { id: "m1", url: img("hero1", 1920, 900), name: "banner-principal.jpg", width: 1920, height: 900, tags: ["banner"] },
  { id: "m2", url: img("hero2", 1920, 900), name: "banner-verao.jpg", width: 1920, height: 900, tags: ["banner"] },
  { id: "m3", url: img("hero3", 800, 1000), name: "banner-mobile.jpg", width: 800, height: 1000, tags: ["banner"] },
  { id: "m4", url: img("studio", 1200, 1200), name: "atelier.jpg", width: 1200, height: 1200, tags: ["banner"] },
  { id: "m5", url: lumeImg("dress"), name: "vestido.png", width: 800, height: 800, tags: ["product"] },
  { id: "m6", url: lumeImg("coat"), name: "casaco.png", width: 800, height: 800, tags: ["product"] },
  { id: "m7", url: img("small", 320, 200), name: "foto-pequena.jpg", width: 320, height: 200, tags: ["product"] },
  { id: "m8", url: mockStore.logoUrl, name: "logo.svg", width: 220, height: 48, tags: ["logo"] },
];

/**
 * Customização inicial do Lume: vazia de propósito. Sem nenhuma alteração do
 * lojista, o editor mostra exatamente os valores por omissão do manifesto
 * (themes/lume/manifest.ts), que reproduzem a loja pública.
 */
export const mockCustomization: Customization = {
  schemaVersion: 1,
  themeId: "lume",
  themeVersion: "1.0.0",
  global: {},
  structure: { pages: {} },
  sections: {},
};

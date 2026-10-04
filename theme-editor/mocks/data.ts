import type {
  CategoryLite,
  Customization,
  MediaAsset,
  ProductLite,
  Store,
  StorePageLite,
} from "@/theme-editor/editor/contracts/types";

const img = (seed: string, w: number, h: number) => `https://picsum.photos/seed/${seed}/${w}/${h}`;

export const mockStore: Store = {
  name: "Casa Aurora",
  description: "Peças simples e bem feitas para o dia a dia.",
  logoUrl:
    "data:image/svg+xml;utf8," +
    encodeURIComponent(
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 220 48"><text x="0" y="34" font-family="Georgia,serif" font-size="30" letter-spacing="1">Casa Aurora</text></svg>`,
    ),
  email: "ola@casaaurora.example",
  phone: "+351 912 000 000",
  whatsapp: "+351 912 000 000",
  address: "Rua das Flores 12, Lisboa",
  hours: "Seg a Sex, 9h–18h",
  currency: "€",
  social: {
    instagram: "https://instagram.com/casaaurora",
    facebook: "https://facebook.com/casaaurora",
    tiktok: "https://tiktok.com/@casaaurora",
    whatsapp: "https://wa.me/351912000000",
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
};

export const mockCategories: CategoryLite[] = [
  { id: "c1", name: "Vestidos", image: img("vestidos", 600, 600), productCount: 24 },
  { id: "c2", name: "Camisas", image: img("camisas", 600, 600), productCount: 18 },
  { id: "c3", name: "Calças", image: img("calcas", 600, 600), productCount: 12 },
  { id: "c4", name: "Acessórios", image: img("acessorios", 600, 600), productCount: 31 },
  { id: "c5", name: "Calçado", image: img("calcado", 600, 600), productCount: 9 },
  { id: "c6", name: "Promoções", image: img("promocoes", 600, 600), productCount: 7 },
];

export const mockProducts: ProductLite[] = [
  { id: "p1", name: "Vestido de linho com cinto", price: 79.9, images: [img("p1", 800, 1000)], categoryId: "c1", inStock: true },
  { id: "p2", name: "Camisa de algodão orgânico com gola italiana e punhos duplos para ocasiões especiais", price: 49.9, images: [img("p2", 800, 1000)], categoryId: "c2", inStock: true },
  { id: "p3", name: "Calças largas", price: 59.9, comparePrice: 74.9, badge: "-20%", images: [img("p3", 800, 1000)], categoryId: "c3", inStock: true },
  { id: "p4", name: "Lenço de seda", price: 29.9, images: [], categoryId: "c4", inStock: true },
  { id: "p5", name: "Sandálias de couro", price: 89.0, images: [img("p5", 800, 1000)], categoryId: "c5", inStock: false },
  { id: "p6", name: "Casaco de lã", price: 189.0, images: [img("p6", 800, 1000), img("p6b", 800, 1000)], categoryId: "c2", inStock: true },
  { id: "p7", name: "Saia plissada", price: 64.5, images: [img("p7", 800, 1000)], categoryId: "c1", inStock: true },
  { id: "p8", name: "Mala de ombro", price: 129.0, images: [img("p8", 800, 1000)], categoryId: "c4", inStock: true },
  { id: "p9", name: "T-shirt essencial", price: 19.9, images: [img("p9", 800, 1000)], categoryId: "c2", inStock: true },
  { id: "p10", name: "Blazer estruturado", price: 349.0, images: [img("p10", 800, 1000)], categoryId: "c2", inStock: true },
  { id: "p11", name: "Meias de algodão", price: 9.9, images: [img("p11", 800, 1000)], categoryId: "c4", inStock: true },
  { id: "p12", name: "Vestido midi estampado", price: 99.0, comparePrice: 119.0, badge: "Novo", images: [img("p12", 800, 1000)], categoryId: "c1", inStock: true },
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
  { id: "m5", url: img("p1", 800, 1000), name: "vestido-linho.jpg", width: 800, height: 1000, tags: ["product"] },
  { id: "m6", url: img("p6", 800, 1000), name: "casaco-la.jpg", width: 800, height: 1000, tags: ["product"] },
  { id: "m7", url: img("small", 320, 200), name: "foto-pequena.jpg", width: 320, height: 200, tags: ["product"] },
  { id: "m8", url: mockStore.logoUrl, name: "logo.svg", width: 220, height: 48, tags: ["logo"] },
];

export const mockCustomization: Customization = {
  schemaVersion: 1,
  themeId: "demo-commerce",
  themeVersion: "1.0.0",
  global: {
    colors: { primary: "#1F2A24", secondary: "#9C7B5A" },
  },
  structure: { pages: {} },
  sections: {
    hero: {
      blocks: {
        items: {
          "hero-b1": { elements: { image: { image: { mediaId: "m1" } } } },
        },
      },
    },
    imageText: { elements: { image: { image: { mediaId: "m4" } } } },
  },
};

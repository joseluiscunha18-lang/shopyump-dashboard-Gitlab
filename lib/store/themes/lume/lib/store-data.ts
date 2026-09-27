export type ProductKind = "coat" | "shirt" | "bag" | "dress" | "tee" | "wallet" | "hoodie" | "cap";
export type Category = "Destaques" | "Vestuário" | "Acessórios";

export type Product = {
  id: string;
  name: string;
  price: number;
  category: Category;
  kind: ProductKind;
  tone: "stone" | "sage" | "rose" | "blue" | "sand" | "mist" | "pink" | "coral";
  createdAt?: string;
  /** Stock disponível. Indefinido = disponível (dados dinâmicos da loja). */
  stock?: number;
};

export const categories: Category[] = ["Destaques", "Vestuário", "Acessórios"];

export const categorySlug = (category: string) =>
  category.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

export const categoryFromSlug = (slug?: string) => categories.find((c) => categorySlug(c) === slug);

export const products: Product[] = [
  { id: "casaco-essential", name: "Produto 01", price: 1999, category: "Destaques", kind: "coat", tone: "blue", stock: 8 },
  { id: "camisa-leve", name: "Produto 02", price: 1999, category: "Vestuário", kind: "shirt", tone: "sand", stock: 4 },
  { id: "bolsa-mini", name: "Produto 03", price: 1999, category: "Acessórios", kind: "bag", tone: "stone", stock: 0 },
  { id: "vestido-solto", name: "Produto 04", price: 1999, category: "Vestuário", kind: "dress", tone: "rose", stock: 6 },
  { id: "t-shirt-studio", name: "Produto 05", price: 1999, category: "Destaques", kind: "tee", tone: "mist", stock: 12 },
  { id: "carteira-compacta", name: "Produto 06", price: 1999, category: "Acessórios", kind: "wallet", tone: "sage", stock: 3 },
];

export const formatPrice = (value: number) => `${new Intl.NumberFormat("pt-PT").format(value)} MT`;

export const getProduct = (id: string) => products.find((product) => product.id === id);

export const isInStock = (product: Product, quantity = 1) =>
  product.stock === undefined || product.stock >= quantity;

export const maxQuantity = (product: Product) =>
  product.stock === undefined ? 99 : Math.max(0, product.stock);

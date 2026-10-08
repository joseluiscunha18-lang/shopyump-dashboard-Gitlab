import { getProdutosPublicos } from '@/lib/queries/produtosPublicos';
import { getStoreUrl } from '@/lib/storeUrl';
import { isValidLumeCustomization } from '@/lib/store/themes/lume/lib/personalizacao';
import { createEmptyCustomization } from "@/theme-editor/themes/manifests";
import { mockCategories, mockProducts } from '@/theme-editor/mocks/data';
import type { LojaEditorInit } from '@/theme-editor/adapters/loja';
import type { CategoryLite, ProductLite } from '@/theme-editor/editor/contracts/types';
import type { Loja } from '@/types/database';

/**
 * Dados com que o editor ("Personalizar loja") arranca para uma loja real.
 * Corre no servidor; o resultado é só JSON simples para a página cliente.
 *
 * Mesma regra de onboarding da loja pública: sem produtos reais, o preview
 * mostra os produtos de demonstração do tema — assim o lojista vê sempre uma
 * loja "cheia" enquanto não cadastra os seus.
 */
export async function getEditorInit(loja: Loja): Promise<LojaEditorInit> {
  const reais = await getProdutosPublicos(loja.id);

  let products: ProductLite[];
  let categories: CategoryLite[];
  if (reais.length > 0) {
    products = reais.map((p) => ({
      id: p.id,
      name: p.nome,
      price: p.preco,
      images: p.fotos ?? [],
      categoryId: p.categoria,
      inStock: true,
    }));
    const counts = new Map<string, number>();
    for (const p of products) counts.set(p.categoryId, (counts.get(p.categoryId) ?? 0) + 1);
    categories = [...counts.entries()].map(([name, productCount]) => ({ id: name, name, image: '', productCount }));
  } else {
    products = mockProducts;
    categories = mockCategories;
  }

  const social: Record<string, string> = {};
  if (loja.instagram) social.instagram = loja.instagram;
  if (loja.facebook) social.facebook = loja.facebook;
  if (loja.tiktok) social.tiktok = loja.tiktok;

  return {
    lojaId: loja.id,
    store: {
      name: loja.nome,
      description: loja.descricao ?? '',
      logoUrl: '',
      email: loja.email ?? '',
      phone: '',
      whatsapp: loja.whatsapp ?? '',
      address: '',
      hours: '',
      currency: 'MT',
      social,
      menus: [],
    },
    products,
    categories,
    // Guardada válida → usa-a; ausente/inválida/outro tema → recomeça do padrão (Lume).
    customization: isValidLumeCustomization(loja.tema_personalizacao)
      ? loja.tema_personalizacao
      : createEmptyCustomization(),
    storeUrl: getStoreUrl(loja.slug),
  };
}

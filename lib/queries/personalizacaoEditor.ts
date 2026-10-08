import { getProdutosPublicos } from '@/lib/queries/produtosPublicos';
import { getStoreUrl } from '@/lib/storeUrl';
import { totalEstoque } from '@/lib/variantes';
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
      description: p.descricao ?? undefined,
      // Mesmo dado que a loja pública recebe — é o que permite ao editor
      // desenhar o seletor de variantes (Cor, Tamanho...) e o stock por versão.
      variantes: p.variantes,
      // Mesma regra de lume-loja-context.tsx: com versões, o stock é a soma das
      // ativas; sem versões, undefined = disponível.
      stock: p.variantes?.versoes?.length ? totalEstoque(p.variantes.versoes) : undefined,
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
      // MESMA regra que `lume-loja-context.tsx` usa para a loja pública
      // (`mostrar !== false` → por omissão visível). Antes desta alteração
      // este campo não existia aqui, por isso o editor nunca sabia se
      // "Envios e Entregas" / "Termos e Privacidade" estavam desligados na
      // loja real — é a causa do rodapé do editor mostrar links que a loja
      // real escondia.
      paginas: {
        entrega: { mostrar: loja.mostrar_entrega !== false },
        termos: { mostrar: loja.mostrar_termos !== false },
      },
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

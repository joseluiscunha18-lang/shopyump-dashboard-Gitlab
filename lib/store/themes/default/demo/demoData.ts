import type { ProdutoPublico } from '@/lib/queries/produtosPublicos';

const BASE = '/tema-default/produtos-exemplo';

/**
 * Produtos de demonstração — SÓ existem aqui, nunca na base de dados.
 * Aparecem na loja pública apenas quando `produtos.length === 0`
 * (ver DefaultTheme.tsx) e desaparecem sozinhos assim que o lojista
 * publica o seu primeiro produto real — não há nada para "limpar" ou
 * migrar, é puramente um fallback de apresentação.
 *
 * Propositadamente genéricos ("Produto 01"...) e com preço-exemplo
 * redondo — não são específicos de moda apesar da ilustração; servem
 * só para mostrar "aqui é onde entram nome, preço e foto", tal como o
 * Shopify mostra objetos genéricos numa loja vazia.
 */
export const PRODUTOS_DEMO: ProdutoPublico[] = [
  { id: 'demo-1', nome: 'Produto 01', preco: 1999, preco_promo: null, categoria: 'Destaques', descricao: null, fotos: [`${BASE}/coat.png`] },
  { id: 'demo-2', nome: 'Produto 02', preco: 1999, preco_promo: null, categoria: 'Geral', descricao: null, fotos: [`${BASE}/shirt.png`] },
  { id: 'demo-3', nome: 'Produto 03', preco: 1999, preco_promo: null, categoria: 'Acessórios', descricao: null, fotos: [`${BASE}/bag.png`] },
  { id: 'demo-4', nome: 'Produto 04', preco: 1999, preco_promo: null, categoria: 'Geral', descricao: null, fotos: [`${BASE}/dress.png`] },
  { id: 'demo-5', nome: 'Produto 05', preco: 1999, preco_promo: null, categoria: 'Destaques', descricao: null, fotos: [`${BASE}/tee.png`] },
  { id: 'demo-6', nome: 'Produto 06', preco: 1999, preco_promo: null, categoria: 'Acessórios', descricao: null, fotos: [`${BASE}/wallet.png`] },
];

/** Um `ProdutoPublico.id` que começa por "demo-" é sempre fictício. */
export function isProdutoDemo(id: string): boolean {
  return id.startsWith('demo-');
}

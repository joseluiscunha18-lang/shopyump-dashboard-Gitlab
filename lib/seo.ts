import type { Loja, Produto } from '@/types/database';

export interface SeoProduto {
  titulo: string;
  descricao: string;
  slug: string;
}

/**
 * Gera slug simples e estável a partir de um texto (remove acentos,
 * baixa para minúsculas, troca tudo o que não é [a-z0-9] por hífen).
 */
function slugify(texto: string): string {
  return texto
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-+|-+$)/g, '');
}

/**
 * SEO automático do produto (ver "nova_estrutura.txt" secção 2): o
 * vendedor não preenche título/descrição/URL SEO no formulário — isto é
 * calculado a partir do nome do produto + nome da loja + descrição do
 * produto, na hora de renderizar a página pública.
 *
 * Se `produto.mais_opcoes.seoTitulo` / `seoDescricao` estiverem
 * preenchidos (reservado para uma futura opção avançada "Editar SEO"),
 * eles têm prioridade sobre o valor gerado.
 */
export function gerarSeoProduto(
  produto: Pick<Produto, 'nome' | 'descricao' | 'mais_opcoes'>,
  loja: Pick<Loja, 'nome'>
): SeoProduto {
  const overrideTitulo = produto.mais_opcoes?.seoTitulo?.trim();
  const overrideDescricao = produto.mais_opcoes?.seoDescricao?.trim();

  const titulo = overrideTitulo || `${produto.nome} | ${loja.nome}`;
  const descricao =
    overrideDescricao || produto.descricao?.trim() || `${produto.nome}, disponível em ${loja.nome}.`;
  const slug = slugify(produto.nome);

  return { titulo, descricao, slug };
}

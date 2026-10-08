/**
 * Nomes dos buckets do Supabase Storage. Ficheiro SEM 'use client' de propósito:
 * é importado tanto pelo editor (navegador) como pelo servidor (que transforma
 * o caminho de uma imagem em URL público — ver lume/lib/personalizacao.ts).
 */
export const BUCKETS = {
  produtos: 'produtos',
  /** Imagens da loja: banner, logótipo e imagens das secções do editor. */
  lojas: 'Logo',
} as const;

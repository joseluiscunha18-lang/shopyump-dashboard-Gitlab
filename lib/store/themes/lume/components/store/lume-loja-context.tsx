'use client';

/**
 * LumeLojaContext — disponibiliza os dados reais da loja (vindos do
 * Supabase via StoreThemeProps) dentro do tema Lume, sem quebrar nenhum
 * dos componentes existentes.
 *
 * LÓGICA DE FALLBACK DE PRODUTOS:
 *   - Se o lojista ainda não tem nenhum produto real → mostra os 6
 *     produtos de demonstração (store-data.ts).
 *   - Assim que tiver ≥ 1 produto real → mostra apenas os reais.
 *   - Se apagar todos os produtos reais no futuro → volta à demo.
 *
 * REDES SOCIAIS / CONTACTOS:
 *   - Só são expostos os campos que o lojista preencheu; campos null/""
 *     ficam undefined aqui e os componentes que os consomem omitem o
 *     ícone/link correspondente.
 */

import { createContext, useContext, type ReactNode } from 'react';
import type { LojaPublica } from '@/lib/queries/lojaPublica';
import type { ProdutoPublico } from '@/lib/queries/produtosPublicos';
import {
  products as demoProducts,
  categories as demoCategories,
  type Product,
  type Category,
} from '../../lib/store-data';

/* ------------------------------------------------------------------ */
/* Tipos                                                                 */
/* ------------------------------------------------------------------ */

/** Produto unificado — pode ser demo (com `kind`/`tone`) ou real. */
export type LumeProduto = Product;

export interface LojaContactos {
  whatsapp: string | undefined;
  instagram: string | undefined;
  facebook: string | undefined;
  tiktok: string | undefined;
  email: string | undefined;
  /** Nome da loja para exibição no footer/header */
  nome: string;
  descricao: string | undefined;
}

export interface LumeLojaValue {
  /** true enquanto a loja estiver a usar produtos de demonstração */
  usandoDemo: boolean;
  produtos: LumeProduto[];
  categorias: Category[];
  contactos: LojaContactos;
}

/* ------------------------------------------------------------------ */
/* Conversor de ProdutoPublico → Product (LumeProduto)                  */
/* ------------------------------------------------------------------ */

const DEMO_KINDS = ['coat', 'shirt', 'bag', 'dress', 'tee', 'wallet', 'hoodie', 'cap'] as const;
const DEMO_TONES = ['stone', 'sage', 'rose', 'blue', 'sand', 'mist', 'pink', 'coral'] as const;

function produtoPublicoParaLume(p: ProdutoPublico, index: number): LumeProduto {
  // categoria: normaliza para uma das 3 categorias Lume ou "Destaques"
  const categoriaMap: Record<string, Category> = {
    destaques: 'Destaques',
    vestuario: 'Vestuário',
    acessorios: 'Acessórios',
  };
  const catNorm = p.categoria
    ?.normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
  const categoria: Category = categoriaMap[catNorm ?? ''] ?? 'Destaques';

  return {
    id: p.id,
    name: p.nome,
    price: p.preco,
    category: categoria,
    // Produto real não tem kind/tone → usa valores rotativos para o
    // ProductArt SVG. Se a loja tiver fotos reais no futuro, o ProductCard
    // dará prioridade à foto em vez do SVG.
    kind: DEMO_KINDS[index % DEMO_KINDS.length],
    tone: DEMO_TONES[index % DEMO_TONES.length],
    // stock undefined = disponível (tratado em isInStock)
    stock: undefined,
  };
}

/* ------------------------------------------------------------------ */
/* Contexto                                                              */
/* ------------------------------------------------------------------ */

const LumeLojaContext = createContext<LumeLojaValue | undefined>(undefined);

export function LumeLojaProvider({
  loja,
  produtos: produtosReais,
  children,
}: {
  loja: LojaPublica;
  produtos: ProdutoPublico[];
  children: ReactNode;
}) {
  const usandoDemo = produtosReais.length === 0;

  const produtos: LumeProduto[] = usandoDemo
    ? demoProducts
    : produtosReais.map(produtoPublicoParaLume);

  // Categorias presentes nos produtos actuais
  const categoriaSet = new Set(produtos.map((p) => p.category));
  const categorias: Category[] = demoCategories.filter((c) => categoriaSet.has(c));

  // Contactos — só expõe o que está preenchido
  const contactos: LojaContactos = {
    nome: loja.nome,
    descricao: loja.descricao ?? undefined,
    whatsapp: loja.whatsapp?.trim() || undefined,
    instagram: loja.instagram?.trim() || undefined,
    facebook: loja.facebook?.trim() || undefined,
    tiktok: loja.tiktok?.trim() || undefined,
    // email não existe em LojaPublica ainda — deixa undefined até ser adicionado
    email: undefined,
  };

  return (
    <LumeLojaContext.Provider value={{ usandoDemo, produtos, categorias, contactos }}>
      {children}
    </LumeLojaContext.Provider>
  );
}

export function useLumeLoja(): LumeLojaValue {
  const value = useContext(LumeLojaContext);
  if (!value) throw new Error('useLumeLoja deve ser usado dentro de LumeLojaProvider');
  return value;
}

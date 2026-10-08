'use client';

import { useEffect, useRef, useState, type Dispatch, type SetStateAction } from "react";
import type { ProdutoVersao } from "@/types/database";
import { resolveBuyState, type BuyState } from "@/lib/store/shared/storefront-logic";
import {
  caracteristicasDoProduto,
  encontrarVersao,
  estoqueDaVersao,
  galeriaDoProduto,
  imagensDaVersao,
  isInStock,
  maxQuantity,
  precoDaVersao,
  valoresParaCaracteristica,
  versaoInicial,
  type CaracteristicaVariante,
  type ProdutoComVariantes,
} from "./store-data";

/**
 * Estado de compra de um produto: variante escolhida, quantidade e tudo o que
 * deriva delas (versão, preço, stock, fotos, "pode comprar?").
 *
 * É O ÚNICO sítio onde esta lógica vive: a página de produto da loja pública e
 * o preview do editor chamam este hook, por isso não podem divergir.
 */
export interface ProductSelection {
  caracteristicas: CaracteristicaVariante[];
  temVariantes: boolean;
  selecao: Record<string, string>;
  setSelecao: Dispatch<SetStateAction<Record<string, string>>>;
  /** Escolhe um valor; as características seguintes (ex: Tamanho depois de Cor) têm de ser escolhidas de novo. */
  escolher: (nomeCaracteristica: string, valor: string) => void;
  versaoAtual: ProdutoVersao | undefined;
  selecaoCompleta: boolean;
  price: number;
  stock: number | undefined;
  /** Fotos da versão escolhida (versão → característica → galeria geral). */
  images: string[];
  buyState: BuyState;
  /** Fonte única de "pode comprar?" — Comprar Agora / Adicionar ao Carrinho só se for true. */
  available: boolean;
  limit: number;
  quantity: number;
  setQuantity: (q: number) => void;
}

const selecaoInicial = (product: ProdutoComVariantes): Record<string, string> => {
  const inicial = versaoInicial(product);
  return inicial ? { ...inicial.valores } : {};
};

export function useProductSelection(product: ProdutoComVariantes & { id: string }): ProductSelection {
  const [selecao, setSelecao] = useState<Record<string, string>>(() => selecaoInicial(product));
  const [quantity, setQuantity] = useState(1);

  // Ao trocar de produto, reinicia quantidade e escolhe a primeira versão
  // ativa/em estoque (se o produto tiver variantes).
  const produtoAnterior = useRef(product.id);
  useEffect(() => {
    if (produtoAnterior.current === product.id) return;
    produtoAnterior.current = product.id;
    setQuantity(1);
    setSelecao(selecaoInicial(product));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product.id]);

  const caracteristicas = caracteristicasDoProduto(product);
  const temVariantes = caracteristicas.length > 0;
  const versaoAtual = temVariantes ? encontrarVersao(product, selecao) : undefined;
  const selecaoCompleta = temVariantes ? caracteristicas.every((c) => Boolean(selecao[c.nome])) : true;

  const price = precoDaVersao(product, versaoAtual);
  const stock = estoqueDaVersao(product, versaoAtual);
  const buyState = resolveBuyState({
    hasVariants: temVariantes,
    selectionComplete: selecaoCompleta,
    versionActive: versaoAtual?.ativa,
    stock,
  });

  const escolher = (nomeCaracteristica: string, valor: string) =>
    setSelecao((atual) => {
      const proxima = { ...atual, [nomeCaracteristica]: valor };
      // Limpa as escolhas das características seguintes: o valor novo pode não
      // existir com elas (ex: trocou a cor e o tamanho escolhido não existe nessa cor).
      const indice = caracteristicas.findIndex((c) => c.nome === nomeCaracteristica);
      for (const c of caracteristicas.slice(indice + 1)) delete proxima[c.nome];
      return proxima;
    });

  return {
    caracteristicas,
    temVariantes,
    selecao,
    setSelecao,
    escolher,
    versaoAtual,
    selecaoCompleta,
    price,
    stock,
    images: imagensDaVersao(product, versaoAtual),
    buyState,
    available: buyState.status === "available" && isInStock(product, 1, stock),
    limit: maxQuantity(product, stock),
    quantity,
    setQuantity,
  };
}

/**
 * Galeria ligada à variante escolhida: todas as fotos (scroll livre), com a
 * galeria a posicionar-se na foto da cor escolhida (`galeria.alvos`) e, ao
 * fazer swipe para a foto de outra cor, a atualizar essa cor (`aoMudarFoto`).
 *
 * Partilhado pela loja pública e pelo editor, tal como `useProductSelection`.
 */
export function useProductGallery(product: ProdutoComVariantes & { id: string }, selection: ProductSelection) {
  const { caracteristicas, versaoAtual, selecao, setSelecao } = selection;
  const galeria = galeriaDoProduto(product, versaoAtual);
  const aoMudarFoto = (indice: number) => {
    const dono = galeria.donos[indice];
    const nomeCar = galeria.caracteristica;
    if (!nomeCar || dono == null || selecao[nomeCar] === dono) return;
    setSelecao((atual) => {
      const proxima = { ...atual, [nomeCar]: dono };
      const pos = caracteristicas.findIndex((c) => c.nome === nomeCar);
      for (const c of caracteristicas.slice(pos + 1)) {
        if (!valoresParaCaracteristica(product, c.nome, proxima).includes(proxima[c.nome])) delete proxima[c.nome];
      }
      return proxima;
    });
  };
  return { galeria, aoMudarFoto };
}

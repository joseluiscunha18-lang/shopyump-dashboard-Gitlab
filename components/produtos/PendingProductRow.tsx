'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { AlertTriangle, RotateCcw, X, Image as ImageIcon } from 'lucide-react';
import { usePublishing, type PendingProduto } from '@/components/produtos/PublishingContext';
import { Skeleton } from '@/components/ui/Surfaces';

/**
 * Enquanto a publicação está a decorrer (ou já terminou mas ainda à
 * espera de o `produtos` do servidor confirmar), mostra a MESMA aparência
 * de uma linha de produto real — foto local (blob:, é a mesma imagem que
 * vai ficar guardada), nome e preço já digitados. Isso faz a troca por
 * ProductRow (quando os dados reais chegam) ser impercetível — mesmo
 * layout, mesma foto, sem qualquer estado intermédio "a piscar" pelo meio.
 *
 * Ao MONTAR — ou seja, exatamente quando se chega à página Produtos —
 * esta linha (e só esta, as restantes já existentes na lista ficam
 * intactas) passa primeiro por um breve esqueleto (skeleton-shimmer, o
 * mesmo usado no resto do dashboard) antes de revelar a foto/nome/preço.
 * O botão "Publicar produto" já segura a navegação por
 * MIN_BOTAO_PUBLICAR_MS (ver ProductForm) só o suficiente para o clique
 * se sentir registado — o resto do "a processar" acontece aqui, já na
 * lista, como um carregamento rápido em vez de continuar preso ao ecrã do
 * formulário.
 *
 * Em caso de erro, o lojista precisa de contexto para decidir se tenta de
 * novo ou descarta — por isso, se `status` já vier (ou passar a) 'erro',
 * salta-se o esqueleto e mostra-se logo a mensagem e as ações.
 */
const SKELETON_MIN_MS = 1500;
const SKELETON_MAX_MS = 2000;

export function PendingProductRow({ produto }: { produto: PendingProduto }) {
  const { dismissPending } = usePublishing();
  const comErro = produto.status === 'erro';

  // Duração sorteada uma única vez por linha (não a cada re-render), para
  // não parecer sempre o mesmo tempo cronometrado ao segundo.
  const skeletonMsRef = useRef(SKELETON_MIN_MS + Math.random() * (SKELETON_MAX_MS - SKELETON_MIN_MS));
  const [showSkeleton, setShowSkeleton] = useState(!comErro);

  useEffect(() => {
    // Erro chegado a meio do esqueleto (ex: falhou o upload enquanto ainda
    // se mostrava a animar) — não faz sentido continuar a "carregar" algo
    // que já se sabe ter falhado.
    if (comErro) {
      setShowSkeleton(false);
      return;
    }
    const t = setTimeout(() => setShowSkeleton(false), skeletonMsRef.current);
    return () => clearTimeout(t);
  }, [comErro]);

  if (showSkeleton) {
    return (
      <div className="flex items-center gap-3 p-4">
        <Skeleton className="-ml-1 h-14 w-14 flex-shrink-0 rounded-md" />
        <div className="min-w-0 flex-1 flex flex-col gap-2">
          <Skeleton className="h-[13px] w-2/5" />
          <Skeleton className="h-[12px] w-1/3" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 p-4">
      <div className="relative -ml-1 h-14 w-14 flex-shrink-0 overflow-hidden rounded-md bg-slate-50">
        {comErro ? (
          <div className="flex h-full w-full items-center justify-center">
            <AlertTriangle size={22} strokeWidth={1.5} className="text-red-400" />
          </div>
        ) : produto.fotoPreview ? (
          <Image src={produto.fotoPreview} alt="" fill className="object-cover" sizes="56px" unoptimized />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <ImageIcon size={26} strokeWidth={1.5} style={{ color: 'rgba(26,18,16,0.22)' }} />
          </div>
        )}
        <div className="pointer-events-none absolute inset-0 rounded-md shadow-[inset_0_0_0_1px_rgba(26,18,16,0.08)]" />
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate text-[13px] font-bold text-ink">{produto.nome}</p>
        <p className="mt-0.5 truncate text-[12px] font-semibold text-slate-600">
          {produto.precoLabel} MZN · {produto.categoria}
        </p>
        {comErro ? (
          <p className="mt-1 flex items-center gap-1.5 text-[11px] font-semibold text-slate-600">
            <AlertTriangle size={11} className="text-red-500" />
            <span className="text-red-500">{produto.errorMessage ?? 'Não foi possível publicar.'}</span>
          </p>
        ) : (
          <p className="mt-1 flex items-center gap-1.5 text-[11px] font-semibold text-slate-600">
            <span className="h-[6px] w-[6px] rounded-full bg-emerald-500" />
            Ativo
          </p>
        )}
      </div>

      {comErro && (
        <div className="flex flex-shrink-0 items-center gap-1">
          <Link
            href="/produtos/novo"
            aria-label="Tentar novamente"
            title="Tentar novamente"
            className="flex h-8 w-8 items-center justify-center rounded-md text-slate-500 transition-colors hover:bg-slate-100 hover:text-ink"
          >
            <RotateCcw size={16} strokeWidth={2.2} />
          </Link>
          <button
            type="button"
            onClick={() => dismissPending(produto.tempId)}
            aria-label="Descartar"
            title="Descartar"
            className="flex h-8 w-8 items-center justify-center rounded-md text-slate-500 transition-colors hover:bg-slate-100 hover:text-ink"
          >
            <X size={16} strokeWidth={2.2} />
          </button>
        </div>
      )}
    </div>
  );
}

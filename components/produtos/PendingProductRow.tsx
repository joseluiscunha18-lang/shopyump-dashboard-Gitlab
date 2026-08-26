'use client';

import Image from 'next/image';
import Link from 'next/link';
import { AlertTriangle, RotateCcw, X, Image as ImageIcon } from 'lucide-react';
import { usePublishing, type PendingProduto } from '@/components/produtos/PublishingContext';

/**
 * Enquanto a publicação está a decorrer (ou já terminou mas ainda à
 * espera de o `produtos` do servidor confirmar), mostra a MESMA aparência
 * de uma linha de produto real — foto local (blob:, é a mesma imagem que
 * vai ficar guardada), nome e preço já digitados. Nada de "esqueleto"
 * genérico nem de "A publicar…": como já temos tudo o que é preciso para
 * mostrar um resultado com aparência definitiva, mostramo-lo já assim.
 * Isso faz a troca por ProductRow (quando os dados reais chegam) ser
 * impercetível — mesmo layout, mesma foto, sem qualquer estado intermédio
 * "a piscar" pelo meio.
 *
 * Em caso de erro, porém, o lojista precisa de contexto para decidir se
 * tenta de novo ou descarta — por isso só aí mostramos a mensagem e ações.
 */
export function PendingProductRow({ produto }: { produto: PendingProduto }) {
  const { dismissPending } = usePublishing();
  const comErro = produto.status === 'erro';

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

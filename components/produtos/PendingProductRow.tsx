'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Loader2, AlertTriangle, RotateCcw, X, Image as ImageIcon } from 'lucide-react';
import { usePublishing, type PendingProduto } from '@/components/produtos/PublishingContext';

/**
 * Aparência deliberadamente muito próxima de ProductRow — o lojista deve
 * reconhecer isto como "o meu produto, só que ainda a chegar", não como um
 * componente à parte. Sem link nem menu de ações: ainda não há um `id`
 * real para navegar.
 */
export function PendingProductRow({ produto }: { produto: PendingProduto }) {
  const { dismissPending } = usePublishing();
  const comErro = produto.status === 'erro';

  return (
    <div className="flex items-center gap-3 p-4">
      <div className="relative -ml-1 h-14 w-14 flex-shrink-0 overflow-hidden rounded-md bg-slate-50">
        {produto.fotoPreview ? (
          <Image src={produto.fotoPreview} alt="" fill className="object-cover" sizes="56px" unoptimized />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <ImageIcon size={26} strokeWidth={1.5} style={{ color: 'rgba(26,18,16,0.22)' }} />
          </div>
        )}
        <div className="pointer-events-none absolute inset-0 rounded-md shadow-[inset_0_0_0_1px_rgba(26,18,16,0.08)]" />
        {!comErro && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/55">
            <Loader2 size={18} className="animate-spin text-[#1A1210]/50" />
          </div>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate text-[13px] font-bold text-ink">{produto.nome}</p>
        <p className="mt-0.5 truncate text-[12px] font-semibold text-slate-600">
          {produto.precoLabel} MZN · {produto.categoria}
        </p>
        <p className="mt-1 flex items-center gap-1.5 text-[11px] font-semibold text-slate-600">
          {comErro ? (
            <>
              <AlertTriangle size={11} className="text-red-500" />
              <span className="text-red-500">{produto.errorMessage ?? 'Não foi possível publicar.'}</span>
            </>
          ) : (
            <>
              <span className="h-[6px] w-[6px] animate-pulse rounded-full bg-amber-400" />
              A publicar…
            </>
          )}
        </p>
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

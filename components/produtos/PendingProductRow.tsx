'use client';

import Link from 'next/link';
import { AlertTriangle, RotateCcw, X } from 'lucide-react';
import { usePublishing, type PendingProduto } from '@/components/produtos/PublishingContext';

/**
 * Esqueleto genérico — sem foto, nome ou "A publicar…" — usado sempre que
 * o lojista está à espera de um produto que ainda não tem dados reais
 * para mostrar. Exportado daqui (e não como um componente à parte) porque
 * só tem estes dois usos: aqui, e a mesma janela de espera em
 * ProductsExplorer logo depois de o pendente resolver.
 */
export function ProductRowSkeleton() {
  return (
    <div className="flex animate-pulse items-center gap-3 p-4">
      <div className="h-14 w-14 flex-shrink-0 rounded-md bg-slate-100" />
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <div className="h-3 w-2/5 rounded bg-slate-100" />
        <div className="h-2.5 w-1/3 rounded bg-slate-100" />
      </div>
    </div>
  );
}

/**
 * Enquanto a publicação está a decorrer, mostra o esqueleto acima — não a
 * foto/nome/preço já digitados no formulário. Isso evita a sequência
 * "linha com preview + spinner → esqueleto → produto real": agora é
 * sempre "esqueleto → produto real", uma transição só.
 *
 * Em caso de erro, porém, o lojista precisa de contexto para decidir se
 * tenta de novo ou descarta — por isso só aí mostramos nome, preço e a
 * mensagem de erro.
 */
export function PendingProductRow({ produto }: { produto: PendingProduto }) {
  const { dismissPending } = usePublishing();
  const comErro = produto.status === 'erro';

  if (!comErro) {
    return <ProductRowSkeleton />;
  }

  return (
    <div className="flex items-center gap-3 p-4">
      <div className="relative -ml-1 h-14 w-14 flex-shrink-0 overflow-hidden rounded-md bg-slate-50">
        <div className="flex h-full w-full items-center justify-center">
          <AlertTriangle size={22} strokeWidth={1.5} className="text-red-400" />
        </div>
        <div className="pointer-events-none absolute inset-0 rounded-md shadow-[inset_0_0_0_1px_rgba(26,18,16,0.08)]" />
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate text-[13px] font-bold text-ink">{produto.nome}</p>
        <p className="mt-0.5 truncate text-[12px] font-semibold text-slate-600">
          {produto.precoLabel} MZN · {produto.categoria}
        </p>
        <p className="mt-1 flex items-center gap-1.5 text-[11px] font-semibold text-slate-600">
          <AlertTriangle size={11} className="text-red-500" />
          <span className="text-red-500">{produto.errorMessage ?? 'Não foi possível publicar.'}</span>
        </p>
      </div>

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
    </div>
  );
}


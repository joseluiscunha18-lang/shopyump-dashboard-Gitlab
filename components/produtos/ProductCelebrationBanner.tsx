'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { X } from 'lucide-react';

/**
 * Banner discreto no topo da página Produtos, exibido logo após a primeira
 * publicação. Fica visível junto à lista (nunca por cima dela) e confirma,
 * de forma neutra e profissional, que o produto está ativo na loja.
 *
 * Entra via query params (?publicado=ID&foto=URL) definidos pelo
 * ProductForm no redirect.
 */
export function ProductCelebrationBanner({ lojaSlug }: { lojaSlug?: string }) {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const produtoId     = searchParams.get('publicado');
  const foto          = searchParams.get('foto');

  const [mounted, setMounted] = useState(false);
  const [open, setOpen]       = useState(false);

  useEffect(() => {
    if (!produtoId) return;
    setMounted(true);
    // Pequena pausa: a lista de produtos aparece primeiro, com o novo
    // produto já visível, antes do banner entrar por cima.
    const t = setTimeout(() => setOpen(true), 260);
    return () => clearTimeout(t);
  }, [produtoId]);

  function fechar() {
    setOpen(false);
    setMounted(false);
    const url = new URL(window.location.href);
    url.searchParams.delete('publicado');
    url.searchParams.delete('foto');
    router.replace(url.pathname + url.search);
  }

  if (!mounted || !produtoId) return null;

  return (
    <div
      className={
        'relative flex flex-col gap-3 overflow-hidden rounded-xl border border-zinc-200 bg-zinc-50 p-3.5 pr-11 sm:flex-row sm:items-center sm:gap-4 sm:p-4 sm:pr-12 ' +
        (open ? 'animate-celebration-banner' : '-translate-y-2.5 opacity-0')
      }
    >
      <div className="flex items-center gap-3 sm:gap-4">
        {/* Thumbnail */}
        {foto ? (
          <div className="h-11 w-11 shrink-0 overflow-hidden rounded-[10px] border border-zinc-200 sm:h-12 sm:w-12">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={foto} alt="" className="h-full w-full object-cover" />
          </div>
        ) : (
          <div className="h-11 w-11 shrink-0 rounded-[10px] border border-zinc-200 bg-zinc-100 sm:h-12 sm:w-12" />
        )}

        {/* Texto */}
        <div className="min-w-0 flex-1">
          <p className="truncate text-[13.5px] font-bold leading-tight text-zinc-900">
            Seu produto já está na sua loja
          </p>
          <p className="mt-0.5 truncate text-[12px] font-medium text-zinc-500">
            Veja como seus clientes vão encontrar.
          </p>
        </div>
      </div>

      {/* CTA — secundário, neutro; não compete com o botão + da navegação inferior */}
      {lojaSlug ? (
        <a
          href={`https://${lojaSlug}.shopyump.com/p/${produtoId}`}
          target="_blank"
          rel="noopener noreferrer"
          className="shrink-0 whitespace-nowrap rounded-lg bg-zinc-100 px-3 py-1.5 text-center text-[12.5px] font-semibold text-zinc-900 transition-colors hover:bg-zinc-200 active:scale-[0.98] sm:ml-auto"
        >
          Ver produto na loja
        </a>
      ) : (
        <button
          type="button"
          onClick={fechar}
          className="shrink-0 whitespace-nowrap rounded-lg bg-zinc-100 px-3 py-1.5 text-center text-[12.5px] font-semibold text-zinc-900 transition-colors hover:bg-zinc-200 active:scale-[0.98] sm:ml-auto"
        >
          Ver produto na loja
        </button>
      )}

      <button
        type="button"
        onClick={fechar}
        aria-label="Fechar"
        className="absolute right-2.5 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full text-zinc-400 transition-colors hover:bg-zinc-200/70 hover:text-zinc-600"
      >
        <X size={15} strokeWidth={2} />
      </button>
    </div>
  );
}

'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { X } from 'lucide-react';

/**
 * Banner de celebração no topo da página Produtos, exibido logo após a
 * primeira publicação. Ao contrário de um modal, não cobre o produto que
 * acabou de ser criado — a lista fica sempre visível por baixo, reforçando
 * "o meu produto está aqui" enquanto o banner celebra e convida a ver a
 * experiência do cliente.
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
        'relative flex flex-col gap-3 overflow-hidden rounded-[16px] border border-[#F0DCC8] bg-brand-soft/60 p-3.5 pr-11 shadow-[0_2px_10px_-4px_rgba(15,23,42,0.08)] sm:flex-row sm:items-center sm:gap-4 sm:p-4 sm:pr-12 ' +
        (open ? 'animate-celebration-banner' : '-translate-y-2.5 opacity-0')
      }
    >
      {/* Faixa de destaque à esquerda — cor da marca, não preto (reservado à navegação) */}
      <span className="absolute inset-y-0 left-0 w-1 bg-brand" />

      <div className="flex items-center gap-3 sm:gap-4">
        {/* Thumbnail */}
        {foto ? (
          <div className="h-11 w-11 shrink-0 overflow-hidden rounded-[10px] border border-white/80 shadow-sm sm:h-12 sm:w-12">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={foto} alt="" className="h-full w-full object-cover" />
          </div>
        ) : (
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[10px] bg-white text-xl shadow-sm sm:h-12 sm:w-12">
            🎉
          </div>
        )}

        {/* Texto */}
        <div className="min-w-0 flex-1">
          <p className="truncate text-[13.5px] font-extrabold leading-tight text-[#111110]">
            Seu produto já está na sua loja 🎉
          </p>
          <p className="mt-0.5 truncate text-[12px] font-medium text-[#6B5A4C]">
            Veja como seus clientes vão encontrar.
          </p>
        </div>
      </div>

      {/* CTA — cor da marca em vez de preto, para não competir com o botão + da navegação inferior */}
      {lojaSlug ? (
        <a
          href={`https://${lojaSlug}.shopyump.com/p/${produtoId}`}
          target="_blank"
          rel="noopener noreferrer"
          className="shrink-0 whitespace-nowrap rounded-[10px] bg-brand px-3.5 py-2 text-center text-[12.5px] font-bold text-brand-foreground shadow-sm transition-colors hover:brightness-95 active:scale-[0.98] sm:ml-auto"
        >
          Ver produto na loja
        </a>
      ) : (
        <button
          type="button"
          onClick={fechar}
          className="shrink-0 whitespace-nowrap rounded-[10px] bg-brand px-3.5 py-2 text-center text-[12.5px] font-bold text-brand-foreground shadow-sm transition-colors hover:brightness-95 active:scale-[0.98] sm:ml-auto"
        >
          Ver produto na loja
        </button>
      )}

      <button
        type="button"
        onClick={fechar}
        aria-label="Fechar"
        className="absolute right-2.5 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full text-[#8A7A6C] transition-colors hover:bg-white/70 hover:text-[#5A4B3D]"
      >
        <X size={15} strokeWidth={2} />
      </button>
    </div>
  );
}

'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { X } from 'lucide-react';

/**
 * Modal de celebração exibido na página Produtos logo após uma primeira
 * publicação. O fluxo entra aqui via query params (?publicado=ID&foto=URL)
 * definidos pelo ProductForm no redirect — a página Produtos já carregou
 * por trás (o lojista vê de imediato o produto ativo na lista) e só depois
 * de uma pequena pausa o modal desliza a partir da base do ecrã, reforçando
 * o momento com um único CTA para a loja pública.
 */
export function ProductCelebrationModal({ lojaSlug }: { lojaSlug?: string }) {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const produtoId     = searchParams.get('publicado');
  const foto          = searchParams.get('foto');

  const [mounted, setMounted] = useState(false); // presente no DOM
  const [open, setOpen]       = useState(false); // controla a animação de entrada

  useEffect(() => {
    if (!produtoId) return;
    setMounted(true);
    // Pequena pausa para o lojista perceber primeiro que o produto já está
    // na lista, antes do modal surgir por cima.
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
        'fixed inset-0 z-[100] flex items-end justify-center bg-black/50 px-4 pb-10 sm:items-center sm:pb-4 ' +
        (open ? 'animate-celebration-overlay' : 'opacity-0')
      }
      onClick={fechar}
    >
      <div
        className={
          'relative w-full max-w-[320px] rounded-[22px] bg-white p-5 shadow-[0_20px_60px_-12px_rgba(0,0,0,0.35)] ' +
          (open ? 'animate-celebration-card' : 'translate-y-7 scale-[0.97] opacity-0')
        }
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={fechar}
          aria-label="Fechar"
          className="absolute right-3.5 top-3.5 flex h-7 w-7 items-center justify-center rounded-full text-[#A1A1AA] transition-colors hover:bg-[#F4F4F3] hover:text-[#52525B]"
        >
          <X size={16} strokeWidth={2} />
        </button>

        {/* Thumbnail */}
        <div className="mb-4 flex justify-center">
          {foto ? (
            <div className="h-16 w-16 overflow-hidden rounded-[14px] border border-[#EDEBE8] shadow-sm">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={foto} alt="" className="h-full w-full object-cover" />
            </div>
          ) : (
            <div className="flex h-16 w-16 items-center justify-center rounded-[14px] bg-[#F4F4F3] text-3xl">
              🎉
            </div>
          )}
        </div>

        <div className="flex flex-col items-center text-center">
          <h3 className="text-[16px] font-extrabold leading-tight text-[#111110]">
            Seu produto já está na sua loja 🎉
          </h3>
          <p className="mt-1.5 max-w-[250px] text-[13px] font-medium leading-relaxed text-[#71717A]">
            Veja como seus clientes vão encontrar este produto.
          </p>
        </div>

        <div className="mt-5">
          {lojaSlug ? (
            <a
              href={`https://${lojaSlug}.shopyump.com/p/${produtoId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex w-full items-center justify-center gap-2 rounded-[12px] bg-[#111110] px-4 py-2.5 text-[13px] font-bold text-white transition-colors hover:bg-[#27272A] active:scale-[0.99]"
            >
              Ver produto na loja
            </a>
          ) : (
            <button
              type="button"
              onClick={fechar}
              className="flex w-full items-center justify-center gap-2 rounded-[12px] bg-[#111110] px-4 py-2.5 text-[13px] font-bold text-white transition-colors hover:bg-[#27272A] active:scale-[0.99]"
            >
              Ver produto na loja
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

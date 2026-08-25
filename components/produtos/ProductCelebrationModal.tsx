'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { X } from 'lucide-react';

/**
 * Modal de celebração exibido na página Produtos logo após uma primeira
 * publicação. O fluxo entra aqui via query params (?publicado=ID&foto=URL)
 * definidos pelo ProductForm no redirect — a página Produtos já carregou
 * por trás, o utilizador vê de imediato que o produto está ativo na lista,
 * e o modal reforça o momento com um único CTA para a loja pública.
 */
export function ProductCelebrationModal({ lojaSlug }: { lojaSlug?: string }) {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const produtoId     = searchParams.get('publicado');
  const foto          = searchParams.get('foto');

  const [visible, setVisible] = useState(!!produtoId);

  useEffect(() => {
    setVisible(!!produtoId);
  }, [produtoId]);

  function fechar() {
    setVisible(false);
    const url = new URL(window.location.href);
    url.searchParams.delete('publicado');
    url.searchParams.delete('foto');
    router.replace(url.pathname + url.search);
  }

  if (!visible || !produtoId) return null;

  return (
    <div
      className="animate-modal-overlay fixed inset-0 z-[100] flex items-end justify-center bg-black/50 p-4 sm:items-center"
      onClick={fechar}
    >
      <div
        className="animate-modal-card relative w-full max-w-sm rounded-[24px] bg-white p-6 shadow-[0_20px_60px_-12px_rgba(0,0,0,0.35)]"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={fechar}
          aria-label="Fechar"
          className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full text-[#A1A1AA] transition-colors hover:bg-[#F4F4F3] hover:text-[#52525B]"
        >
          <X size={17} strokeWidth={2} />
        </button>

        {/* Thumbnail */}
        <div className="mb-5 flex justify-center">
          {foto ? (
            <div className="h-20 w-20 overflow-hidden rounded-[16px] border border-[#EDEBE8] shadow-sm">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={foto} alt="" className="h-full w-full object-cover" />
            </div>
          ) : (
            <div className="flex h-20 w-20 items-center justify-center rounded-[16px] bg-[#F4F4F3] text-4xl">
              🎉
            </div>
          )}
        </div>

        <div className="flex flex-col items-center text-center">
          <p className="text-[11.5px] font-semibold uppercase tracking-[0.06em] text-[#A1A1AA]">
            Publicado agora
          </p>
          <h3 className="mt-1 text-[18px] font-extrabold leading-tight text-[#111110]">
            Seu produto está publicado 🎉
          </h3>
          <p className="mt-2 max-w-[280px] text-[13.5px] font-medium leading-relaxed text-[#71717A]">
            Veja como seus clientes encontrarão este produto na sua loja.
          </p>
        </div>

        <div className="mt-6">
          {lojaSlug ? (
            <a
              href={`https://${lojaSlug}.shopyump.com/p/${produtoId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex w-full items-center justify-center gap-2 rounded-[12px] bg-[#111110] px-4 py-2.5 text-[13.5px] font-bold text-white transition-colors hover:bg-[#27272A] active:scale-[0.99]"
            >
              Ver produto na loja
            </a>
          ) : (
            <button
              type="button"
              onClick={fechar}
              className="flex w-full items-center justify-center gap-2 rounded-[12px] bg-[#111110] px-4 py-2.5 text-[13.5px] font-bold text-white transition-colors hover:bg-[#27272A] active:scale-[0.99]"
            >
              Ver produto na loja
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

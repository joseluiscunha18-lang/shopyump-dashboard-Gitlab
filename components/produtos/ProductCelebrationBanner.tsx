'use client';

import NextImage from 'next/image';
import { X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { usePublishing } from '@/components/produtos/PublishingContext';

const DURATION_MS = 400;
// Tempo de "respiro" antes do banner começar a entrar — dá ao lojista um
// instante para reconhecer que chegou à página Produtos, ver o produto já
// na lista (ainda que como card "a publicar" ou já resolvido) antes de
// qualquer confirmação extra aparecer. Sem isto, o banner surge colado à
// navegação e o utilizador nunca chega a assimilar que o produto foi mesmo
// criado — o valor de 1400ms garante alguns segundos de "assentar" mesmo
// em conexões rápidas, sem parecer uma demora artificial.
const REVEAL_DELAY_MS = 1400;
const EASE = 'cubic-bezier(0.22,1,0.36,1)';

/**
 * Banner discreto no topo da página Produtos, exibido logo após a primeira
 * publicação (ou qualquer publicação) terminar com sucesso. Fica visível
 * junto à lista (nunca por cima dela) e confirma, de forma neutra e
 * profissional, que o produto está ativo na loja.
 *
 * A fonte da verdade é o PublishingContext (`celebration`), não a URL —
 * antes usava ?publicado=ID&foto=URL, mas isso dependia do redirect
 * acontecer só depois do upload/insert terminarem. Agora que a publicação
 * é otimista (o ProductForm navega logo e o upload/insert continuam em
 * segundo plano), é o próprio contexto que acende este banner quando o
 * trabalho em fundo resolve — independentemente de que página o lojista
 * estava a ver nesse momento.
 *
 * Sequência de entrada:
 * 1. Assim que `celebration` aparece, o banner monta no DOM com altura 0
 *    e opacidade 0 — não ocupa espaço nem é visível.
 * 2. Passados REVEAL_DELAY_MS, a altura expande e o conteúdo entra com
 *    fade + slide, empurrando a lista para baixo de forma fluida ao longo
 *    de DURATION_MS.
 *
 * O fecho (X) faz o percurso inverso — colapsa e desvanece antes de
 * limpar `celebration` — usando DURATION_MS e a mesma curva, para que
 * entrada e saída pareçam espelhadas (a saída não precisa do respiro
 * inicial, só a entrada).
 */
export function ProductCelebrationBanner({ lojaSlug }: { lojaSlug?: string }) {
  const { celebration, clearCelebration } = usePublishing();
  const [open, setOpen] = useState(false); // controla a animação (altura + fade)

  const produtoId = celebration?.produtoId ?? null;
  const foto = celebration?.foto ?? null;

  useEffect(() => {
    if (!produtoId) return;
    // Espera a página "assentar" antes de animar a entrada.
    const t = setTimeout(() => setOpen(true), REVEAL_DELAY_MS);
    return () => clearTimeout(t);
  }, [produtoId]);

  function fechar() {
    setOpen(false); // dispara a animação de saída (colapso + fade)
    setTimeout(() => {
      clearCelebration();
    }, DURATION_MS);
  }

  if (!celebration) return null;

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateRows: open ? '1fr' : '0fr',
        transition: `grid-template-rows ${DURATION_MS}ms ${EASE}`,
      }}
    >
      <div style={{ overflow: 'hidden', minHeight: 0 }}>
        <div
          style={{
            opacity: open ? 1 : 0,
            transform: open ? 'translateY(0)' : 'translateY(-12px)',
            transition: `opacity ${DURATION_MS}ms ${EASE}, transform ${DURATION_MS}ms ${EASE}`,
          }}
          className="relative flex flex-col gap-3 rounded-xl border border-zinc-200 bg-white p-3.5 pr-11 shadow-sm sm:flex-row sm:items-center sm:gap-4 sm:p-4 sm:pr-12"
        >
          <div className="flex items-center gap-3 sm:gap-4">
            {/* Thumbnail — mesmo tamanho (56px) e sizes que a lista de produtos usa,
                para reaproveitar a imagem já otimizada e em cache pelo Next.js
                em vez de a carregar de novo aqui. */}
            {foto ? (
              <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-[10px] border border-zinc-200 sm:h-12 sm:w-12">
                <NextImage src={foto} alt="" fill sizes="56px" className="object-cover" />
              </div>
            ) : (
              <div className="h-11 w-11 shrink-0 rounded-[10px] border border-zinc-200 bg-zinc-100 sm:h-12 sm:w-12" />
            )}

            {/* Texto */}
            <div className="min-w-0 flex-1">
              <p className="flex items-center gap-1.5 truncate text-[13.5px] font-bold leading-tight text-zinc-900">
                <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />
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

          {/* X — fixo no canto superior direito, com área de toque ampliada */}
          <button
            type="button"
            onClick={fechar}
            aria-label="Fechar"
            className="absolute right-1 top-1 flex h-10 w-10 items-center justify-center text-zinc-400 transition-colors hover:text-zinc-600"
          >
            <span className="flex h-7 w-7 items-center justify-center rounded-full transition-colors hover:bg-zinc-100">
              <X size={15} strokeWidth={2} />
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}

'use client';

import NextImage from 'next/image';
import { X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
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
  const containerRef = useRef<HTMLDivElement>(null);

  // Dados imediatos — disponíveis desde startPublish, sem esperar rede.
  const nome       = celebration?.nome       ?? null;
  const precoLabel = celebration?.precoLabel ?? null;
  const fotoBlob   = celebration?.fotoPreview ?? null;
  // Foto CDN — só disponível após resolvePublish; enquanto não chega usa o blob local.
  const fotoCdn    = celebration?.foto        ?? null;
  const foto       = fotoCdn ?? fotoBlob;
  // produtoId — null enquanto upload/insert decorrem; link só aparece quando estiver pronto.
  const produtoId  = celebration?.produtoId  ?? null;

  useEffect(() => {
    // O banner acende assim que celebration existe (desde startPublish),
    // não é preciso esperar produtoId. tempId é a âncora estável.
    if (!celebration?.tempId) return;
    // Espera a página "assentar" antes de animar a entrada.
    const t = setTimeout(() => {
      setOpen(true);
      // O banner nasce como o primeiro elemento do conteúdo da página — se
      // o lojista já tiver rolado a lista de produtos para baixo, ele
      // apareceria fora do ecrã ou cortado no topo. Rola a própria janela
      // até o topo (onde o banner sempre fica) em vez de scrollIntoView no
      // próprio banner, porque a sua altura ainda está a animar de 0 até o
      // tamanho final neste instante — calcular a posição a partir de uma
      // caixa que ainda está a crescer dava uma rolagem incompleta.
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, REVEAL_DELAY_MS);
    return () => clearTimeout(t);
  }, [celebration?.tempId]);

  function fechar() {
    setOpen(false); // dispara a animação de saída (colapso + fade)
    setTimeout(() => {
      clearCelebration();
    }, DURATION_MS);
  }

  if (!celebration) return null;

  return (
    <div
      ref={containerRef}
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
                {/* blob: URLs não passam pelo optimizador do Next.js — usa <img> directamente.
                    Quando resolvePublish trouxer a URL CDN, fotoCdn substitui o blob e
                    NextImage volta a ser usado. A troca é imperceptível porque é a mesma foto. */}
                {fotoCdn ? (
                  <NextImage src={fotoCdn} alt="" fill sizes="56px" className="object-cover" />
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={foto} alt="" className="h-full w-full object-cover" />
                )}
              </div>
            ) : (
              <div className="h-11 w-11 shrink-0 rounded-[10px] border border-zinc-200 bg-zinc-100 sm:h-12 sm:w-12" />
            )}

            {/* Texto — usa dados optimistas disponíveis desde startPublish */}
            <div className="min-w-0 flex-1">
              <p className="flex items-center gap-1.5 truncate text-[13.5px] font-bold leading-tight text-zinc-900">
                <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />
                {nome ?? 'Produto publicado'}
              </p>
              <p className="mt-0.5 truncate text-[12px] font-medium text-zinc-500">
                {precoLabel ? `${precoLabel} MZN · ` : ''}Já está na sua loja
              </p>
            </div>
          </div>

          {/* CTA — o link para a loja não depende do produtoId (o lojaSlug já
              está disponível desde o startPublish), por isso o lojista nunca
              vê um botão morto tipo "OK": desde o primeiro instante já pode
              ir ver a sua loja. Assim que produtoId chegar (resolvePublish),
              o mesmo botão passa a apontar directamente para a página do
              produto — sem trocar de rótulo, só o destino melhora. */}
          {lojaSlug ? (
            <a
              href={
                produtoId
                  ? `https://shopyump.vercel.app/loja/${lojaSlug}/p/${produtoId}`
                  : `https://shopyump.vercel.app/loja/${lojaSlug}`
              }
              target="_blank"
              rel="noopener noreferrer"
              className="shrink-0 whitespace-nowrap rounded-lg bg-zinc-100 px-3 py-1.5 text-center text-[12.5px] font-semibold text-zinc-900 transition-colors hover:bg-zinc-200 active:scale-[0.98] sm:ml-auto"
            >
              Ver sua loja
            </a>
          ) : (
            <button
              type="button"
              onClick={fechar}
              className="shrink-0 whitespace-nowrap rounded-lg bg-zinc-100 px-3 py-1.5 text-center text-[12.5px] font-semibold text-zinc-900 transition-colors hover:bg-zinc-200 active:scale-[0.98] sm:ml-auto"
            >
              OK
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

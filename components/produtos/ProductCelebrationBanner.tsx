'use client';

import { ArrowRight, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { usePublishing } from '@/components/produtos/PublishingContext';

const DURATION_MS = 400;
// CTA preenchido — mesmo preto/castanho do botão "Adicionar" da navegação
// (bg-zinc-900), para ficar claramente a ação principal do card sem
// competir com aquele botão. No mobile (card empilhado em coluna) o botão
// fica a ~60% da largura do card — nem uma barra esticada de ponta a
// ponta, nem um botão pequeno perdido no meio de muito espaço vazio à
// direita. Em ecrãs maiores (sm:), onde o botão fica ao lado do
// conteúdo em vez de abaixo dele, volta a `w-auto` — 60% de uma LINHA
// (imagem+texto+botão) seria enorme, só faz sentido como percentagem de
// uma coluna.
const CTA_PRIMARIO =
  'group inline-flex w-[60%] shrink-0 items-center justify-center gap-1.5 whitespace-nowrap rounded-full bg-zinc-900 px-4 py-2.5 text-center text-[12.5px] font-semibold text-white transition-all hover:bg-zinc-800 active:scale-[0.98] sm:ml-auto sm:w-auto';
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

  // Definido uma vez, usado em dois pontos da árvore (mobile: dentro da
  // coluna de texto; desktop/tablet: ao lado do conteúdo) — ver comentários
  // junto a cada `{cta}` abaixo sobre o motivo de existirem duas posições.
  const cta = lojaSlug ? (
    <a
      href={
        produtoId
          ? `https://shopyump.vercel.app/loja/${lojaSlug}/p/${produtoId}`
          : `https://shopyump.vercel.app/loja/${lojaSlug}`
      }
      target="_blank"
      rel="noopener noreferrer"
      className={CTA_PRIMARIO}
    >
      Ver minha loja
      <ArrowRight size={12} strokeWidth={2.25} className="opacity-40 transition-transform group-hover:translate-x-0.5" />
    </a>
  ) : (
    <button type="button" onClick={fechar} className={CTA_PRIMARIO}>
      OK
      <ArrowRight size={12} strokeWidth={2.25} className="opacity-40 transition-transform group-hover:translate-x-0.5" />
    </button>
  );

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
          // Sombra copiada literalmente do card "Personalizar loja"
          // (StoreExplorationGuide.tsx) — mesmo valor, sem adaptações.
          // O contorno também: `ring-1 ring-black/[0.035]` em vez de um
          // `border` sólido. O ring do guia é quase invisível (3.5% de
          // opacidade) — é a SOMBRA que define o limite do card, dando
          // aquele efeito "a flutuar". Um `border-zinc-200` (linha sólida,
          // bem visível) competia com a sombra e mudava a perceção dela
          // por completo, mesmo com o box-shadow sendo byte a byte igual.
          className="relative flex flex-col gap-3 rounded-xl bg-white p-3.5 shadow-[0_1px_0_rgba(15,23,42,0.06),0_6px_14px_-6px_rgba(15,23,42,0.13),0_16px_24px_-16px_rgba(15,23,42,0.07)] ring-1 ring-black/[0.035] sm:flex-row sm:items-center sm:gap-4 sm:p-4 sm:pr-12"
        >
          <div className="flex w-full items-start gap-3 sm:w-auto sm:items-center sm:gap-4">
            {/* Thumbnail — sempre o mesmo elemento <img>, do início (blob local)
                ao fim (URL CDN). Nunca troca de tipo de elemento nem de
                componente: só o `src` muda quando resolvePublish termina, o
                que o browser resolve pintando a imagem nova por cima da
                anterior sem desmontar nada — por isso não há "piscar" nem
                salto de layout entre a versão a carregar e a versão final. */}
            <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-[10px] border border-zinc-200 bg-zinc-100 sm:h-16 sm:w-16">
              {foto && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={foto} alt="" className="h-full w-full object-cover" />
              )}
            </div>

            {/* Texto + CTA (mobile) na MESMA coluna — é isto que alinha o
            botão com o texto em vez de com a imagem. Antes o botão vivia
            fora deste bloco, como irmão direto da linha imagem+texto, por
            isso a sua margem esquerda começava no canto do card (à altura
            da imagem), não onde o texto começa. */}
            <div className="min-w-0 flex-1">
              {/* Texto — fixo desde o instante em que o banner aparece até ao
                  fim; não depende de nome/preço chegarem, por isso é
                  exatamente igual "a carregar" e "carregado". `pr-8` só
                  no título: é a única linha à altura do X (canto superior
                  direito) — reservar esse espaço no card inteiro (como
                  era antes) tirava largura da descrição sem necessidade,
                  fazendo "visitantes" cair para uma 3ª linha à toa. */}
              <p className="pr-8 text-[13.5px] font-bold leading-tight text-zinc-900 sm:pr-0">
                Seu primeiro produto está no ar
              </p>
              <p className="mt-0.5 text-[12px] font-medium leading-snug text-zinc-500">
                Sua loja já está pronta para receber visitantes.
              </p>

              {/* CTA — versão mobile, dentro da coluna de texto (ver acima).
              Escondida em ecrãs sm: onde existe uma segunda cópia fora
              deste bloco, ao lado do conteúdo em vez de abaixo dele. */}
              <div className="mt-3 sm:hidden">{cta}</div>
            </div>
          </div>

          {/* CTA — versão desktop/tablet, ao lado do conteúdo (sm:ml-auto
          empurra para a direita da linha). Nas telas onde este layout se
          aplica o botão nunca ficou desalinhado da imagem — o pedido do
          lojista era só sobre a coluna no mobile — por isso aqui mantém-se
          como irmão da linha imagem+texto, tal como antes. */}
          <div className="hidden sm:contents">{cta}</div>

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

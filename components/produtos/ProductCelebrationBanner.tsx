'use client';

import { ArrowRight, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { usePublishing } from '@/components/produtos/PublishingContext';
import { ELEVATED_SURFACE } from '@/components/ui/Surfaces';
import { dispensarMarco } from '@/lib/mutations/lojaMarcos';
import { cn } from '@/lib/cn';
import { getProductUrl, getStoreUrl } from '@/lib/storeUrl';

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
 * Banner discreto no topo da página Produtos, exibido logo após a
 * PRIMEIRA publicação da loja terminar com sucesso — e só ela (ver
 * `souPrimeiroProduto`/`celebrar` em ProductForm/PublishingContext).
 * Fica visível junto à lista (nunca por cima dela) e confirma, de forma
 * neutra e profissional, que a loja está pronta para receber visitantes.
 *
 * Duas fontes possíveis de dados, nunca ambas ao mesmo tempo:
 *
 * 1. `celebration` (PublishingContext) — fluxo AO VIVO: o card acabou de
 *    nascer, ainda nesta sessão, porque o lojista publicou agora mesmo o
 *    seu primeiro produto. Anima a entrada (ver `REVEAL_DELAY_MS`/`open`).
 *
 * 2. `persisted` (prop, vindo do marco 'primeiro_produto' em `loja_marcos`
 *    — ver migration_loja_marcos.sql) — o lojista publicou o primeiro
 *    produto numa visita anterior, saiu, e voltou à página Produtos
 *    agora. O card deve continuar visível (regra 2 do fluxo), mas SEM
 *    repetir a animação de entrada — nasce já aberto.
 *
 * Fechar (X) ou clicar "Ver minha loja" chama `dispensarMarco` para
 * gravar o marco 'primeiro_produto' como dispensado na base de dados —
 * só assim o card fica mesmo fechado para sempre (regras 3 e 4), em vez
 * de voltar a aparecer no próximo carregamento da página. A base de
 * dados também fecha-o sozinha (via trigger) assim que existir um 2º
 * produto publicado (regra 5) — isso já não passa por aqui, mas o
 * efeito na próxima visita é o mesmo: `persisted` chega `null`.
 */
export function ProductCelebrationBanner({
  lojaId,
  lojaSlug,
  persisted,
}: {
  lojaId: string;
  lojaSlug?: string;
  persisted: { produtoId: string; foto: string | null } | null;
}) {
  const { celebration, clearCelebration } = usePublishing();
  // Se as duas fontes coexistissem (não deveria acontecer — `persisted` só
  // fica preenchido ANTES do lojista publicar, e o publish ao vivo só
  // acontece quando `souPrimeiroProduto` já sabia que ainda não havia
  // celebração), o fluxo ao vivo ganha, por ser o mais recente.
  const isLive = celebration !== null;
  const isPersisted = !isLive && persisted !== null;
  const [dismissedLocally, setDismissedLocally] = useState(false);
  const visivel = (isLive || isPersisted) && !dismissedLocally;

  // Persistido nasce já aberto/sem corte (não há animação de entrada a
  // fazer); ao vivo nasce fechado, como antes, para a sequência de
  // REVEAL_DELAY_MS + expansão continuar a acontecer.
  const [open, setOpen] = useState(isPersisted);
  // Enquanto a animação de entrada decorre, o wrapper interno precisa de
  // overflow: hidden (é o que permite a caixa crescer de 0fr até 1fr sem
  // que o conteúdo "vaze" antes de haver espaço para ele). Mas depois de
  // completa, esse overflow: hidden continua a cortar a sombra do card
  // (a camada mais suave "sai" alguns pixels fora da caixa para se ver
  // corretamente) — por isso desligamo-lo assim que a transição termina.
  // Ao fechar, volta a ligar-se de imediato para a animação de saída
  // (colapso) voltar a funcionar. O persistido já nasce sem corte, pois
  // nunca passa pela transição de entrada.
  const [clipOverflow, setClipOverflow] = useState(!isPersisted);
  const containerRef = useRef<HTMLDivElement>(null);

  // Dados imediatos — disponíveis desde startPublish, sem esperar rede
  // (fluxo ao vivo); ou já definitivos, vindos do servidor (persistido).
  const fotoBlob   = celebration?.fotoPreview ?? null;
  // Foto CDN — só disponível após resolvePublish; enquanto não chega usa o blob local.
  const fotoCdn    = celebration?.foto ?? persisted?.foto ?? null;
  const foto       = fotoCdn ?? fotoBlob;
  // produtoId — null enquanto upload/insert decorrem; link só aparece quando estiver pronto.
  const produtoId  = celebration?.produtoId ?? persisted?.produtoId ?? null;

  useEffect(() => {
    // Só o fluxo AO VIVO anima a entrada. O persistido já nasceu com
    // `open` true (ver useState acima) — não há nada a animar aqui.
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

  // Grava a dispensa do marco 'primeiro_produto' na base de dados —
  // chamado tanto pelo "X" como por "Ver minha loja" (regras 3 e 4: ambos
  // fecham para sempre). Fire-and-forget de propósito: a UI já fecha
  // localmente de imediato (via `fechar()`/`dismissedLocally`); se este
  // pedido falhar silenciosamente por perda de rede, o pior cenário é o
  // card voltar a aparecer na próxima visita, nunca travar o fecho local
  // que o lojista já viu.
  function persistirDispensa() {
    dispensarMarco(lojaId, 'primeiro_produto').catch(() => {});
  }

  function fechar() {
    persistirDispensa();
    setClipOverflow(true); // volta a cortar antes de colapsar (sem isto o conteúdo "vazava")
    setOpen(false); // dispara a animação de saída (colapso + fade)
    setTimeout(() => {
      setDismissedLocally(true);
      clearCelebration();
    }, DURATION_MS);
  }

  if (!visivel) return null;

  // Definido uma vez, usado em dois pontos da árvore (mobile: dentro da
  // coluna de texto; desktop/tablet: ao lado do conteúdo) — ver comentários
  // junto a cada `{cta}` abaixo sobre o motivo de existirem duas posições.
  const cta = lojaSlug ? (
    <a
      href={produtoId ? getProductUrl(lojaSlug, produtoId) : getStoreUrl(lojaSlug)}
      target="_blank"
      rel="noopener noreferrer"
      // Abre a loja numa nova aba (o dashboard continua aqui) MAS já
      // regista a dispensa e fecha localmente de imediato — regra 3:
      // "quando voltar ao dashboard, o card não deve mais aparecer".
      // Sem isto, esta aba continuaria a mostrar o card até um reload.
      onClick={() => {
        persistirDispensa();
        setClipOverflow(true);
        setOpen(false);
        setTimeout(() => setDismissedLocally(true), DURATION_MS);
      }}
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
      onTransitionEnd={(e) => {
        // Só nos interessa o fim da transição de altura desta própria div
        // (evita reagir a transições de opacidade/transform que borbulham
        // do conteúdo lá dentro). E só desligamos o corte quando a
        // animação que terminou foi a de ABRIR — se foi a de fechar,
        // `clipOverflow` já está true (definido em fechar()) e deve
        // continuar assim.
        if (e.target === containerRef.current && e.propertyName === 'grid-template-rows' && open) {
          setClipOverflow(false);
        }
      }}
    >
      <div style={{ overflow: clipOverflow ? 'hidden' : 'visible', minHeight: 0 }}>
        <div
          style={{
            opacity: open ? 1 : 0,
            transform: open ? 'translateY(0)' : 'translateY(-12px)',
            transition: `opacity ${DURATION_MS}ms ${EASE}, transform ${DURATION_MS}ms ${EASE}`,
          }}
          // Superfície partilhada com o card guia — MESMA constante
          // (ELEVATED_SURFACE, não a variante compacta) para que a sombra e
          // a "linha de baixo" fiquem visualmente idênticas às do card guia
          // e o banner flutue da mesma forma. Só o raio (rounded-xl,
          // compacto) e o padding/layout continuam próprios deste banner.
          className={cn(
            'relative flex flex-col gap-3 rounded-xl p-3.5 sm:flex-row sm:items-center sm:gap-4 sm:p-4 sm:pr-12',
            ELEVATED_SURFACE,
          )}
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

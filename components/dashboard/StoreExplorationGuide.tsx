'use client';

import { useState } from 'react';
import Link from 'next/link';
import { X } from 'lucide-react';
import { ELEVATED_SURFACE } from '@/components/ui/Surfaces';
import { useToast } from '@/components/ui/Toast';
import { dispensarMarco, marcarMarcoConcluido } from '@/lib/mutations/lojaMarcos';
import { ORDEM_MARCOS_ONBOARDING, type LojaMarco, type MarcoOnboarding } from '@/types/database';
import { cn } from '@/lib/cn';

const cta =
  'inline-flex items-center gap-1.5 h-9 px-4 rounded-full bg-white text-ink text-[12px] font-semibold tracking-tight border border-slate-200 shadow-[0_2px_10px_rgba(15,23,42,0.06)] transition-all hover:bg-slate-50 hover:border-slate-300 active:scale-[0.97] self-start whitespace-nowrap';

/**
 * Ilustração do card "Pagamentos" — foto com os métodos de pagamento
 * suportados (Visa/Mastercard + mkesh/e-Mola/m-pesa), hospedada em
 * i.ibb.co, mesmo padrão dos outros marcos.
 */
const PAGAMENTOS_ICON = '/images/pagamentos.webp';

interface ItemConfig {
  eyebrow: string;
  title: string;
  subtitle: string;
  ctaLabel: string;
  href?: string;
  onAction?: () => void;
  image: string;
  imageClassName: string;
  imageWrapperClassName: string;
  contentWidthClassName: string;
  titleClassName?: string;
  subtitleClassName?: string;
}

/**
 * Copy/visual de cada marco — puramente apresentação. A decisão de QUAL
 * marco mostrar vem inteiramente de `loja_marcos` (ver `proximoMarco` em
 * StoreExplorationGuide) — esta função nunca decide visibilidade, só
 * como desenhar o marco que já foi escolhido.
 */
function getItemConfig(marco: MarcoOnboarding, handleShare: () => void, handlePagamentos: () => void): ItemConfig {
  switch (marco) {
    case 'primeiro_produto':
      return {
        eyebrow: 'Comece por aqui',
        title: 'Adicione seu primeiro produto',
        subtitle: 'Comece a construir seu catálogo.',
        ctaLabel: 'Criar produto',
        href: '/produtos/novo',
        image: 'https://i.ibb.co/kg0TN94W/1-4.png',
        imageClassName: 'h-full w-full object-contain object-right',
        imageWrapperClassName: 'right-0 top-2 bottom-2 w-[42%] max-w-[176px]',
        contentWidthClassName: 'w-[68%]',
        subtitleClassName: 'max-w-[210px]',
      };
    case 'personalizar_loja':
      return {
        eyebrow: 'Personalização',
        title: 'Personalize sua loja',
        subtitle: 'Ajuste a aparência da sua loja.',
        ctaLabel: 'Personalizar',
        href: '/loja',
        image: '/images/personalizar-loja.jpg',
        imageClassName: 'h-full w-full scale-[1.22] object-contain object-right',
        imageWrapperClassName: 'right-4 top-4 bottom-4 w-[40%] max-w-[160px]',
        contentWidthClassName: 'w-[54%]',
        subtitleClassName: 'max-w-[210px]',
      };
    case 'partilhar_loja':
      return {
        eyebrow: 'Divulgação',
        title: 'Compartilhe sua loja',
        subtitle: 'Facilite o acesso dos seus clientes.',
        ctaLabel: 'Compartilhar',
        onAction: handleShare,
        image: '/images/divulgacao.webp',
        imageClassName: 'h-full w-full translate-y-1 object-contain object-right',
        imageWrapperClassName: 'right-6 top-2 bottom-2 w-[36%] max-w-[144px]',
        contentWidthClassName: 'w-[54%]',
        subtitleClassName: 'max-w-[210px]',
      };
    case 'configurar_pagamentos':
      return {
        eyebrow: 'Pagamentos',
        title: 'Adicione métodos de pagamento',
        subtitle: 'Comece a receber pagamentos na sua loja.',
        ctaLabel: 'Adicionar',
        onAction: handlePagamentos,
        image: PAGAMENTOS_ICON,
        imageClassName: 'h-full w-full object-contain object-right',
        imageWrapperClassName: 'right-4 top-2 bottom-2 w-[40%] max-w-[160px]',
        contentWidthClassName: 'w-[54%]',
        subtitleClassName: 'max-w-[210px]',
      };
  }
}

/**
 * Guia de onboarding da Início — mostra SEMPRE só o próximo passo
 * relevante (nunca uma lista com itens "concluídos"). A fonte da verdade
 * é `loja_marcos` (ver migration_loja_marcos.sql): assim que um marco
 * fica com `concluido_em` preenchido OU `dispensado = true`, ele nunca
 * mais aparece aqui — o próximo da fila (`ORDEM_MARCOS_ONBOARDING`) toma
 * o lugar automaticamente. Quando não sobra nenhum, a secção inteira
 * desaparece (não há "tudo concluído!" a mostrar).
 *
 * Note-se que 'primeiro_produto' é o MESMO marco usado pelo banner "Seu
 * primeiro produto está no ar" na página Produtos (ProductCelebrationBanner)
 * — ambos leem/escrevem a mesma linha em `loja_marcos`, porque representam
 * o mesmo acontecimento real. Publicar o primeiro produto conclui os dois
 * ao mesmo tempo (este card e o gatilho do banner), sem duplicar estado.
 */
export function StoreExplorationGuide({
  lojaId,
  storeUrl,
  storeName,
  marcos,
}: {
  lojaId: string;
  storeUrl: string | null;
  storeName: string;
  /** Marcos já atingidos/dispensados desta loja (ver getLojaMarcos). */
  marcos: Partial<Record<MarcoOnboarding, LojaMarco>>;
}) {
  const { show } = useToast();
  const [closing, setClosing] = useState(false);
  // Dispensas/conclusões feitas NESTA sessão, antes de o servidor ser
  // relido — sem isto, o card ficaria visível até ao próximo
  // router.refresh(), mesmo já tendo sido fechado/concluído.
  const [marcosLocais, setMarcosLocais] = useState<
    Partial<Record<MarcoOnboarding, { concluido?: boolean; dispensado?: boolean }>>
  >({});

  const proximoMarco = ORDEM_MARCOS_ONBOARDING.find((m) => {
    const concluido = Boolean(marcos[m]?.concluido_em) || marcosLocais[m]?.concluido;
    const dispensado = Boolean(marcos[m]?.dispensado) || marcosLocais[m]?.dispensado;
    return !concluido && !dispensado;
  });

  async function handleShare() {
    if (!storeUrl) return;
    try {
      if (navigator.share) {
        await navigator.share({ title: storeName, url: storeUrl });
      } else {
        await navigator.clipboard.writeText(storeUrl);
        show('Link da loja copiado.');
      }
      setMarcosLocais((prev) => ({ ...prev, partilhar_loja: { concluido: true } }));
      marcarMarcoConcluido(lojaId, 'partilhar_loja').catch(() => {});
    } catch {
      // utilizador cancelou a partilha — não é um erro a comunicar
    }
  }

  // Sem página de configuração de pagamentos real ainda (ver
  // PagamentosCard.tsx/resolvePagamentosCard — gateway/Marketplace
  // continuam simulados) — por isso este botão só avisa por agora, em
  // vez de navegar para um link morto ou marcar o marco como concluído
  // sem o vendedor ter feito nada de facto (mesmo padrão de
  // OnboardingSteps.tsx).
  function handlePagamentos() {
    show('A configuração de pagamentos chega em breve.');
  }

  function handleDismiss(marco: MarcoOnboarding) {
    setClosing(true);
    dispensarMarco(lojaId, marco).catch(() => {});
    setTimeout(() => {
      setMarcosLocais((prev) => ({ ...prev, [marco]: { dispensado: true } }));
      setClosing(false);
    }, 200);
  }

  if (!proximoMarco) return null;

  const item = getItemConfig(proximoMarco, handleShare, handlePagamentos);

  const content = (
    // `style` (não só `className`) para o corte/tamanho do card já valer
    // no primeiro paint — em ligação lenta o HTML pinta antes do CSS
    // terminar de carregar, e sem isto a imagem aparece "crua" (sem
    // overflow-hidden nem tamanho) por uma fração de segundo, parecendo
    // saltar para fora do card, até o stylesheet aplicar.
    // `@container` faz o card virar a referência de tamanho para o
    // título/subtítulo (via `cqw` abaixo) — assim texto e imagem
    // escalam sempre JUNTOS, proporcionalmente ao card, independente do
    // tamanho real da tela ou de zoom/acessibilidade do aparelho.
    // `max-w-[560px] mx-auto` evita que o card fique gigante e
    // desequilibrado em ecrãs muito largos (tablet/desktop).
    <div
      className={cn('relative mx-auto min-h-[192px] w-full max-w-[560px] overflow-hidden rounded-[28px] p-3.5 sm:p-4 @container', ELEVATED_SURFACE)}
      style={{ overflow: 'hidden', borderRadius: 28, minHeight: 192 }}
    >
      {/* Dispensar este passo — passa automaticamente para o próximo da fila */}
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          handleDismiss(proximoMarco);
        }}
        aria-label="Dispensar"
        className="absolute right-3 top-3 z-20 flex h-7 w-7 items-center justify-center text-slate-500 transition-colors hover:text-ink active:scale-95"
      >
        <X size={13} strokeWidth={2.5} />
      </button>

      {/* Conteúdo: eyebrow → título → descrição → CTA */}
      <div
        className={cn('relative z-10 flex h-full min-h-[130px] flex-col items-start', item.contentWidthClassName)}
        style={{ minHeight: 130 }}
      >
        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">{item.eyebrow}</p>

        <div className="mt-1.5">
          {/* clamp(mínimo, %-da-largura-do-card, máximo): nunca fica
          minúsculo nem gigante, e acompanha o card em vez do viewport */}
          <p className={cn('text-[clamp(13px,4.6cqw,17px)] font-bold leading-[1.15] tracking-[-0.02em] text-ink whitespace-nowrap', item.titleClassName)}>
            {item.title}
          </p>
          <p className={cn('mt-1.5 text-[clamp(10.5px,3.2cqw,12.5px)] font-medium leading-[1.4] text-slate-400', item.subtitleClassName)}>
            {item.subtitle}
          </p>
        </div>

        <span className={cn(cta, 'mt-auto')}>{item.ctaLabel}</span>
      </div>

      {/* Área visual à direita */}
      <div
        className={cn('absolute flex items-center justify-center overflow-hidden rounded-[22px]', item.imageWrapperClassName)}
        style={{ overflow: 'hidden', borderRadius: 22 }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={item.image} alt="" className={item.imageClassName} style={{ width: '100%', height: '100%' }} decoding="async" />
      </div>
    </div>
  );

  return (
    <section
      className={cn(
        'flex flex-col gap-8 pt-2 sm:pt-3 transition-all duration-200 ease-out',
        closing ? 'opacity-0 -translate-y-1' : 'opacity-100'
      )}
    >
      <div className="px-1 pt-1">
        <h2 className="font-display text-2xl sm:text-3xl font-extrabold text-ink tracking-tight">
          Bem-vindo à sua loja
        </h2>
        <p className="mt-1.5 text-2xl sm:text-3xl font-medium text-slate-500 tracking-tight">
          Continue por aqui.
        </p>
      </div>

      {item.href ? (
        <Link href={item.href} className="block transition-transform active:scale-[0.99]">
          {content}
        </Link>
      ) : (
        <button type="button" onClick={item.onAction} className="block w-full text-left transition-transform active:scale-[0.99]">
          {content}
        </button>
      )}
    </section>
  );
}

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { X } from 'lucide-react';
import { ELEVATED_SURFACE } from '@/components/ui/Surfaces';
import { useToast } from '@/components/ui/Toast';
import { dispensarMarco, marcarMarcoConcluido } from '@/lib/mutations/lojaMarcos';
import type { MarcoOnboarding } from '@/types/database';
import { cn } from '@/lib/cn';

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

const cta =
  'inline-flex items-center gap-1.5 h-9 px-4 rounded-full bg-white text-ink text-[12px] font-semibold tracking-tight border border-slate-200 shadow-[0_2px_10px_rgba(15,23,42,0.06)] transition-all hover:bg-slate-50 hover:border-slate-300 active:scale-[0.97] self-start whitespace-nowrap';

/**
 * Ilustração do card "Pagamentos" — foto com os métodos de pagamento
 * suportados (Visa/Mastercard + mkesh/e-Mola/m-pesa), hospedada em
 * i.ibb.co, mesmo padrão dos outros marcos.
 */
const PAGAMENTOS_ICON = '/images/pagamentos.webp';

/**
 * Design original dos cards ilustrados (mesmo que já existia, com as
 * mesmas imagens) — não é um redesign, é o MESMO visual de sempre, só
 * reaproveitado aqui para poder aparecer mais que um de cada vez (ver
 * OnboardingSteps abaixo). Nunca trocar por um estilo novo sem pedido
 * explícito — ver histórico da conversa sobre "não mexer no design".
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
        subtitle: 'Deixe sua loja com a sua identidade e do seu jeito.',
        ctaLabel: 'Personalizar',
        href: '/loja',
        image: '/images/personalizar-loja.webp',
        imageClassName: 'h-full w-full object-contain object-right',
        imageWrapperClassName: 'right-3 top-2 bottom-2 w-[52%] max-w-[208px]',
        contentWidthClassName: 'w-[48%]',
        subtitleClassName: 'max-w-[210px]',
      };
    case 'configurar_pagamentos':
      return {
        eyebrow: 'Pagamentos',
        title: 'Adicione pagamentos',
        subtitle: 'Escolha como seus clientes poderão pagar na sua loja.',
        ctaLabel: 'Adicionar',
        onAction: handlePagamentos,
        image: PAGAMENTOS_ICON,
        imageClassName: 'h-full w-full object-contain object-right',
        imageWrapperClassName: 'right-3 top-2 bottom-2 w-[40%] max-w-[160px]',
        contentWidthClassName: 'w-[54%]',
        subtitleClassName: 'max-w-[210px]',
      };
    case 'partilhar_loja':
      return {
        eyebrow: 'Divulgação',
        title: 'Compartilhe sua loja',
        subtitle: 'Compartilhe sua loja e facilite o acesso dos seus clientes.',
        ctaLabel: 'Compartilhar',
        onAction: handleShare,
        image: '/images/divulgacao.webp',
        imageClassName: 'h-full w-full object-contain object-right',
        imageWrapperClassName: 'right-4 top-4 bottom-1 w-[38%] max-w-[152px]',
        contentWidthClassName: 'w-[54%]',
        subtitleClassName: 'max-w-[210px]',
      };
  }
}

/**
 * Cards de "próximos passos" — MESMO visual ilustrado que já existia
 * (getItemConfig acima é literalmente o mesmo conteúdo/imagens de
 * antes), só que agora capaz de empilhar mais de um ao mesmo tempo
 * quando restam 2-3 marcos, em vez de mostrar sempre só um (era essa a
 * parte estrutural que mudou nesta conversa, não o desenho do card).
 */
export function OnboardingSteps({
  lojaId,
  storeUrl,
  storeName,
  marcos,
  heading,
}: {
  lojaId: string;
  storeUrl: string | null;
  storeName: string;
  marcos: MarcoOnboarding[];
  heading: string;
}) {
  const { show } = useToast();
  const [ocultosLocalmente, setOcultosLocalmente] = useState<Set<MarcoOnboarding>>(new Set());

  const visiveis = marcos.filter((m) => !ocultosLocalmente.has(m));

  async function handleShare() {
    if (!storeUrl) return;
    try {
      if (navigator.share) {
        await navigator.share({ title: storeName, url: storeUrl });
      } else {
        await navigator.clipboard.writeText(storeUrl);
        show('Link da loja copiado.');
      }
      setOcultosLocalmente((prev) => new Set(prev).add('partilhar_loja'));
      marcarMarcoConcluido(lojaId, 'partilhar_loja').catch(() => {});
    } catch {
      // usuário cancelou a partilha — não é um erro a comunicar
    }
  }

  // Sem página de configuração de pagamentos real ainda (ver
  // PagamentosCard.tsx/resolvePagamentosCard — gateway/Marketplace
  // continuam simulados) — por isso este botão só avisa por agora, em
  // vez de navegar para um link morto ou marcar o marco como concluído
  // sem o vendedor ter feito nada de facto. Trocar por `href: '/pagamentos'`
  // assim que essa página existir (mesmo padrão do 'primeiro_produto'
  // e 'personalizar_loja' acima).
  function handlePagamentos() {
    show('A configuração de pagamentos chega em breve.');
  }

  function handleDismiss(marco: MarcoOnboarding) {
    dispensarMarco(lojaId, marco).catch(() => {});
    setOcultosLocalmente((prev) => new Set(prev).add(marco));
  }

  if (visiveis.length === 0) return null;

  return (
    <div>
      <h2 className="mb-3 px-1 text-[13px] font-bold uppercase tracking-[0.08em] text-slate-400">{heading}</h2>
      <div className="flex flex-col gap-4">
        {visiveis.map((marco) => {
          const item = getItemConfig(marco, handleShare, handlePagamentos);

          const content = (
            // `@container` + `cqw` (ver comentário igual em
            // StoreExplorationGuide.tsx): título/subtítulo escalam com a
            // largura do PRÓPRIO card, não do viewport — ficam sempre
            // equilibrados com a imagem, em qualquer tela/zoom.
            <div
              className={cn('relative mx-auto min-h-[192px] w-full max-w-[560px] overflow-hidden rounded-[28px] p-3.5 sm:p-4 @container', ELEVATED_SURFACE)}
              style={{ overflow: 'hidden', borderRadius: 28, minHeight: 192 }}
            >
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleDismiss(marco);
                }}
                aria-label="Dispensar"
                className="absolute right-3 top-3 z-20 flex h-7 w-7 items-center justify-center text-slate-500 transition-colors hover:text-ink active:scale-95"
              >
                <X size={13} strokeWidth={2.5} />
              </button>

              <div
                className={cn('relative z-10 flex h-full min-h-[130px] flex-col items-start', item.contentWidthClassName)}
                style={{ minHeight: 130 }}
              >
                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">{item.eyebrow}</p>

                <div className="mt-1.5">
                  <p className={cn('text-[clamp(13px,4.6cqw,17px)] font-bold leading-[1.15] tracking-[-0.02em] text-ink whitespace-nowrap', item.titleClassName)}>
                    {item.title}
                  </p>
                  <p className={cn('mt-1.5 text-[clamp(11.5px,3.5cqw,13.5px)] font-medium leading-[1.4] text-slate-500', item.subtitleClassName)}>
                    {item.subtitle}
                  </p>
                </div>

                <span className={cn(cta, 'mt-auto')}>{item.ctaLabel}</span>
              </div>

              <div
                className={cn('absolute flex items-center justify-center overflow-hidden rounded-[22px]', item.imageWrapperClassName)}
                style={{ overflow: 'hidden', borderRadius: 22 }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={item.image} alt="" className={item.imageClassName} style={{ width: '100%', height: '100%' }} decoding="async" />
              </div>
            </div>
          );

          return item.href ? (
            <Link key={marco} href={item.href} className="block transition-transform active:scale-[0.99]">
              {content}
            </Link>
          ) : (
            <button key={marco} type="button" onClick={item.onAction} className="block w-full text-left transition-transform active:scale-[0.99]">
              {content}
            </button>
          );
        })}
      </div>
    </div>
  );
}

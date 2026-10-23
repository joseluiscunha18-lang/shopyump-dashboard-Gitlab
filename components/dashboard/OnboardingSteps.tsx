'use client';

import { useState, memo, useCallback } from 'react';
import Link from 'next/link';
import { X } from 'lucide-react';
import { ELEVATED_SURFACE } from '@/components/ui/Surfaces';
import { useToast } from '@/components/ui/Toast';
import { dispensarMarco, marcarMarcoConcluido } from '@/lib/mutations/lojaMarcos';
import type { MarcoOnboarding } from '@/types/database';
import { cn } from '@/lib/cn';
import { asset } from '@/lib/domains';

interface ItemConfig {
  eyebrow: string;
  title: string;
  subtitle: string;
  ctaLabel: string;
  href?: string;
  onAction?: () => void;
  image: string;
  contentWidth: string;
  imgRight: string;
  imgTop: string;
  imgBottom: string;
  imgWidth: string;
  imgMaxWidth: string;
  imgScale?: number;
}

const cta =
  'inline-flex items-center gap-1.5 h-9 px-4 rounded-full bg-card text-foreground text-[13.5px] font-semibold tracking-tight border border-border shadow-xs transition-all hover:bg-muted hover:border-border active:scale-[0.97] self-start whitespace-nowrap';

const PAGAMENTOS_ICON = asset('/images/card-pagamentos-v2.png');

function getItemConfig(
  marco: MarcoOnboarding,
  handleShare: () => void,
  handlePagamentos: () => void,
): ItemConfig {
  switch (marco) {
    case 'primeiro_produto':
      return {
        eyebrow: 'Começa por aqui',
        title: 'Adiciona o teu primeiro produto',
        subtitle: 'Começa a construir o teu catálogo.',
        ctaLabel: 'Criar produto',
        href: '/produtos/novo',
        image: 'https://i.ibb.co/kg0TN94W/1-4.png',
        contentWidth: '58%',
        imgRight: '0px', imgTop: '8px', imgBottom: '8px',
        imgWidth: '42%', imgMaxWidth: '176px',
      };
    case 'personalizar_loja':
      return {
        eyebrow: 'Personalização',
        title: 'Personaliza a tua loja',
        subtitle: 'Adapta o visual à identidade do teu negócio.',
        ctaLabel: 'Personalizar →',
        href: '/personalizar',
        image: asset('/images/card-personalizar-loja-v3.png'),
        contentWidth: '52%',
        imgRight: '8px', imgTop: '12px', imgBottom: '12px',
        imgWidth: '44.65%', imgMaxWidth: '209px',
      };
    case 'configurar_pagamentos':
      return {
        eyebrow: 'Pagamentos',
        title: 'Configura os pagamentos',
        subtitle: 'Define as opções de pagamento disponíveis para a tua loja.',
        ctaLabel: 'Configurar →',
        href: '/configuracoes/pagamentos',
        image: PAGAMENTOS_ICON,
        contentWidth: '52%',
        imgRight: '10px', imgTop: '14px', imgBottom: '12px',
        imgWidth: '43%', imgMaxWidth: '182px',
      };
    case 'partilhar_loja':
      return {
        eyebrow: 'Divulgação',
        title: 'Divulga a tua loja',
        subtitle: 'Partilha o link e chega a mais clientes.',
        ctaLabel: 'Divulgar loja',
        href: '/divulgar',
        image: asset('/images/card-divulgacao-v2.png'),
        contentWidth: '54%',
        imgRight: '24px', imgTop: '16px', imgBottom: '4px',
        imgWidth: '38%', imgMaxWidth: '152px',
      };
  }
}

/**
 * Card individual memoizado — não re-renderiza quando o pai atualiza
 * (ex: outro card dispensado, contextos de nav mudam). Isso elimina o
 * flash da imagem que ocorria porque o React re-montava o <img>
 * desnecessariamente a cada re-render do componente pai.
 */
const OnboardingCard = memo(function OnboardingCard({
  marco,
  item,
  onDismiss,
}: {
  marco: MarcoOnboarding;
  item: ItemConfig;
  onDismiss: (m: MarcoOnboarding) => void;
}) {
  const content = (
    <div
      className={cn(
        'relative mx-auto min-h-[192px] w-full max-w-[560px] overflow-hidden rounded-[20px] p-3.5 sm:p-4 @container',
        ELEVATED_SURFACE,
        'shadow-[0_1px_0_rgba(15,23,42,0.10),0_6px_13px_-6px_rgba(15,23,42,0.10),0_15px_22px_-16px_rgba(15,23,42,0.06)]',
      )}
    >
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onDismiss(marco);
        }}
        aria-label="Dispensar"
        className="absolute right-2 top-1.5 z-20 flex h-8 w-8 items-center justify-center text-muted-foreground transition-colors hover:text-foreground active:scale-95"
      >
        <X size={17} strokeWidth={2.5} />
      </button>

      <div
        className="relative z-10 flex h-full min-h-[160px] flex-col items-start"
        style={{ width: item.contentWidth }}
      >
        <div className="my-auto pt-2 pb-4">
          <p className="whitespace-nowrap text-[clamp(12.5px,3.8cqw,18px)] font-bold leading-[1.15] tracking-[-0.02em] text-foreground">
            {item.title}
          </p>
          <p className="mt-1.5 max-w-[210px] text-[clamp(12.5px,3.8cqw,14.5px)] font-medium leading-[1.4] text-muted-foreground">
            {item.subtitle}
          </p>
        </div>
        {item.href ? <span className={cta}>{item.ctaLabel}</span> : <button type="button" className={cta} onClick={item.onAction}>{item.ctaLabel}</button>}
      </div>

      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={item.image}
        alt=""
        width={208}
        height={176}
        decoding="async"
        style={{
          position: 'absolute',
          right: item.imgRight,
          top: item.imgTop,
          bottom: item.imgBottom,
          width: item.imgWidth,
          maxWidth: item.imgMaxWidth,
          height: `calc(100% - ${item.imgTop} - ${item.imgBottom})`,
          objectFit: 'contain',
          objectPosition: 'right center',
          borderRadius: 14,
          transform: item.imgScale ? `scale(${item.imgScale})` : undefined,
          transformOrigin: 'right center',
        }}
      />
    </div>
  );

  return item.href ? (
    <Link href={item.href} className="block transition-transform active:scale-[0.99]">
      {content}
    </Link>
  ) : (
    <div className="block w-full text-left">
      {content}
    </div>
  );
});

export function OnboardingSteps({
  lojaId,
  storeUrl,
  storeName,
  marcos,
  heading,
  subtitle,
}: {
  lojaId: string;
  storeUrl: string | null;
  storeName: string;
  marcos: MarcoOnboarding[];
  heading: string;
  subtitle?: string;
}) {
  const { show } = useToast();
  const [ocultosLocalmente, setOcultosLocalmente] = useState<Set<MarcoOnboarding>>(new Set());

  const visiveis = marcos.filter((m) => !ocultosLocalmente.has(m));

  const handleShare = useCallback(async () => {
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
  }, [lojaId, storeUrl, storeName, show]);

  const handlePagamentos = useCallback(() => {
    show('A configuração de pagamentos chega em breve.');
  }, [show]);

  const handleDismiss = useCallback((marco: MarcoOnboarding) => {
    dispensarMarco(lojaId, marco).catch(() => {});
    setOcultosLocalmente((prev) => new Set(prev).add(marco));
  }, [lojaId]);

  if (visiveis.length === 0) return null;

  return (
    <div>
      <h2 className="px-1 text-[19px] font-bold tracking-tight text-foreground">{heading}</h2>
      {subtitle && <p className="mt-1 mb-4 px-1 text-[13px] font-medium text-muted-foreground">{subtitle}</p>}
      <div className={cn('flex flex-col gap-4', !subtitle && 'mt-4')}>
        {visiveis.map((marco) => (
          <OnboardingCard
            key={marco}
            marco={marco}
            item={getItemConfig(marco, handleShare, handlePagamentos)}
            onDismiss={handleDismiss}
          />
        ))}
      </div>
    </div>
  );
}

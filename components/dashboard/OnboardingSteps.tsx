'use client';

import { useState, memo, useCallback } from 'react';
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
  contentWidth: string;
  imgRight: string;
  imgTop: string;
  imgBottom: string;
  imgWidth: string;
  imgMaxWidth: string;
}

const cta =
  'inline-flex items-center gap-1.5 h-9 px-4 rounded-full bg-white text-ink text-[12px] font-semibold tracking-tight border border-slate-200 shadow-[0_2px_10px_rgba(15,23,42,0.06)] transition-all hover:bg-slate-50 hover:border-slate-300 active:scale-[0.97] self-start whitespace-nowrap';

const PAGAMENTOS_ICON = '/images/pagamentos.webp';

function getItemConfig(
  marco: MarcoOnboarding,
  handleShare: () => void,
  handlePagamentos: () => void,
): ItemConfig {
  switch (marco) {
    case 'primeiro_produto':
      return {
        eyebrow: 'Comece por aqui',
        title: 'Adicione seu primeiro produto',
        subtitle: 'Comece a construir seu catálogo.',
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
        title: 'Personalize sua loja',
        subtitle: 'Deixe sua loja com a sua identidade e do seu jeito.',
        ctaLabel: 'Personalizar',
        href: '/loja',
        image: '/images/personalizar-loja.webp',
        contentWidth: '48%',
        imgRight: '12px', imgTop: '8px', imgBottom: '8px',
        imgWidth: '52%', imgMaxWidth: '208px',
      };
    case 'configurar_pagamentos':
      return {
        eyebrow: 'Pagamentos',
        title: 'Adicione pagamentos',
        subtitle: 'Escolha como seus clientes poderão pagar na sua loja.',
        ctaLabel: 'Adicionar',
        onAction: handlePagamentos,
        image: PAGAMENTOS_ICON,
        contentWidth: '54%',
        imgRight: '20px', imgTop: '8px', imgBottom: '8px',
        imgWidth: '40%', imgMaxWidth: '160px',
      };
    case 'partilhar_loja':
      return {
        eyebrow: 'Divulgação',
        title: 'Compartilhe sua loja',
        subtitle: 'Compartilhe sua loja e facilite o acesso dos seus clientes.',
        ctaLabel: 'Compartilhar',
        onAction: handleShare,
        image: '/images/divulgacao.webp',
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
        'relative mx-auto min-h-[192px] w-full max-w-[560px] overflow-hidden rounded-[28px] p-3.5 sm:p-4 @container',
        ELEVATED_SURFACE,
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
        className="absolute right-3 top-3 z-20 flex h-7 w-7 items-center justify-center text-slate-500 transition-colors hover:text-ink active:scale-95"
      >
        <X size={13} strokeWidth={2.5} />
      </button>

      <div
        className="relative z-10 flex h-full min-h-[130px] flex-col items-start"
        style={{ width: item.contentWidth }}
      >
        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">
          {item.eyebrow}
        </p>
        <div className="mt-1.5">
          <p className="whitespace-nowrap text-[clamp(13px,4.6cqw,17px)] font-bold leading-[1.15] tracking-[-0.02em] text-ink">
            {item.title}
          </p>
          <p className="mt-1.5 max-w-[210px] text-[clamp(11.5px,3.5cqw,13.5px)] font-medium leading-[1.4] text-slate-500">
            {item.subtitle}
          </p>
        </div>
        <span className={cn(cta, 'mt-auto')}>{item.ctaLabel}</span>
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
          borderRadius: 22,
        }}
      />
    </div>
  );

  return item.href ? (
    <Link href={item.href} className="block transition-transform active:scale-[0.99]">
      {content}
    </Link>
  ) : (
    <button
      type="button"
      onClick={item.onAction}
      className="block w-full text-left transition-transform active:scale-[0.99]"
    >
      {content}
    </button>
  );
});

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
      <h2 className="mb-3 px-1 text-[13px] font-bold uppercase tracking-[0.08em] text-slate-400">
        {heading}
      </h2>
      <div className="flex flex-col gap-4">
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

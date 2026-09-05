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
const PAGAMENTOS_ICON = 'https://i.ibb.co/nNx7D7b1/5c4024db-9883-4a28-8ec5-40ee0db62766.webp';

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
        imageWrapperClassName: 'right-0 top-2 bottom-2 w-[50%] max-w-[204px]',
        contentWidthClassName: 'w-[62%]',
        titleClassName: 'max-w-[152px]',
        subtitleClassName: 'max-w-[160px]',
      };
    case 'personalizar_loja':
      return {
        eyebrow: 'Aparência',
        title: 'Personalize sua loja',
        subtitle: 'Ajuste a aparência e deixe sua loja com a sua identidade.',
        ctaLabel: 'Personalizar',
        href: '/loja',
        image: 'https://i.ibb.co/23rB4yJc/77824d49418a4ab693b33295fed6e239.png',
        imageClassName: 'h-full w-full translate-y-2 object-contain object-right',
        imageWrapperClassName: 'right-0 top-0 bottom-0 w-[65%] max-w-[262px]',
        contentWidthClassName: 'w-[42%]',
        subtitleClassName: 'max-w-[230px]',
      };
    case 'configurar_pagamentos':
      return {
        eyebrow: 'Pagamentos',
        title: 'Configure seus pagamentos',
        subtitle: 'Aceite pagamentos na sua loja e no marketplace de forma simples e rápida.',
        ctaLabel: 'Configurar',
        onAction: handlePagamentos,
        image: PAGAMENTOS_ICON,
        imageClassName: 'h-full w-full object-contain object-right',
        imageWrapperClassName: 'right-0 top-0 bottom-0 w-[52%] max-w-[212px]',
        contentWidthClassName: 'w-[46%]',
        subtitleClassName: 'max-w-[220px]',
      };
    case 'partilhar_loja':
      return {
        eyebrow: 'Divulgação',
        title: 'Compartilhe sua loja',
        subtitle: 'Divulgue sua loja e facilite o acesso dos seus clientes.',
        ctaLabel: 'Copiar link',
        onAction: handleShare,
        image: 'https://i.ibb.co/Gf4VYtpV/file-000000003fd081f4b4d9cdab95a4be2b.png',
        imageClassName: 'h-full w-full translate-y-3 scale-110 object-cover object-right',
        imageWrapperClassName: 'right-0 top-0 bottom-0 w-[59%] max-w-[238px]',
        contentWidthClassName: 'w-[58%]',
        titleClassName: 'whitespace-nowrap',
        subtitleClassName: 'max-w-[150px]',
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
            <div className={cn('relative min-h-[224px] w-full overflow-hidden rounded-[28px] p-4 sm:p-5', ELEVATED_SURFACE)}>
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

              <div className={cn('relative z-10 flex h-full min-h-[156px] flex-col items-start', item.contentWidthClassName)}>
                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">{item.eyebrow}</p>

                <div className="mt-2">
                  <p className={cn('text-[16px] sm:text-[17px] font-bold leading-[1.15] tracking-[-0.02em] text-ink', item.titleClassName)}>
                    {item.title}
                  </p>
                  <p className={cn('mt-2 text-[12px] sm:text-[12.5px] font-medium leading-[1.45] text-slate-400', item.subtitleClassName)}>
                    {item.subtitle}
                  </p>
                </div>

                <span className={cn(cta, 'mt-auto')}>{item.ctaLabel}</span>
              </div>

              <div className={cn('absolute flex items-center justify-center overflow-hidden rounded-[22px]', item.imageWrapperClassName)}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={item.image} alt="" className={item.imageClassName} />
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

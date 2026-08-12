'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Package, Store, Share2, Check, X } from 'lucide-react';
import { Card } from '@/components/ui/Surfaces';
import { useToast } from '@/components/ui/Toast';
import { cn } from '@/lib/cn';

type Tone = 'next' | 'default' | 'done';

interface GuideItem {
  id: string;
  title: string;
  subtitle: string;
  icon: React.ElementType;
  completed: boolean;
  ctaLabel: string;
  ctaLabelDone: string;
  href?: string;
  onAction?: () => void;
}

const cta =
  'inline-flex items-center gap-1.5 h-9 px-4 rounded-full bg-white text-ink text-[12px] font-semibold tracking-tight border border-slate-200 shadow-[0_2px_10px_rgba(15,23,42,0.06)] transition-all hover:bg-slate-50 hover:border-slate-300 active:scale-[0.97] self-start whitespace-nowrap';

const visualTone: Record<Tone, string> = {
  next: 'bg-[#EEF1F4]',
  default: 'bg-[#F7F8FA]',
  done: 'bg-[#EFFAF3]',
};

function dismissedKey(lojaId: string) {
  return `shopyump:guide:${lojaId}:dismissed`;
}
function shareKey(lojaId: string) {
  return `shopyump:guide:${lojaId}:partilhado`;
}

export function StoreExplorationGuide({
  lojaId,
  storeUrl,
  storeName,
  hasProduct,
  hasCustomized,
}: {
  lojaId: string;
  storeUrl: string | null;
  storeName: string;
  hasProduct: boolean;
  hasCustomized: boolean;
}) {
  const { show } = useToast();
  const [ready, setReady] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [closing, setClosing] = useState(false);
  const [partilhado, setPartilhado] = useState(false);

  useEffect(() => {
    try {
      setDismissed(localStorage.getItem(dismissedKey(lojaId)) === '1');
      setPartilhado(localStorage.getItem(shareKey(lojaId)) === '1');
    } catch {
      // localStorage indisponível — segue sem persistência
    } finally {
      setReady(true);
    }
  }, [lojaId]);

  function handleDismiss() {
    setClosing(true);
    try {
      localStorage.setItem(dismissedKey(lojaId), '1');
    } catch {
      // ignore
    }
    setTimeout(() => setDismissed(true), 200);
  }

  async function handleShare() {
    if (!storeUrl) return;
    try {
      if (navigator.share) {
        await navigator.share({ title: storeName, url: storeUrl });
      } else {
        await navigator.clipboard.writeText(storeUrl);
        show('Link da loja copiado.');
      }
      try {
        localStorage.setItem(shareKey(lojaId), '1');
      } catch {
        // ignore
      }
      setPartilhado(true);
    } catch {
      // utilizador cancelou a partilha — não é um erro a comunicar
    }
  }

  if (!ready || dismissed) return null;

  const items: GuideItem[] = [
    {
      id: 'produto',
      title: 'Adicione seu primeiro produto',
      subtitle: 'Comece a construir seu catálogo.',
      icon: Package,
      completed: hasProduct,
      ctaLabel: 'Criar produto',
      ctaLabelDone: 'Ver produtos',
      href: hasProduct ? '/produtos' : '/produtos/novo',
    },
    {
      id: 'personalizar',
      title: 'Personalize sua loja',
      subtitle: 'Ajuste a aparência e deixe sua loja com a sua identidade.',
      icon: Store,
      completed: hasCustomized,
      ctaLabel: 'Personalizar',
      ctaLabelDone: 'Editar loja',
      href: '/loja',
    },
    {
      id: 'compartilhar',
      title: 'Compartilhe sua loja',
      subtitle: 'Divulgue sua loja e facilite o acesso dos seus clientes.',
      icon: Share2,
      completed: partilhado,
      ctaLabel: 'Copiar link',
      ctaLabelDone: 'Partilhar de novo',
      onAction: handleShare,
    },
  ];

  const nextId = items.find((i) => !i.completed)?.id;

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
          Escolha por onde começar.
        </p>
      </div>

      <div className="flex flex-col gap-4">
        {items.map((item) => {
          const tone: Tone = item.completed ? 'done' : item.id === nextId ? 'next' : 'default';
          const Icon = item.icon;

          const content = (
            <div className="relative min-h-[224px] w-full overflow-hidden rounded-[28px] bg-white p-4 sm:p-5 shadow-[0_1px_2px_rgba(15,23,42,0.03),0_14px_24px_-16px_rgba(15,23,42,0.16),0_28px_44px_-28px_rgba(15,23,42,0.10)] ring-1 ring-black/[0.035]">
              {/* Dispensar toda a orientação — acessível a partir de qualquer cartão */}
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleDismiss();
                }}
                aria-label="Dispensar orientação"
                className="absolute right-3 top-3 z-20 flex h-7 w-7 items-center justify-center text-slate-500 transition-colors hover:text-ink active:scale-95"
              >
                <X size={13} strokeWidth={2.5} />
              </button>

              {/* Conteúdo: eyebrow → título → descrição → CTA */}
              <div className={cn('relative z-10 flex h-full min-h-[156px] flex-col items-start', item.id === 'personalizar' ? 'w-[42%]' : item.id === 'compartilhar' ? 'w-[58%]' : 'w-[62%]')}>
                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                  {item.completed ? 'Concluído' : item.id === 'produto' ? 'Comece por aqui' : item.id === 'personalizar' ? 'Aparência' : 'Divulgação'}
                </p>

                <div className="mt-2">
                  <p
                    className={cn(
                      'text-[16px] sm:text-[17px] font-bold leading-[1.15] tracking-[-0.02em] text-ink',
                      item.id === 'compartilhar' && 'whitespace-nowrap',
                      item.id === 'produto' && 'max-w-[165px]'
                    )}
                  >
                    {item.title}
                  </p>
                  <p
                    className={cn(
                      'mt-2 text-[12px] sm:text-[12.5px] font-medium leading-[1.45] text-slate-400',
                      item.id === 'compartilhar' ? 'max-w-[150px]' : item.id === 'produto' ? 'max-w-[175px]' : 'max-w-[230px]'
                    )}
                  >
                    {item.subtitle}
                  </p>
                </div>

                <span className={cn(cta, 'mt-auto')}>
                  {item.completed ? item.ctaLabelDone : item.ctaLabel}
                </span>
              </div>

              {/* Área visual à direita: mesma posição e proporção em todos os cards */}
              <div
                className={cn(
                  'absolute flex items-center justify-center overflow-hidden rounded-[22px] transition-colors',
                  item.id === 'produto'
                    ? 'right-0 top-0 bottom-0 w-[57%] max-w-[231px]'
                    : item.id === 'personalizar'
                      ? 'right-0 top-0 bottom-0 w-[65%] max-w-[262px]'
                      : item.id === 'compartilhar'
                        ? 'right-0 top-0 bottom-0 w-[59%] max-w-[238px]'
                        : 'right-3 top-3 bottom-3 w-[34%] max-w-[142px]',
                  item.id !== 'produto' && item.id !== 'personalizar' && item.id !== 'compartilhar' && visualTone[tone]
                )}
              >
                {item.id === 'produto' ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src="https://i.ibb.co/kg0TN94W/1-4.png"
                    alt=""
                    className="h-full w-full object-contain object-right"
                  />
                ) : item.id === 'personalizar' ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src="https://i.ibb.co/23rB4yJc/77824d49418a4ab693b33295fed6e239.png"
                    alt=""
                    className="h-full w-full translate-y-2 object-contain object-right"
                  />
                ) : item.id === 'compartilhar' ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src="https://i.ibb.co/gMhBnHGy/file-000000003fd081f4b4d9cdab95a4be2b.png"
                    alt=""
                    className="h-full w-full translate-y-3 scale-110 object-cover object-right"
                  />
                ) : (
                  <>
                    <div className="absolute -right-7 -top-7 h-24 w-24 rounded-full bg-white/60" />
                    <div className="absolute -bottom-8 -left-5 h-20 w-20 rounded-full bg-white/40" />
                    <div className="relative flex h-[86px] w-[86px] items-center justify-center rounded-[26px] bg-white/75 shadow-[0_8px_24px_rgba(15,23,42,0.06)] ring-1 ring-black/[0.025]">
                      <Icon
                        size={42}
                        strokeWidth={1.45}
                        className={cn(
                          tone === 'done' ? 'text-emerald-600' : tone === 'next' ? 'text-ink' : 'text-slate-500'
                        )}
                      />
                      {item.completed && (
                        <span className="absolute -right-1.5 -top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500 text-white ring-2 ring-white">
                          <Check size={12} strokeWidth={3} />
                        </span>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>
          );

          if (item.href) {
            return (
              <Link
                key={item.id}
                href={item.href}
                onClick={item.onAction}
                className="block transition-transform active:scale-[0.99]"
              >
                {content}
              </Link>
            );
          }

          return (
            <button
              key={item.id}
              type="button"
              onClick={item.onAction}
              className="block w-full text-left transition-transform active:scale-[0.99]"
            >
              {content}
            </button>
          );
        })}
      </div>
    </section>
  );
}

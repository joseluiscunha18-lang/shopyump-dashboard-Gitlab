'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Package, Store, Palette, Share2, Check, ChevronRight, X } from 'lucide-react';
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
  'inline-flex items-center gap-1.5 h-10 pl-5 pr-4 rounded-full text-[13px] font-bold tracking-wide transition-all active:scale-[0.97] self-start';
const ctaTone: Record<'primary' | 'secondary', string> = {
  primary: 'bg-ink text-white hover:bg-ink-soft',
  secondary: 'bg-white text-ink border border-slate-200 hover:bg-slate-50',
};

const badgeTone: Record<Tone, string> = {
  next: 'bg-brand-soft text-brand',
  default: 'bg-[#F4F1EC] text-slate-400',
  done: 'bg-emerald-50 text-emerald-500',
};
const ringTone: Record<Tone, string> = {
  next: 'border-brand/25',
  default: 'border-slate-200',
  done: 'border-emerald-200',
};

function dismissedKey(lojaId: string) {
  return `shopyump:guide:${lojaId}:dismissed`;
}
function temaKey(lojaId: string) {
  return `shopyump:guide:${lojaId}:tema-visitado`;
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
  const [temaVisitado, setTemaVisitado] = useState(false);
  const [partilhado, setPartilhado] = useState(false);

  useEffect(() => {
    try {
      setDismissed(localStorage.getItem(dismissedKey(lojaId)) === '1');
      setTemaVisitado(localStorage.getItem(temaKey(lojaId)) === '1');
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

  function markTemaVisitado() {
    try {
      localStorage.setItem(temaKey(lojaId), '1');
    } catch {
      // ignore
    }
    setTemaVisitado(true);
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
      id: 'tema',
      title: 'Escolha um tema',
      subtitle: 'Encontre um estilo que combine com a sua marca.',
      icon: Palette,
      completed: temaVisitado,
      ctaLabel: 'Escolher tema',
      ctaLabelDone: 'Alterar tema',
      href: '/loja?secao=tema',
      onAction: markTemaVisitado,
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
        'flex flex-col gap-4 transition-all duration-200 ease-out',
        closing ? 'opacity-0 -translate-y-1' : 'opacity-100'
      )}
    >
      <div className="flex items-start justify-between gap-4 px-1">
        <div>
          <h2 className="font-display text-lg sm:text-xl font-black text-ink tracking-tight">
            Comece a explorar sua loja
          </h2>
          <p className="mt-1 text-[12px] font-medium text-slate-400">
            Explore no seu ritmo — não existe ordem certa.
          </p>
        </div>
        <button
          type="button"
          onClick={handleDismiss}
          aria-label="Dispensar orientação"
          className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-slate-300 hover:text-slate-500 hover:bg-slate-100 transition-colors"
        >
          <X size={16} />
        </button>
      </div>

      <div className="flex flex-col gap-3">
        {items.map((item) => {
          const tone: Tone = item.completed ? 'done' : item.id === nextId ? 'next' : 'default';
          const Icon = item.icon;

          const content = (
            <>
              <div className="min-w-0 flex-1 flex flex-col justify-center gap-3 py-1">
                <div>
                  <p className="text-[16px] sm:text-[17px] font-black text-ink tracking-tight leading-snug">
                    {item.title}
                  </p>
                  <p className="text-[12.5px] font-medium text-slate-400 leading-relaxed mt-1.5 max-w-[220px]">
                    {item.subtitle}
                  </p>
                </div>
                <span className={cn(cta, tone === 'next' ? ctaTone.primary : ctaTone.secondary)}>
                  {item.completed ? item.ctaLabelDone : item.ctaLabel}
                  <ChevronRight size={14} />
                </span>
              </div>

              <div className="relative flex-shrink-0 w-[100px] h-[100px] sm:w-[112px] sm:h-[112px]">
                <div className={cn('absolute inset-0 rounded-full border transition-colors', ringTone[tone])} />
                <div
                  className={cn(
                    'absolute inset-[10px] rounded-full flex items-center justify-center transition-colors',
                    badgeTone[tone]
                  )}
                >
                  <Icon size={30} strokeWidth={1.6} />
                </div>
                {item.completed && (
                  <span className="absolute top-1 right-1 w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center ring-2 ring-white">
                    <Check size={12} strokeWidth={3} />
                  </span>
                )}
              </div>
            </>
          );

          const cardClass = 'flex items-center justify-between gap-4 p-5 sm:p-6 min-h-[152px] sm:min-h-[164px]';

          if (item.href) {
            return (
              <Link key={item.id} href={item.href} onClick={item.onAction} className="block">
                <Card className={cn(cardClass, 'transition-transform active:scale-[0.99]')}>{content}</Card>
              </Link>
            );
          }

          return (
            <button key={item.id} type="button" onClick={item.onAction} className="text-left">
              <Card className={cn(cardClass, 'w-full transition-transform active:scale-[0.99]')}>{content}</Card>
            </button>
          );
        })}
      </div>
    </section>
  );
}

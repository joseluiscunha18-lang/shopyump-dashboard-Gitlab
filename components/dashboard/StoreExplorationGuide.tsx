'use client';

import { useEffect, useState, type ReactNode } from 'react';
import Link from 'next/link';
import { Package, Store, Palette, Share2, Check, ChevronRight, X } from 'lucide-react';
import { Card } from '@/components/ui/Surfaces';
import { useToast } from '@/components/ui/Toast';
import { cn } from '@/lib/cn';

interface GuideItem {
  id: string;
  title: string;
  subtitle: string;
  icon: ReactNode;
  completed: boolean;
  href?: string;
  onAction?: () => void;
}

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
      // localStorage indisponível (modo privado, etc.) — segue sem persistência
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
    setTimeout(() => setDismissed(true), 220);
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
      icon: <Package size={18} strokeWidth={2} />,
      completed: hasProduct,
      href: '/produtos/novo',
    },
    {
      id: 'personalizar',
      title: 'Personalize sua loja',
      subtitle: 'Ajuste a aparência e deixe sua loja com a sua identidade.',
      icon: <Store size={18} strokeWidth={2} />,
      completed: hasCustomized,
      href: '/loja',
    },
    {
      id: 'tema',
      title: 'Escolha um tema',
      subtitle: 'Encontre um estilo que combine com a sua marca.',
      icon: <Palette size={18} strokeWidth={2} />,
      completed: temaVisitado,
      href: '/loja?secao=tema',
      onAction: markTemaVisitado,
    },
    {
      id: 'compartilhar',
      title: 'Compartilhe sua loja',
      subtitle: 'Divulgue sua loja e facilite o acesso dos seus clientes.',
      icon: <Share2 size={18} strokeWidth={2} />,
      completed: partilhado,
      onAction: handleShare,
    },
  ];

  const nextId = items.find((i) => !i.completed)?.id;

  return (
    <Card
      className={cn(
        'relative overflow-hidden p-5 sm:p-7 transition-all duration-200 ease-out',
        closing ? 'opacity-0 -translate-y-1' : 'opacity-100'
      )}
    >
      {/* Ambient wash — a quiet signature touch, not a loud gradient */}
      <div
        className="pointer-events-none absolute -top-20 -right-20 h-56 w-56 rounded-full opacity-[0.35] blur-3xl"
        style={{ background: 'var(--brand-soft)' }}
        aria-hidden
      />

      <div className="relative flex items-start justify-between gap-4 mb-5">
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

      <div className="relative flex flex-col divide-y divide-slate-100">
        {items.map((item) => {
          const isNext = item.id === nextId;
          const body = (
            <>
              <div
                className={cn(
                  'flex-shrink-0 w-11 h-11 rounded-2xl flex items-center justify-center transition-colors',
                  item.completed
                    ? 'bg-emerald-50 text-emerald-500'
                    : isNext
                      ? 'bg-ink text-white'
                      : 'bg-slate-50 text-slate-400'
                )}
              >
                {item.completed ? <Check size={18} strokeWidth={2.5} /> : item.icon}
              </div>
              <div className="min-w-0 flex-1">
                <p
                  className={cn(
                    'text-[13px] tracking-tight',
                    item.completed ? 'font-semibold text-slate-400' : isNext ? 'font-black text-ink' : 'font-bold text-ink'
                  )}
                >
                  {item.title}
                </p>
                <p className="text-[11px] font-medium text-slate-400 mt-0.5">{item.subtitle}</p>
              </div>
              <ChevronRight size={16} className="flex-shrink-0 text-slate-300" />
            </>
          );

          const rowClass = 'flex items-center gap-4 py-4 first:pt-0 last:pb-0 -mx-2 px-2 rounded-2xl transition-colors hover:bg-slate-50/70 active:scale-[0.99]';

          if (item.href) {
            return (
              <Link key={item.id} href={item.href} onClick={item.onAction} className={rowClass}>
                {body}
              </Link>
            );
          }

          return (
            <button key={item.id} type="button" onClick={item.onAction} className={cn(rowClass, 'text-left')}>
              {body}
            </button>
          );
        })}
      </div>
    </Card>
  );
}

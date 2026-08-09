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
  tag: string;
  title: string;
  subtitle: string;
  icon: React.ElementType;
  completed: boolean;
  ctaLabel: string;
  ctaLabelDone: string;
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
      tag: 'Passo 01 • Catálogo',
      title: 'Adicione o seu primeiro produto',
      subtitle: 'Comece a construir o catálogo e os itens da sua loja.',
      icon: Package,
      completed: hasProduct,
      ctaLabel: 'Criar produto',
      ctaLabelDone: 'Ver produtos',
      href: hasProduct ? '/produtos' : '/produtos/novo',
    },
    {
      id: 'personalizar',
      tag: 'Passo 02 • Identidade',
      title: 'Personalize a sua loja',
      subtitle: 'Ajuste a aparência e defina a identidade da sua marca.',
      icon: Store,
      completed: hasCustomized,
      ctaLabel: 'Personalizar',
      ctaLabelDone: 'Editar loja',
      href: '/loja',
    },
    {
      id: 'tema',
      tag: 'Passo 03 • Visual',
      title: 'Escolha um tema',
      subtitle: 'Encontre o estilo visual perfeito para encantar os clientes.',
      icon: Palette,
      completed: temaVisitado,
      ctaLabel: 'Escolher tema',
      ctaLabelDone: 'Alterar tema',
      href: '/loja?secao=tema',
      onAction: markTemaVisitado,
    },
    {
      id: 'compartilhar',
      tag: 'Passo 04 • Alcance',
      title: 'Partilhe a sua loja',
      subtitle: 'Divulgue o seu link e facilite o acesso aos seus clientes.',
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
            Comece a explorar a sua loja
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

      <div className="flex flex-col gap-3.5">
        {items.map((item) => {
          const tone: Tone = item.completed ? 'done' : item.id === nextId ? 'next' : 'default';
          const Icon = item.icon;

          const content = (
            <Card className="flex items-center justify-between gap-4 sm:gap-6 p-5 sm:p-6 rounded-[28px] bg-[#F7F7F6] border border-slate-200/60 shadow-none hover:border-slate-300 transition-all">
              {/* Bloco de Texto (Esquerda) */}
              <div className="flex-1 flex flex-col items-start min-w-0">
                <span className="text-[11px] sm:text-[12px] font-medium text-slate-400 tracking-tight leading-none mb-1">
                  {item.tag}
                </span>

                <h3 className="text-[15px] sm:text-[17px] font-black text-ink tracking-tight leading-snug">
                  {item.title}
                </h3>

                <p className="text-[12px] sm:text-[12.5px] font-medium text-slate-400 leading-snug mt-1.5 mb-4 max-w-[300px]">
                  {item.subtitle}
                </p>

                <span
                  className={cn(
                    'inline-flex items-center gap-1.5 h-9 px-5 rounded-full text-[12.5px] font-bold tracking-wide transition-all active:scale-[0.97]',
                    item.completed
                      ? 'bg-emerald-500 text-white hover:bg-emerald-600 shadow-sm'
                      : tone === 'next'
                      ? 'bg-ink text-white hover:bg-ink-soft shadow-sm'
                      : 'bg-white text-ink border border-slate-200 hover:bg-slate-50'
                  )}
                >
                  {item.completed ? item.ctaLabelDone : item.ctaLabel}
                  {item.completed ? <Check size={14} strokeWidth={2.5} /> : <ChevronRight size={14} strokeWidth={2.5} />}
                </span>
              </div>

              {/* Bloco de Imagem/Ícone com Arco Circular (Direita) */}
              <div className="relative flex-shrink-0 w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-white flex items-center justify-center p-3 shadow-sm border border-slate-100">
                {/* Arco de Progresso em SVG */}
                <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full -rotate-90">
                  {/* Círculo Base */}
                  <circle
                    cx="50"
                    cy="50"
                    r="44"
                    fill="none"
                    stroke="#E2E8F0"
                    strokeWidth="2.5"
                  />
                  {/* Arco Ativo */}
                  {item.completed ? (
                    <circle
                      cx="50"
                      cy="50"
                      r="44"
                      fill="none"
                      stroke="#10B981"
                      strokeWidth="3.5"
                      strokeDasharray="276.46"
                      strokeDashoffset="0"
                      strokeLinecap="round"
                    />
                  ) : tone === 'next' ? (
                    <circle
                      cx="50"
                      cy="50"
                      r="44"
                      fill="none"
                      stroke="#0F172A"
                      strokeWidth="3.5"
                      strokeDasharray="276.46"
                      strokeDashoffset="190"
                      strokeLinecap="round"
                    />
                  ) : null}
                </svg>

                {/* Ícone Centralizado */}
                <div
                  className={cn(
                    'w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center transition-colors',
                    item.completed
                      ? 'bg-emerald-50 text-emerald-600'
                      : tone === 'next'
                      ? 'bg-slate-100 text-ink'
                      : 'bg-slate-50 text-slate-400'
                  )}
                >
                  <Icon size={26} strokeWidth={1.75} />
                </div>
              </div>
            </Card>
          );

          if (item.href) {
            return (
              <Link key={item.id} href={item.href} onClick={item.onAction} className="block group">
                {content}
              </Link>
            );
          }

          return (
            <button key={item.id} type="button" onClick={item.onAction} className="w-full text-left group">
              {content}
            </button>
          );
        })}
      </div>
    </section>
  );
}

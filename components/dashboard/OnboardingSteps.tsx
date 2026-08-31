'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Package, Store, Share2, X, type LucideIcon } from 'lucide-react';
import { ELEVATED_SURFACE } from '@/components/ui/Surfaces';
import { useToast } from '@/components/ui/Toast';
import { dispensarMarco, marcarMarcoConcluido } from '@/lib/mutations/lojaMarcos';
import type { MarcoOnboarding } from '@/types/database';
import { cn } from '@/lib/cn';

interface MarcoConfig {
  icon: LucideIcon;
  title: string;
  subtitle: string;
  ctaLabel: string;
  href?: string;
  onAction?: () => void;
}

function getMarcoConfig(marco: MarcoOnboarding, handleShare: () => void): MarcoConfig {
  switch (marco) {
    case 'primeiro_produto':
      return {
        icon: Package,
        title: 'Adicione seu primeiro produto',
        subtitle: 'Comece a construir seu catálogo.',
        ctaLabel: 'Criar produto',
        href: '/produtos/novo',
      };
    case 'personalizar_loja':
      return {
        icon: Store,
        title: 'Personalize sua loja',
        subtitle: 'Ajuste a aparência e deixe-a com a sua identidade.',
        ctaLabel: 'Personalizar',
        href: '/loja',
      };
    case 'partilhar_loja':
      return {
        icon: Share2,
        title: 'Compartilhe sua loja',
        subtitle: 'Divulgue e facilite o acesso dos seus clientes.',
        ctaLabel: 'Copiar link',
        onAction: handleShare,
      };
  }
}

/**
 * Lista de "próximos passos" de onboarding — substitui o antigo card
 * único ilustrado. A DENSIDADE do visual muda sozinha consoante quantos
 * marcos restam (ver `variante` calculada a partir de `marcos.length`),
 * seguindo a régua definida na conversa de UX:
 *
 *   - 2 ou mais restantes → linhas normais, com subtítulo — a página
 *     ainda está em fase de construção, os passos merecem destaque.
 *   - exatamente 1 restante → linha mais discreta, sem subtítulo — deixa
 *     de ser "o centro da página" e passa a ser uma recomendação leve
 *     dentro de "Dicas para crescer" (o `heading` já vem ajustado do
 *     componente pai, ver app/(dashboard)/page.tsx).
 *
 * O título da secção (`heading`) e se cada card se apaga ou não da
 * lista continuam a vir de `loja_marcos` (dispensarMarco/marcarMarcoConcluido)
 * — só a apresentação visual mudou aqui, a lógica de dados é a mesma de
 * sempre.
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
  // Dispensas/conclusões feitas NESTA sessão, antes do servidor ser
  // relido — sem isto, uma linha ficaria visível até ao próximo
  // router.refresh(), mesmo já tendo sido fechada/concluída.
  const [ocultosLocalmente, setOcultosLocalmente] = useState<Set<MarcoOnboarding>>(new Set());

  const visiveis = marcos.filter((m) => !ocultosLocalmente.has(m));
  const compacto = marcos.length === 1;

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

  function handleDismiss(marco: MarcoOnboarding) {
    dispensarMarco(lojaId, marco).catch(() => {});
    setOcultosLocalmente((prev) => new Set(prev).add(marco));
  }

  if (visiveis.length === 0) return null;

  return (
    <div>
      <h2 className="mb-3 px-1 text-[13px] font-bold uppercase tracking-[0.08em] text-slate-400">{heading}</h2>
      <div className={cn('divide-y divide-slate-100 overflow-hidden rounded-[20px]', ELEVATED_SURFACE)}>
        {visiveis.map((marco) => {
          const cfg = getMarcoConfig(marco, handleShare);
          const Icon = cfg.icon;

          const cta = cfg.href ? (
            <Link
              href={cfg.href}
              className="inline-flex h-8 flex-shrink-0 items-center rounded-full bg-ink px-3.5 text-[12px] font-semibold text-white transition-all active:scale-[0.96]"
            >
              {cfg.ctaLabel}
            </Link>
          ) : (
            <button
              type="button"
              onClick={cfg.onAction}
              className="inline-flex h-8 flex-shrink-0 items-center rounded-full bg-ink px-3.5 text-[12px] font-semibold text-white transition-all active:scale-[0.96]"
            >
              {cfg.ctaLabel}
            </button>
          );

          return (
            <div key={marco} className={cn('flex items-center gap-3 px-4', compacto ? 'py-3' : 'py-3.5')}>
              <span
                className={cn(
                  'flex flex-shrink-0 items-center justify-center rounded-full bg-slate-50 text-slate-500',
                  compacto ? 'h-8 w-8' : 'h-9 w-9'
                )}
              >
                <Icon size={compacto ? 15 : 16} strokeWidth={2} />
              </span>

              <div className="min-w-0 flex-1">
                <p className={cn('font-bold text-ink', compacto ? 'text-[13px]' : 'text-[13.5px]')}>{cfg.title}</p>
                {!compacto && <p className="mt-0.5 text-[12px] font-medium text-slate-400">{cfg.subtitle}</p>}
              </div>

              {cta}

              <button
                type="button"
                onClick={() => handleDismiss(marco)}
                aria-label="Dispensar"
                className="flex h-7 w-7 flex-shrink-0 items-center justify-center text-slate-300 transition-colors hover:text-slate-500 active:scale-95"
              >
                <X size={13} strokeWidth={2.25} />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

import { HTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/cn';

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'bg-white border border-[rgba(28,25,23,0.09)] rounded-[18px]',
        className
      )}
      {...props}
    />
  );
}

/**
 * "Superfície elevada" — fundo branco + sombra suave em 3 camadas + ring
 * quase invisível (em vez de border sólido) — usado pelos cards de
 * onboarding da Início (StoreExplorationGuide) e pelo
 * ProductCelebrationBanner (ambos usam esta MESMA constante, de propósito:
 * o banner deve flutuar com a sombra idêntica à dos cards guia, "linha de
 * baixo" incluída). Antes cada ficheiro tinha a sua própria cópia manual
 * desta string de classes; bastava um copiar-colar impreciso (ou o
 * `border` sólido a competir com a sombra, como aconteceu) para os dois
 * parecerem visualmente diferentes mesmo com a intenção de serem iguais.
 * Ao importar esta MESMA constante, os dois deixam de poder divergir —
 * mudar a sombra aqui muda-a nos dois sítios ao mesmo tempo.
 *
 * Não inclui `rounded-*`, padding, nem `overflow` de propósito: cada
 * utilização tem raio/tamanho/layout diferentes (o card guia é grande,
 * com imagem, `rounded-[28px]`; o banner é compacto, `rounded-xl`) — só a
 * sombra e o contorno são, e devem continuar a ser, sempre os mesmos.
 */
export const ELEVATED_SURFACE =
  'bg-white shadow-[0_1px_0_rgba(15,23,42,0.035),0_6px_14px_-6px_rgba(15,23,42,0.13),0_16px_24px_-16px_rgba(15,23,42,0.07)] ring-1 ring-black/[0.035]';

/**
 * Variante mais subtil de `ELEVATED_SURFACE`, calibrada para cards muito
 * pequenos onde a mesma sombra ficaria desproporcionalmente pesada.
 * Atualmente sem utilização (o ProductCelebrationBanner passou a usar
 * `ELEVATED_SURFACE` diretamente, para flutuar com a MESMA sombra dos
 * cards guia) — mantida disponível caso volte a ser necessária para um
 * card pequeno no futuro.
 */
export const ELEVATED_SURFACE_COMPACT =
  'bg-white shadow-[0_1px_0_rgba(15,23,42,0.14),0_4px_10px_-4px_rgba(15,23,42,0.10),0_10px_18px_-10px_rgba(15,23,42,0.06)] ring-1 ring-black/[0.035]';

type BadgeTone = 'neutral' | 'success' | 'warning' | 'danger' | 'brand';

const tones: Record<BadgeTone, string> = {
  neutral: 'bg-[#F5F3F0] text-[#78716C]',
  success: 'bg-emerald-50 text-emerald-700',
  warning: 'bg-amber-50 text-amber-700',
  danger:  'bg-red-50 text-red-600',
  brand:   'bg-[oklch(0.95_0.05_45)] text-[oklch(0.62_0.19_35)]',
};

export function Badge({ tone = 'neutral', children }: { tone?: BadgeTone; children: ReactNode }) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-[0.06em]',
        tones[tone]
      )}
    >
      {children}
    </span>
  );
}

export function EmptyState({
  icon,
  title,
  subtitle,
  action,
}: {
  icon: ReactNode;
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-20 px-6 gap-4">
      <div className="w-16 h-16 rounded-full bg-[#F5F3F0] flex items-center justify-center text-[#A8A29E]">
        {icon}
      </div>
      <div className="flex flex-col gap-1.5">
        <p className="text-sm font-bold text-[#1C1917]">{title}</p>
        {subtitle && (
          <p className="text-[12px] font-medium text-[#A8A29E] max-w-[260px] mx-auto leading-relaxed">
            {subtitle}
          </p>
        )}
      </div>
      {action}
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  // Sem raio embutido aqui de propósito: cn() é um combinador simples (não
  // resolve conflitos como o tailwind-merge), por isso um valor por
  // omissão aqui competiria sempre com o `rounded-*` que cada utilização
  // já passa em `className` — e qual dos dois vence depende da ordem em
  // que o Tailwind gerou as classes na folha de estilos, não da ordem no
  // JSX. Isso já causou uma checkbox-esqueleto a sair redonda em vez de
  // quadrada. Cada chamada a <Skeleton> é responsável por indicar o seu
  // próprio arredondamento.
  return <div className={cn('skeleton-shimmer', className)} />;
}

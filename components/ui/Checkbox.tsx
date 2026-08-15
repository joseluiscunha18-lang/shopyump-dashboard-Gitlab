'use client';

import { Check, Minus } from 'lucide-react';
import { cn } from '@/lib/cn';

export function Checkbox({
  checked,
  indeterminate,
  onChange,
  className,
  ariaLabel,
}: {
  checked: boolean;
  indeterminate?: boolean;
  onChange: (checked: boolean) => void;
  className?: string;
  ariaLabel?: string;
}) {
  return (
    // Área de toque maior que o quadradinho visível: o wrapper controla o
    // espaço no layout (mantém o mesmo tamanho de 19px que os outros
    // elementos veem), enquanto o botão por dentro estende o alvo clicável
    // com margem negativa — evita que um toque perto (mas fora) do
    // quadradinho caia na linha do produto e abra a edição.
    <span className={cn('relative inline-flex h-[19px] w-[19px] flex-shrink-0', className)}>
      <button
        type="button"
        role="checkbox"
        aria-checked={indeterminate ? 'mixed' : checked}
        aria-label={ariaLabel}
        onClick={(e) => {
          e.stopPropagation();
          onChange(!checked);
        }}
        className="absolute -inset-3 flex items-center justify-center"
      >
        <span
          className={cn(
            'flex h-[19px] w-[19px] items-center justify-center rounded-[6px] border-2 transition-colors',
            checked || indeterminate
              ? 'border-[#1A1210] bg-[#1A1210]'
              : 'border-slate-400 bg-white hover:border-[#1A1210]/60',
          )}
        >
          {indeterminate ? (
            <Minus size={11} strokeWidth={3} className="text-white" />
          ) : checked ? (
            <Check size={11} strokeWidth={3} className="text-white" />
          ) : null}
        </span>
      </button>
    </span>
  );
}

'use client';

import { Sheet } from '@/components/ui/Sheet';
import { cn } from '@/lib/cn';
import type { ThemeButtonRadius } from '@/types/theme';

const OPTIONS: { id: ThemeButtonRadius; label: string; radiusClass: string }[] = [
  { id: 'none', label: 'Quadrados', radiusClass: 'rounded-none' },
  { id: 'md', label: 'Arredondados', radiusClass: 'rounded-md' },
  { id: 'full', label: 'Pílula', radiusClass: 'rounded-full' },
];

/** Ajuste de estilo de botão (§8) — mesma lógica de "muda logo" do ColorSheet. */
export function ButtonStyleSheet({
  open,
  onClose,
  value,
  onChange,
  themeDefault,
}: {
  open: boolean;
  onClose: () => void;
  value: ThemeButtonRadius | null;
  onChange: (radius: ThemeButtonRadius | null) => void;
  themeDefault: ThemeButtonRadius;
}) {
  const active = value ?? themeDefault;
  return (
    <Sheet open={open} onClose={onClose} title="Estilo" subtitle="Botões e elementos visuais." heightVh={55}>
      <div className="flex flex-col gap-3 pb-4">
        {OPTIONS.map((opt) => (
          <button
            key={opt.id}
            type="button"
            onClick={() => onChange(opt.id)}
            className={cn(
              'flex items-center justify-between rounded-[13px] border px-4 py-3.5 transition-colors',
              active === opt.id ? 'border-[#111110] bg-[#F4F4F3]' : 'border-[#E5E3E0]'
            )}
          >
            <span className="text-[13px] font-semibold text-ink">{opt.label}</span>
            <span className={cn('h-8 w-14 bg-[#111110]', opt.radiusClass)} />
          </button>
        ))}
        {value !== null && (
          <button type="button" onClick={() => onChange(null)} className="self-start text-[12px] font-bold text-slate-400 underline">
            Repor estilo do tema
          </button>
        )}
      </div>
    </Sheet>
  );
}

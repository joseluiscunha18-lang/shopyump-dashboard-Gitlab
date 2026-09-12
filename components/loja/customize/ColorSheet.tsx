'use client';

import { Check } from 'lucide-react';
import { Sheet } from '@/components/ui/Sheet';
import { Button } from '@/components/ui/Button';
import { CORES_SUGERIDAS } from '@/lib/cores';

/**
 * Ajuste de cor principal (§8) — atualiza a pré-visualização em tempo
 * real a cada toque, sem precisar de "aplicar" à parte (diferente do
 * tema, que tem um passo de confirmação próprio).
 */
export function ColorSheet({
  open,
  onClose,
  value,
  onChange,
  themeDefault,
}: {
  open: boolean;
  onClose: () => void;
  value: string | null;
  onChange: (hex: string | null) => void;
  themeDefault: string;
}) {
  return (
    <Sheet open={open} onClose={onClose} title="Cores" subtitle="Defina a cor principal da sua loja." heightVh={70}>
      <div className="flex flex-col gap-5 pb-4">
        <div className="grid grid-cols-6 gap-3">
          {CORES_SUGERIDAS.map((c) => {
            const isSelected = value === c.hex;
            return (
              <button
                key={c.hex}
                type="button"
                aria-label={c.nome}
                onClick={() => onChange(c.hex)}
                className="flex h-11 w-11 items-center justify-center rounded-full border border-black/5"
                style={{ backgroundColor: c.hex }}
              >
                {isSelected && <Check size={16} className={c.hex === '#FFFFFF' ? 'text-ink' : 'text-white'} />}
              </button>
            );
          })}
        </div>

        <label className="flex items-center justify-between rounded-[13px] border border-[#E5E3E0] px-4 py-3">
          <span className="text-[13px] font-semibold text-ink">Cor personalizada</span>
          <input
            type="color"
            value={value ?? themeDefault}
            onChange={(e) => onChange(e.target.value)}
            className="h-8 w-8 cursor-pointer rounded-full border-0 bg-transparent p-0"
          />
        </label>

        <Button type="button" variant="secondary" onClick={() => onChange(null)} disabled={value === null}>
          Repor cor do tema
        </Button>
      </div>
    </Sheet>
  );
}

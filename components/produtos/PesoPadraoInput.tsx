'use client';

import { useEffect, useRef, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { kgParaUnidade, pesoParaKg } from '@/lib/peso';
import type { UnidadePeso } from '@/lib/peso';
import { cn } from '@/lib/cn';

export function PesoPadraoInput({
  valor,
  unidade,
  onChangeValor,
  onChangeUnidade,
}: {
  valor: string;
  unidade: UnidadePeso;
  onChangeValor: (v: string) => void;
  onChangeUnidade: (u: UnidadePeso) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, [open]);

  function trocarUnidade(u: UnidadePeso) {
    setOpen(false);
    if (u === unidade) return;
    if (valor.trim() !== '' && !Number.isNaN(Number(valor))) {
      const kg = pesoParaKg(Number(valor), unidade);
      onChangeValor(String(kgParaUnidade(kg, u)));
    }
    onChangeUnidade(u);
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-stretch gap-2">
        {/* Valor */}
        <input
          type="number"
          min={0}
          step="0.01"
          inputMode="decimal"
          value={valor}
          onChange={(e) => onChangeValor(e.target.value)}
          placeholder="0"
          className="h-12 min-w-0 flex-1 rounded-md border border-[#D4D2CF] bg-white px-4 text-[15px] font-semibold text-[#111110] outline-none placeholder:text-[#71717A] transition-all duration-150 focus:border-[#1C1917] focus:ring-3 focus:ring-[rgba(28,25,23,0.06)]"
        />

        {/* Unidade */}
        <div ref={ref} className="relative shrink-0">
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-label="Escolher unidade de peso"
            className="flex h-12 items-center gap-1.5 rounded-md border border-[#D4D2CF] bg-white px-4 text-[13px] font-bold text-[#111110] transition-all duration-150 hover:border-[#B8B5B1]"
          >
            {unidade}
            <ChevronDown
              size={13}
              strokeWidth={2.5}
              className={cn('text-[#71717A] transition-transform duration-150', open && 'rotate-180')}
            />
          </button>

          {open && (
            <div className="absolute right-0 top-full z-20 mt-1.5 w-16 overflow-hidden rounded-md border border-[rgba(28,25,23,0.1)] bg-white p-1.5 shadow-[0_16px_40px_-14px_rgba(28,25,23,0.2)]">
              {(['g', 'kg', 'lb', 'oz'] as const).map((u) => (
                <button
                  key={u}
                  type="button"
                  onClick={() => trocarUnidade(u)}
                  className={cn(
                    'flex w-full items-center justify-center rounded-md px-2 py-2 text-[13px] font-bold transition-colors',
                    unidade === u
                      ? 'bg-[#1C1917] text-white'
                      : 'text-[#111110] hover:bg-[#F4F4F3]'
                  )}
                >
                  {u}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
      <p className="text-[10px] font-medium leading-snug text-[#A1A1AA]">
        Aplicado a todas as variações
      </p>
    </div>
  );
}

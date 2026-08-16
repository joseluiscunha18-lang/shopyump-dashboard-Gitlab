'use client';

import { useState } from 'react';
import { ChevronRight, Check, Shirt, Sparkles, Home, Smartphone, Gem, UtensilsCrossed, Tag } from 'lucide-react';
import { Sheet } from '@/components/ui/Sheet';
import { cn } from '@/lib/cn';

const CATEGORIAS: { nome: string; icon: typeof Tag }[] = [
  { nome: 'Moda', icon: Shirt },
  { nome: 'Beleza', icon: Sparkles },
  { nome: 'Casa', icon: Home },
  { nome: 'Eletrónica', icon: Smartphone },
  { nome: 'Acessórios', icon: Gem },
  { nome: 'Alimentação', icon: UtensilsCrossed },
  { nome: 'Outros', icon: Tag },
];

export function CategoryPicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false);
  const [custom, setCustom] = useState('');

  const known = CATEGORIAS.find((c) => c.nome === value);
  const Icon = known?.icon ?? Tag;

  function pick(nome: string) {
    onChange(nome);
    setOpen(false);
  }

  function confirmCustom() {
    const v = custom.trim();
    if (!v) return;
    pick(v);
    setCustom('');
  }

  return (
    <div>
      <h3 className="mb-2 pl-1 text-[13px] font-black text-ink">Categoria</h3>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex w-full items-center justify-between rounded-2xl border border-transparent bg-slate-50 px-4 py-3.5 text-left shadow-sm transition-all hover:border-slate-200 active:scale-[0.99]"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-slate-500 shadow-sm">
            <Icon size={16} />
          </div>
          <span className={cn('text-[13px] font-bold', value ? 'text-ink' : 'text-slate-400')}>
            {value || 'Escolher categoria…'}
          </span>
        </div>
        <ChevronRight size={16} className="text-slate-400" />
      </button>

      <Sheet open={open} onClose={() => setOpen(false)} title="Categoria">
        <div className="flex flex-col gap-1.5 pb-3">
          {CATEGORIAS.map(({ nome, icon: ItemIcon }) => (
            <button
              key={nome}
              type="button"
              onClick={() => pick(nome)}
              className="flex items-center justify-between rounded-2xl px-3 py-3 text-left transition-colors active:bg-slate-50"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-50 text-slate-500">
                  <ItemIcon size={16} />
                </div>
                <span className="text-[13px] font-bold text-ink">{nome}</span>
              </div>
              {value === nome && <Check size={16} className="text-ink" />}
            </button>
          ))}
        </div>

        <div className="border-t border-slate-100 pb-4 pt-4">
          <label className="mb-2 block pl-1 text-[11px] font-black uppercase tracking-widest text-slate-400">
            Outra categoria
          </label>
          <div className="flex gap-2">
            <input
              value={custom}
              onChange={(e) => setCustom(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && confirmCustom()}
              placeholder="Escreve o nome…"
              className="w-full rounded-2xl border border-transparent bg-slate-50 px-4 py-3 text-[13px] font-semibold text-ink outline-none focus:border-ink focus:bg-white focus:ring-4 focus:ring-ink/5"
            />
            <button
              type="button"
              onClick={confirmCustom}
              className="flex h-[46px] w-[46px] shrink-0 items-center justify-center rounded-2xl bg-ink text-white shadow-sm active:scale-95"
            >
              <Check size={16} />
            </button>
          </div>
        </div>
      </Sheet>
    </div>
  );
}

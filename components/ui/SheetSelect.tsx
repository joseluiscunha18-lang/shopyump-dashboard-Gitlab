'use client';

import { Children, isValidElement, useState, type ReactNode } from 'react';
import { Check, ChevronDown, Search } from 'lucide-react';
import { Drawer, DrawerContent, DrawerTitle, DrawerDescription } from '@/components/ui/drawer';
import { cn } from '@/lib/utils';

export type SheetOption = { value: string; label: ReactNode };

/** Extrai opções de filhos <option> (compatibilidade com o antigo <select>). */
export function optionsFromChildren(children: ReactNode): SheetOption[] {
  return Children.toArray(children).flatMap((c) =>
    isValidElement<{ value?: string; children?: ReactNode }>(c)
      ? [{ value: String(c.props.value ?? ''), label: c.props.children }]
      : [],
  );
}

/** Seletor em gaveta: substitui o menu nativo do sistema em todos os dispositivos. */
export function SheetSelect({ id, value, onChange, options, title, className, ariaLabel }: {
  id?: string; value: string; onChange: (v: string) => void; options: SheetOption[];
  title: string; className?: string; ariaLabel?: string;
}) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const current = options.find((o) => o.value === value);
  const text = (l: ReactNode) => (typeof l === 'string' || typeof l === 'number' ? String(l) : '');
  const norm = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  // A opção vazia ("Selecionar") é só o texto do botão; nunca aparece na gaveta.
  const choices = options.filter((o) => o.value !== '');
  const searchable = choices.length > 8;
  const shown = searchable && q ? choices.filter((o) => norm(text(o.label)).includes(norm(q))) : choices;
  return (
    <>
      <button id={id} type="button" aria-haspopup="dialog" aria-expanded={open} aria-label={ariaLabel}
        onClick={() => { setQ(''); setOpen(true); }}
        className={cn('relative flex min-h-12 w-full items-center rounded-xl border border-border/70 bg-card py-3 pl-4 pr-11 text-left text-[15px] text-foreground outline-none transition-colors hover:border-border focus-visible:border-foreground/60 focus-visible:ring-2 focus-visible:ring-ring/20', className)}>
        <span className="truncate">{current && current.value !== '' ? current.label : <span className="text-muted-foreground">{current?.label ?? 'Selecionar'}</span>}</span>
        <ChevronDown size={18} strokeWidth={1.75} aria-hidden className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
      </button>
      <Drawer open={open} onOpenChange={setOpen}>
        <DrawerContent className="mx-auto max-h-[85vh] max-w-lg rounded-t-3xl border-0 bg-card">
          <DrawerTitle className="px-6 pb-2 pt-4 text-base font-semibold">{title}</DrawerTitle>
          <DrawerDescription className="sr-only">Escolha uma opção</DrawerDescription>
          {searchable && (
            <div className="relative mx-4 mb-2">
              <Search size={17} aria-hidden className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder={`Pesquisar ${title.replace(/^Selecionar\s+/i, '').toLowerCase()}…`} aria-label="Pesquisar"
                className="h-11 w-full rounded-xl bg-muted pl-10 pr-3 text-[15px] text-foreground outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring/20" />
            </div>
          )}
          <ul role="listbox" aria-label={title} className="overflow-y-auto px-3 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
            {shown.length === 0 && <li className="px-4 py-6 text-center text-sm text-muted-foreground">Nenhum resultado</li>}
            {shown.map((o) => {
              const sel = o.value === value;
              return (
                <li key={o.value}>
                  <button type="button" role="option" aria-selected={sel}
                    onClick={() => { onChange(o.value); setOpen(false); }}
                    className={cn('flex min-h-14 w-full items-center justify-between gap-3 rounded-2xl px-4 text-left text-[15px] transition-colors hover:bg-muted', sel && 'bg-muted font-semibold')}>
                    <span>{o.label}</span>
                    {sel && <Check size={18} className="shrink-0 text-primary" aria-hidden />}
                  </button>
                </li>
              );
            })}
          </ul>
        </DrawerContent>
      </Drawer>
    </>
  );
}

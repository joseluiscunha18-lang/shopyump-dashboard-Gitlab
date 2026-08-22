'use client';

import { useEffect, useRef, useState } from 'react';
import { ChevronDown, ArrowUpDown, Check } from 'lucide-react';
import { cn } from '@/lib/cn';

export type StatusFilter = 'todos' | 'ativos' | 'inativos' | 'rascunhos';
export type SortOption = 'recentes' | 'antigos' | 'preco-asc' | 'preco-desc' | 'nome-az';

const STATUS_LABELS: Record<StatusFilter, string> = {
  todos: 'Todos',
  ativos: 'Ativos',
  inativos: 'Inativos',
  rascunhos: 'Rascunhos',
};

const SORT_LABELS: Record<SortOption, string> = {
  recentes: 'Mais recentes',
  antigos: 'Mais antigos',
  'preco-asc': 'Preço: menor → maior',
  'preco-desc': 'Preço: maior → menor',
  'nome-az': 'Nome A–Z',
};

function FilterDropdown<T extends string>({
  label,
  icon,
  value,
  options,
  labels,
  onChange,
  isActive,
  align = 'left',
}: {
  label: string;
  icon?: React.ReactNode;
  value: T;
  options: T[];
  labels: Record<T, string>;
  onChange: (v: T) => void;
  isActive: boolean;
  align?: 'left' | 'right';
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

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={cn(
          'flex h-8 items-center gap-1.5 whitespace-nowrap rounded-xl border px-3.5 text-[12.5px] font-bold transition-colors',
          isActive
            ? 'border-[#1A1210] bg-[#1A1210] text-white'
            : 'border-[#1A1210]/15 bg-white text-slate-600 shadow-[0_2px_6px_rgba(15,23,42,0.06)] hover:border-[#1A1210]/25 hover:text-ink',
        )}
      >
        {icon}
        {isActive ? labels[value] : label}
        <ChevronDown size={13} strokeWidth={2.4} className={cn('transition-transform', open && 'rotate-180')} />
      </button>

      {open && (
        <div
          className={cn(
            'absolute top-[calc(100%+8px)] z-30 w-[192px] overflow-hidden rounded-2xl border border-[#1A1210]/12 bg-white p-1.5 shadow-[0_16px_40px_-14px_rgba(15,23,42,0.28)]',
            align === 'right' ? 'right-0' : 'left-0',
          )}
        >
          {options.map((opt) => (
            <button
              key={opt}
              type="button"
              onClick={() => {
                onChange(opt);
                setOpen(false);
              }}
              className="flex w-full items-center justify-between gap-2 rounded-xl px-3 py-2.5 text-left text-[13px] font-semibold text-ink transition-colors hover:bg-slate-50"
            >
              <span className="truncate">{labels[opt]}</span>
              {value === opt && <Check size={14} strokeWidth={2.6} className="flex-shrink-0 text-[#1A1210]" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function ProductFilterBar({
  status,
  onStatusChange,
  categoria,
  onCategoriaChange,
  categorias,
  sort,
  onSortChange,
}: {
  status: StatusFilter;
  onStatusChange: (v: StatusFilter) => void;
  categoria: string;
  onCategoriaChange: (v: string) => void;
  categorias: string[];
  sort: SortOption;
  onSortChange: (v: SortOption) => void;
}) {
  const categoriaOptions = ['todas', ...categorias];
  const categoriaLabels = Object.fromEntries(
    categoriaOptions.map((c) => [c, c === 'todas' ? 'Todas' : c]),
  ) as Record<string, string>;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <FilterDropdown
        label="Status"
        value={status}
        options={['todos', 'ativos', 'inativos', 'rascunhos'] as StatusFilter[]}
        labels={STATUS_LABELS}
        onChange={onStatusChange}
        isActive={status !== 'todos'}
      />
      <FilterDropdown
        label="Categoria"
        value={categoria}
        options={categoriaOptions}
        labels={categoriaLabels}
        onChange={onCategoriaChange}
        isActive={categoria !== 'todas'}
      />
      <FilterDropdown
        label="Ordenar"
        icon={<ArrowUpDown size={12.5} strokeWidth={2.4} />}
        value={sort}
        options={['recentes', 'antigos', 'preco-asc', 'preco-desc', 'nome-az'] as SortOption[]}
        labels={SORT_LABELS}
        onChange={onSortChange}
        isActive={sort !== 'recentes'}
        align="right"
      />
    </div>
  );
}

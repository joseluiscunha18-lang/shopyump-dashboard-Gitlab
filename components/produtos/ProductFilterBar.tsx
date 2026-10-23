'use client';

import { cn } from '@/lib/cn';

export type StatusFilter = 'todos' | 'ativos' | 'inativos' | 'rascunhos';
export type SortOption = 'recentes' | 'antigos' | 'preco-asc' | 'preco-desc' | 'nome-az';

const STATUS_LABELS: Record<StatusFilter, string> = {
  todos: 'Todos',
  ativos: 'Ativos',
  inativos: 'Inativos',
  rascunhos: 'Rascunhos',
};

export function ProductFilterBar({
  status,
  onStatusChange,
  categoria,
  onCategoriaChange,
  categorias,
  sort,
  onSortChange,
  counts,
  search,
}: {
  status: StatusFilter;
  onStatusChange: (v: StatusFilter) => void;
  categoria: string;
  onCategoriaChange: (v: string) => void;
  categorias: string[];
  sort: SortOption;
  onSortChange: (v: SortOption) => void;
  counts: Record<StatusFilter, number>;
  search?: React.ReactNode;
}) {
  const statusOpts = ['todos', 'ativos', 'inativos'] as StatusFilter[];

  return (
    <div className="flex flex-col gap-3">
      {search && <div className="min-w-0">{search}</div>}
      <div className="grid w-full grid-cols-3 gap-1 rounded-xl bg-muted p-1">
        {statusOpts.map((v) => {
          const ativo = status === v;
          const n = counts[v];
          return (
            <button
              key={v}
              type="button"
              onClick={() => onStatusChange(v)}
              className={cn(
                'flex h-9 min-w-0 items-center justify-center gap-1.5 whitespace-nowrap rounded-lg px-2 text-sm font-semibold transition-all',
                ativo ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {STATUS_LABELS[v]}
              <span className={cn('rounded-md px-1.5 text-xs tabular-nums', ativo ? 'bg-brand text-brand-foreground' : 'text-muted-foreground')}>{n}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

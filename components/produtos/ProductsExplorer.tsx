'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Loader2, SearchX } from 'lucide-react';
import { Card } from '@/components/ui/Surfaces';
import { ProductRow } from '@/components/produtos/ProductRow';
import { ProductSearchBar } from '@/components/produtos/ProductSearchBar';
import { ProductFilterBar, type StatusFilter, type SortOption } from '@/components/produtos/ProductFilterBar';
import type { Produto } from '@/types/database';

const PAGE_SIZE = 10;

export function ProductsExplorer({ produtos }: { produtos: Produto[] }) {
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState<StatusFilter>('todos');
  const [categoria, setCategoria] = useState('todas');
  const [sort, setSort] = useState<SortOption>('recentes');
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [loadingMore, setLoadingMore] = useState(false);

  const categorias = useMemo(
    () => Array.from(new Set(produtos.map((p) => p.categoria).filter(Boolean))).sort(),
    [produtos],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();

    let list = produtos.filter((p) => {
      if (status === 'ativos' && !p.ativo) return false;
      if (status === 'inativos' && p.ativo) return false;
      if (categoria !== 'todas' && p.categoria !== categoria) return false;
      if (q) {
        const haystack = `${p.nome} ${p.categoria}`.toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });

    list = [...list].sort((a, b) => {
      switch (sort) {
        case 'antigos':
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        case 'preco-asc':
          return a.preco - b.preco;
        case 'preco-desc':
          return b.preco - a.preco;
        case 'nome-az':
          return a.nome.localeCompare(b.nome);
        case 'recentes':
        default:
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
    });

    return list;
  }, [produtos, query, status, categoria, sort]);

  // Reset progressive reveal whenever the effective result set changes.
  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [query, status, categoria, sort]);

  const visible = filtered.slice(0, visibleCount);
  const hasMore = visibleCount < filtered.length;

  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!hasMore) return;
    const node = sentinelRef.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setLoadingMore(true);
          // Small, deliberate delay so "A carregar..." reads as a real step
          // rather than a flash — mirrors a paginated fetch without one.
          setTimeout(() => {
            setVisibleCount((v) => v + PAGE_SIZE);
            setLoadingMore(false);
          }, 420);
        }
      },
      { rootMargin: '200px' },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [hasMore]);

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-[24px] bg-[#1A1210] p-2.5 shadow-[0_10px_28px_-14px_rgba(26,18,16,0.4)]">
        <ProductSearchBar value={query} onChange={setQuery} produtos={produtos} />

        <div className="mt-2 px-0.5">
          <ProductFilterBar
            status={status}
            onStatusChange={setStatus}
            categoria={categoria}
            onCategoriaChange={setCategoria}
            categorias={categorias}
            sort={sort}
            onSortChange={setSort}
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-[28px] bg-white py-16 text-center shadow-[0_1px_0_rgba(15,23,42,0.04),0_4px_10px_-6px_rgba(15,23,42,0.08)]">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-50 text-slate-300">
            <SearchX size={20} strokeWidth={2} />
          </div>
          <div>
            <p className="text-[13px] font-bold text-ink">Nenhum produto encontrado</p>
            <p className="mt-1 max-w-[240px] text-[12px] font-medium text-slate-400">
              Tenta ajustar a pesquisa ou os filtros.
            </p>
          </div>
        </div>
      ) : (
        <>
          <Card className="divide-y divide-slate-100">
            {visible.map((p) => (
              <ProductRow key={p.id} produto={p} />
            ))}
          </Card>

          {hasMore && (
            <div ref={sentinelRef} className="flex items-center justify-center py-4">
              {loadingMore && (
                <span className="flex items-center gap-2 text-[12.5px] font-semibold text-slate-400">
                  <Loader2 size={14} className="animate-spin" />
                  A carregar...
                </span>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}

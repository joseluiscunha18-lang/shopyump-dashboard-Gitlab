'use client';

import { useEffect, useMemo, useRef, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, SearchX, ChevronDown, Copy } from 'lucide-react';
import { cn } from '@/lib/cn';
import { ProductRow } from '@/components/produtos/ProductRow';
import { ProductSearchBar } from '@/components/produtos/ProductSearchBar';
import { ProductFilterBar, type StatusFilter, type SortOption } from '@/components/produtos/ProductFilterBar';
import { Checkbox } from '@/components/ui/Checkbox';
import { useToast } from '@/components/ui/Toast';
import { toggleProdutoAtivo, deleteProduto, duplicateProduto } from '@/lib/mutations/produtos';
import type { Produto } from '@/types/database';

const PAGE_SIZE = 10;

export function ProductsExplorer({ produtos }: { produtos: Produto[] }) {
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState<StatusFilter>('todos');
  const [categoria, setCategoria] = useState('todas');
  const [sort, setSort] = useState<SortOption>('recentes');
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [loadingMore, setLoadingMore] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [moreOpen, setMoreOpen] = useState(false);
  const [bulkPending, startBulkTransition] = useTransition();
  const moreRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const { show } = useToast();

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

  // Reset progressive reveal (and any active selection) whenever the
  // effective result set changes — a stale selection across a new filter
  // would silently act on products the person can no longer see.
  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
    setSelectedIds(new Set());
  }, [query, status, categoria, sort]);

  const visible = filtered.slice(0, visibleCount);
  const hasMore = visibleCount < filtered.length;

  useEffect(() => {
    if (!moreOpen) return;
    function onClickOutside(e: MouseEvent) {
      if (moreRef.current && !moreRef.current.contains(e.target as Node)) setMoreOpen(false);
    }
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, [moreOpen]);

  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const allVisibleSelected = visible.length > 0 && visible.every((p) => selectedIds.has(p.id));
  const someVisibleSelected = visible.some((p) => selectedIds.has(p.id));

  function toggleSelectAll() {
    if (allVisibleSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(visible.map((p) => p.id)));
    }
  }

  function runBulk(action: (id: string) => Promise<{ ok: boolean; error?: string }>, successMsg: string, failMsg: string) {
    const ids = Array.from(selectedIds);
    setMoreOpen(false);
    startBulkTransition(async () => {
      const results = await Promise.all(ids.map((id) => action(id)));
      const failed = results.filter((r) => !r.ok).length;
      if (failed > 0) show(failed === ids.length ? failMsg : `${failed} produto(s) ${failMsg.toLowerCase()}`, 'error');
      else show(successMsg);
      setSelectedIds(new Set());
      router.refresh();
    });
  }

  function handleBulkAtivar() {
    runBulk((id) => toggleProdutoAtivo(id, true), 'Produtos ativados.', 'Não foram atualizados.');
  }

  function handleBulkDesativar() {
    runBulk((id) => toggleProdutoAtivo(id, false), 'Produtos desativados.', 'Não foram atualizados.');
  }

  function handleBulkDuplicar() {
    runBulk((id) => duplicateProduto(id), 'Produtos duplicados.', 'Não foram duplicados.');
  }

  function handleBulkExcluir() {
    if (!confirm(`Remover ${selectedIds.size} produto(s)? Esta ação não pode ser desfeita.`)) return;
    runBulk((id) => deleteProduto(id), 'Produtos removidos.', 'Não foram removidos.');
  }

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
    <div className="overflow-hidden rounded-[28px] bg-white shadow-[0_1px_0_rgba(15,23,42,0.04),0_4px_10px_-6px_rgba(15,23,42,0.08),0_12px_20px_-16px_rgba(15,23,42,0.05)] ring-1 ring-black/[0.03]">
      <div className="p-3">
        <ProductSearchBar value={query} onChange={setQuery} produtos={produtos} />

        <div className="mt-2.5 px-0.5">
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
        <div className="flex flex-col items-center gap-3 border-t border-slate-100 py-16 text-center">
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
          <div
            className={cn(
              'flex h-11 items-center gap-3 border-t border-slate-100 px-4 transition-colors',
              someVisibleSelected && 'bg-brand-soft/30',
            )}
          >
            <Checkbox
              checked={allVisibleSelected}
              indeterminate={someVisibleSelected && !allVisibleSelected}
              onChange={toggleSelectAll}
              ariaLabel="Selecionar todos os produtos visíveis"
            />

            {selectedIds.size > 0 ? (
              <div className="flex flex-1 flex-wrap items-center justify-between gap-2">
                <span className="text-[12.5px] font-bold text-ink">Selecionados: {selectedIds.size}</span>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    disabled={bulkPending}
                    onClick={handleBulkAtivar}
                    className="rounded-lg px-2.5 py-1.5 text-[12px] font-bold text-emerald-600 transition-colors hover:bg-emerald-50 disabled:opacity-50"
                  >
                    Ativar
                  </button>
                  <button
                    type="button"
                    disabled={bulkPending}
                    onClick={handleBulkDesativar}
                    className="rounded-lg px-2.5 py-1.5 text-[12px] font-bold text-slate-500 transition-colors hover:bg-slate-100 disabled:opacity-50"
                  >
                    Desativar
                  </button>
                  <button
                    type="button"
                    disabled={bulkPending}
                    onClick={handleBulkExcluir}
                    className="rounded-lg px-2.5 py-1.5 text-[12px] font-bold text-red-500 transition-colors hover:bg-red-50 disabled:opacity-50"
                  >
                    Excluir
                  </button>
                  <div ref={moreRef} className="relative">
                    <button
                      type="button"
                      disabled={bulkPending}
                      onClick={() => setMoreOpen((v) => !v)}
                      className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-[12px] font-bold text-slate-500 transition-colors hover:bg-slate-100 disabled:opacity-50"
                    >
                      Mais
                      <ChevronDown size={12} strokeWidth={2.6} className={cn('transition-transform', moreOpen && 'rotate-180')} />
                    </button>
                    {moreOpen && (
                      <div className="absolute right-0 top-[calc(100%+6px)] z-30 w-[176px] overflow-hidden rounded-2xl border border-zinc-200/70 bg-white p-1.5 shadow-[0_16px_40px_-14px_rgba(15,23,42,0.28)]">
                        <button
                          type="button"
                          onClick={handleBulkDuplicar}
                          className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-[13px] font-semibold text-ink transition-colors hover:bg-slate-50"
                        >
                          <Copy size={14} strokeWidth={2.2} className="text-slate-400" />
                          Duplicar
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <span className="text-[12px] font-semibold text-slate-400">
                {filtered.length} {filtered.length === 1 ? 'produto' : 'produtos'}
              </span>
            )}
          </div>

          <div className="divide-y divide-slate-100 border-t border-slate-100">
            {visible.map((p) => (
              <ProductRow key={p.id} produto={p} selected={selectedIds.has(p.id)} onToggleSelect={toggleSelect} />
            ))}
          </div>

          {hasMore && (
            <div ref={sentinelRef} className="flex items-center justify-center border-t border-slate-100 py-4">
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

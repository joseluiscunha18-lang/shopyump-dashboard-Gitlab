'use client';

import { useEffect, useMemo, useRef, useState, useTransition, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, SearchX, Eye, EyeOff, Copy, Trash2, X } from 'lucide-react';
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
  const [bulkPending, startBulkTransition] = useTransition();
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
        // A pesquisa cobre tudo o que é mostrado na página de produtos —
        // não só o nome, mas categoria, preço, estoque e status.
        const haystack = [
          p.nome,
          p.categoria,
          String(p.preco),
          p.preco_promo ? String(p.preco_promo) : '',
          p.ativo ? 'ativo' : 'inativo',
          typeof p.estoque === 'number' ? String(p.estoque) : '',
        ]
          .join(' ')
          .toLowerCase();
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
    <>
      {/* Sem overflow-hidden no contentor: os menus (pesquisa, filtros, "⋮" de
      cada produto) são posicionados em absolute e precisam de poder
      ultrapassar os limites do card sem serem cortados. Cartão sólido (sem
      blur/translucidez) com sombra mais forte, para se destacar claramente
      do fundo cinza da página em vez de se misturar com ele. */}
      <div className="rounded-[28px] border border-[#1A1210]/8 bg-white shadow-[0_1px_0_rgba(15,23,42,0.04),0_10px_28px_-10px_rgba(15,23,42,0.14)]">
        <div className="border-b border-[#1A1210]/8 p-3">
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
          <div className="flex flex-col items-center gap-3 rounded-b-[28px] py-16 text-center">
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
            {/* Cor igual à da página (não branco) + a mesma linha acastanhada
            usada no resto do card (agora um pouco mais suave), para que a
            divisão entre pesquisa/filtros → seleção → lista fique visível
            sem se confundir com o fundo nem ficar pesada. */}
            <div className="flex h-11 items-center gap-3 border-b border-[#1A1210]/8 bg-[#F6F7F9] px-4">
              <Checkbox
                checked={allVisibleSelected}
                indeterminate={someVisibleSelected && !allVisibleSelected}
                onChange={toggleSelectAll}
                ariaLabel="Selecionar todos os produtos visíveis"
              />

              {selectedIds.size > 0 ? (
                <span className="text-[12.5px] font-bold text-ink">
                  {selectedIds.size} {selectedIds.size === 1 ? 'selecionado' : 'selecionados'}
                </span>
              ) : (
                <span className="text-[12px] font-semibold text-slate-400">
                  {filtered.length} {filtered.length === 1 ? 'produto' : 'produtos'}
                </span>
              )}
            </div>

            <div className="divide-y divide-[#1A1210]/8">
              {visible.map((p) => (
                <ProductRow key={p.id} produto={p} selected={selectedIds.has(p.id)} onToggleSelect={toggleSelect} />
              ))}
            </div>

            {hasMore && (
              <div ref={sentinelRef} className="flex items-center justify-center rounded-b-[28px] border-t border-[#1A1210]/8 py-4">
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

      {/* Painel flutuante de ações em massa: sobrepõe o conteúdo em vez de
      empurrar a lista para baixo. Fica acima da BottomNav no mobile (que é
      fixed) e mais perto do fundo no desktop (onde a BottomNav está oculta). */}
      {selectedIds.size > 0 && (
        <div className="fixed inset-x-0 bottom-24 z-50 flex justify-center px-4 sm:bottom-6">
          <div className="flex max-w-full items-center gap-1 rounded-full border border-white/10 bg-[#1A1210] py-1.5 pl-4 pr-1.5 text-white shadow-[0_20px_50px_-12px_rgba(0,0,0,0.5)]">
            <span className="mr-1 whitespace-nowrap text-[12.5px] font-bold">
              {selectedIds.size} {selectedIds.size === 1 ? 'selecionado' : 'selecionados'}
            </span>

            <div className="mx-1 h-5 w-px flex-shrink-0 bg-white/15" />

            <div className="flex items-center gap-0.5">
              <FloatingActionButton
                icon={<Eye size={16} strokeWidth={2.2} />}
                label="Ativar"
                disabled={bulkPending}
                onClick={handleBulkAtivar}
              />
              <FloatingActionButton
                icon={<EyeOff size={16} strokeWidth={2.2} />}
                label="Desativar"
                disabled={bulkPending}
                onClick={handleBulkDesativar}
              />
              <FloatingActionButton
                icon={<Copy size={16} strokeWidth={2.2} />}
                label="Duplicar"
                disabled={bulkPending}
                onClick={handleBulkDuplicar}
              />
              <FloatingActionButton
                icon={<Trash2 size={16} strokeWidth={2.2} />}
                label="Excluir"
                disabled={bulkPending}
                onClick={handleBulkExcluir}
                tone="danger"
              />
            </div>

            <div className="mx-1 h-5 w-px flex-shrink-0 bg-white/15" />

            <button
              type="button"
              onClick={() => setSelectedIds(new Set())}
              aria-label="Cancelar seleção"
              className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-white/60 transition-colors hover:bg-white/10 hover:text-white"
            >
              <X size={16} strokeWidth={2.4} />
            </button>
          </div>
        </div>
      )}
    </>
  );
}

function FloatingActionButton({
  icon,
  label,
  onClick,
  disabled,
  tone = 'default',
}: {
  icon: ReactNode;
  label: string;
  onClick: () => void;
  disabled?: boolean;
  tone?: 'default' | 'danger';
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className={cn(
        'flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full transition-colors disabled:opacity-40',
        tone === 'danger' ? 'text-red-400 hover:bg-red-500/15 hover:text-red-300' : 'text-white/80 hover:bg-white/10 hover:text-white',
      )}
    >
      {icon}
    </button>
  );
}

'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Search, Clock, Package } from 'lucide-react';
import type { Produto } from '@/types/database';

const RECENT_KEY = 'shopyump:recent-product-searches';
const MAX_RECENT = 4;

function loadRecent(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(RECENT_KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

function saveRecent(list: string[]) {
  try {
    window.localStorage.setItem(RECENT_KEY, JSON.stringify(list));
  } catch {
    // localStorage indisponível (modo privado, etc.) — degrada sem sugestões persistidas.
  }
}

export function ProductSearchBar({
  value,
  onChange,
  produtos,
}: {
  value: string;
  onChange: (v: string) => void;
  produtos: Produto[];
}) {
  const [focused, setFocused] = useState(false);
  const [recent, setRecent] = useState<string[]>([]);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setRecent(loadRecent());
  }, []);

  function commitSearch(term: string) {
    const trimmed = term.trim();
    if (!trimmed) return;
    const next = [trimmed, ...recent.filter((r) => r.toLowerCase() !== trimmed.toLowerCase())].slice(0, MAX_RECENT);
    setRecent(next);
    saveRecent(next);
  }

  function pickSuggestion(term: string) {
    onChange(term);
    commitSearch(term);
    setFocused(false);
  }

  // Correspondências rápidas por nome, só para dar atalhos — a filtragem
  // "a sério" da lista continua a cargo do ProductsExplorer.
  const quickMatches = useMemo(() => {
    const q = value.trim().toLowerCase();
    const base = q
      ? produtos.filter((p) => p.nome.toLowerCase().includes(q))
      : produtos;
    return base.slice(0, 4);
  }, [produtos, value]);

  const showRecent = !value.trim() && recent.length > 0;
  const showPanel = focused && (showRecent || quickMatches.length > 0);

  return (
    <div ref={rootRef} className="relative">
      <div className="flex h-11 items-center gap-2.5 rounded-xl border border-white bg-white px-3.5 shadow-[0_6px_16px_-6px_rgba(15,23,42,0.08)] transition-colors focus-within:border-slate-300">
        <Search size={16} strokeWidth={2.2} className="flex-shrink-0 text-slate-400" />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setTimeout(() => setFocused(false), 120)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') commitSearch(value);
          }}
          placeholder="Pesquisar por nome, categoria, preço, estoque..."
          className="h-full w-full min-w-0 bg-transparent text-[13px] font-semibold text-ink placeholder:text-slate-400 focus:outline-none"
        />
      </div>

      {showPanel && (
        <div className="absolute left-0 right-0 top-[calc(100%+8px)] z-30 overflow-hidden rounded-[20px] border border-zinc-200/70 bg-white p-1.5 shadow-[0_16px_40px_-14px_rgba(15,23,42,0.28)]">
          {showRecent && (
            <div className="px-2 pb-1 pt-1.5">
              <p className="px-1 pb-1 text-[10px] font-black uppercase tracking-widest text-slate-300">
                Pesquisas recentes
              </p>
              {recent.map((term) => (
                <button
                  key={term}
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => pickSuggestion(term)}
                  className="flex w-full items-center gap-2.5 rounded-xl px-2 py-2 text-left transition-colors hover:bg-slate-50"
                >
                  <Clock size={13} strokeWidth={2.2} className="flex-shrink-0 text-slate-300" />
                  <span className="truncate text-[13px] font-semibold text-ink">{term}</span>
                </button>
              ))}
            </div>
          )}

          {quickMatches.length > 0 && (
            <div className="px-2 pb-1.5 pt-1">
              <p className="px-1 pb-1 text-[10px] font-black uppercase tracking-widest text-slate-300">
                Produtos
              </p>
              {quickMatches.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => pickSuggestion(p.nome)}
                  className="flex w-full items-center gap-2.5 rounded-xl px-2 py-2 text-left transition-colors hover:bg-slate-50"
                >
                  <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center overflow-hidden rounded-lg bg-slate-100 text-slate-300">
                    {p.fotos?.[0] ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={p.fotos[0]} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <Package size={13} strokeWidth={2} />
                    )}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[13px] font-semibold text-ink">{p.nome}</span>
                    <span className="block truncate text-[11px] font-medium text-slate-400">{p.categoria}</span>
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

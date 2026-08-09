'use client';

import { useState } from 'react';
import { Menu, Bell, Search } from 'lucide-react';
import { MobileSidebarDrawer, type Plano } from './MobileSidebarDrawer';
import { useMobileNav } from './MobileNavContext';

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'S';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

// Placeholder suggestions — swap for real recent/matching results once search is wired up.
const SEARCH_SUGGESTIONS: { base: string; highlight: string }[] = [
  { base: 'Produtos', highlight: '' },
  { base: 'Produtos', highlight: 'em destaque' },
  { base: 'Pedidos', highlight: 'pendentes' },
  { base: 'Pedidos', highlight: 'entregues' },
];

export function TopBar({
  storeName,
  storeUrl,
  logoUrl,
  plano,
}: {
  storeName: string;
  storeUrl: string | null;
  logoUrl?: string | null;
  plano?: Plano;
}) {
  const { menuOpen, openMenu, closeMenu } = useMobileNav();
  const [searchFocused, setSearchFocused] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-30 flex h-16 items-center gap-2 sm:gap-3 bg-white px-3 sm:px-8 shadow-[0_8px_24px_-18px_rgba(0,0,0,0.35)]">
        {/* Hamburger — mobile only, opens the sliding sidebar */}
        <button
          onClick={openMenu}
          aria-label="Abrir menu"
          className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-2xl text-ink transition-colors active:scale-95 hover:bg-slate-100 sm:hidden"
        >
          <Menu size={19} strokeWidth={2.2} />
        </button>

        {/* Compact, centered search with room to breathe around the icon */}
        <div className="relative flex flex-1 justify-center">
          <label className="flex h-9 w-full max-w-[200px] items-center gap-2.5 rounded-full border-[1.5px] border-slate-300 bg-white pl-4 pr-3.5 text-slate-500 transition-colors focus-within:border-ink/35 focus-within:ring-2 focus-within:ring-ink/[0.06]">
            <Search size={15} strokeWidth={2.3} className="flex-shrink-0" />
            <input
              type="text"
              placeholder="Pesquisar"
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setTimeout(() => setSearchFocused(false), 120)}
              className="h-full w-full min-w-0 bg-transparent text-[13px] font-semibold text-ink placeholder:text-slate-500 focus:outline-none"
            />
          </label>

          {/* Suggestions card */}
          {searchFocused && (
            <div className="absolute left-1/2 top-full z-40 mt-2 w-[260px] -translate-x-1/2 overflow-hidden rounded-[22px] border border-zinc-200/70 bg-white p-1.5 shadow-[0_16px_40px_-14px_rgba(15,23,42,0.22)]">
              {SEARCH_SUGGESTIONS.map((item, i) => (
                <button
                  key={i}
                  type="button"
                  className="flex w-full items-center gap-2.5 rounded-2xl px-3 py-2.5 text-left transition-colors hover:bg-slate-50"
                >
                  <Search size={14} strokeWidth={2.2} className="flex-shrink-0 text-slate-400" />
                  <span className="truncate text-[13px] text-slate-400">
                    {item.base}
                    {item.highlight && <span className="font-semibold text-ink"> {item.highlight}</span>}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="ml-auto flex flex-shrink-0 items-center gap-2.5 sm:gap-3">
          {/* Notifications */}
          <button
            aria-label="Notificações"
            className="relative flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-2xl text-ink transition-colors active:scale-95 hover:bg-slate-100"
          >
            <Bell size={18} strokeWidth={2.2} />
            <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-brand ring-2 ring-white" />
          </button>

          {/* Profile */}
          <button
            aria-label="Perfil"
            className="flex h-8 w-8 flex-shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-brand to-orange-700 text-[11px] font-black text-white shadow-sm shadow-brand/20 transition-transform active:scale-95"
          >
            {logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logoUrl} alt={storeName} className="h-full w-full object-cover" />
            ) : (
              <span>{initials(storeName)}</span>
            )}
          </button>
        </div>
      </header>

      <MobileSidebarDrawer
        open={menuOpen}
        onClose={closeMenu}
        storeName={storeName}
        storeUrl={storeUrl}
        logoUrl={logoUrl}
        plano={plano}
      />
    </>
  );
}

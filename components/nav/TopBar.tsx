'use client';

import { Menu, Bell, Search } from 'lucide-react';
import { MobileSidebarDrawer, type Plano } from './MobileSidebarDrawer';
import { useMobileNav } from './MobileNavContext';

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'S';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

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

  return (
    <>
      <header className="sticky top-0 z-30 bg-[#FAFAFA]/92 backdrop-blur-xl px-3 sm:px-8 pt-3 sm:pt-4 pb-3">
        <div className="flex h-14 items-center gap-2 sm:gap-3 rounded-[20px] border border-zinc-200/70 bg-white pl-2.5 pr-2 sm:pl-3 sm:pr-2.5 shadow-[0_10px_30px_-16px_rgba(0,0,0,0.22)]">
          {/* Hamburger — mobile only, opens the sliding sidebar */}
          <button
            onClick={openMenu}
            aria-label="Abrir menu"
            className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-2xl text-ink transition-colors active:scale-95 hover:bg-slate-100 sm:hidden"
          >
            <Menu size={19} strokeWidth={2.2} />
          </button>

          {/* Compact search — clearly bordered, not a flat gray fill */}
          <label className="flex h-9 flex-1 max-w-[240px] items-center gap-2 rounded-full border border-slate-200 bg-white px-3.5 text-slate-400 transition-colors focus-within:border-ink/25 focus-within:ring-2 focus-within:ring-ink/[0.06]">
            <Search size={15} strokeWidth={2.2} className="flex-shrink-0" />
            <input
              type="text"
              placeholder="Pesquisar produtos ou pe..."
              className="h-full w-full min-w-0 bg-transparent text-[13px] font-medium text-ink placeholder:text-slate-400 focus:outline-none"
            />
          </label>

          <div className="ml-auto flex flex-shrink-0 items-center gap-1 sm:gap-1.5">
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

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
      <header className="sticky top-0 z-30 flex h-16 items-center gap-2 sm:gap-3 border-b border-slate-100 bg-white/85 backdrop-blur-xl px-3 sm:px-8">
        {/* Hamburger — mobile only, opens the sliding sidebar */}
        <button
          onClick={openMenu}
          aria-label="Abrir menu"
          className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-2xl text-ink transition-colors active:scale-95 hover:bg-slate-100 sm:hidden"
        >
          <Menu size={20} strokeWidth={2.2} />
        </button>

        {/* Compact search */}
        <label className="flex h-10 flex-1 max-w-md items-center gap-2 rounded-full bg-slate-100/80 px-4 text-slate-400 transition-colors focus-within:bg-white focus-within:ring-1 focus-within:ring-slate-200">
          <Search size={16} strokeWidth={2.2} className="flex-shrink-0" />
          <input
            type="text"
            placeholder="Pesquisar produtos ou pe..."
            className="h-full w-full min-w-0 bg-transparent text-[13px] font-medium text-ink placeholder:text-slate-400 focus:outline-none"
          />
        </label>

        <div className="ml-auto flex flex-shrink-0 items-center gap-2 sm:gap-3">
          {/* Notifications */}
          <button
            aria-label="Notificações"
            className="relative flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-2xl text-ink transition-colors active:scale-95 hover:bg-slate-100"
          >
            <Bell size={19} strokeWidth={2.2} />
            <span className="absolute right-2.5 top-2.5 h-2 w-2 rounded-full bg-brand ring-2 ring-white" />
          </button>

          {/* Profile */}
          <button
            aria-label="Perfil"
            className="flex h-10 w-10 flex-shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-brand to-orange-700 text-[12px] font-black text-white shadow-sm shadow-brand/20 transition-transform active:scale-95"
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

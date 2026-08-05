'use client';

import { Menu, Bell } from 'lucide-react';
import { MobileSidebarDrawer, type Plano } from './MobileSidebarDrawer';
import { useMobileNav } from './MobileNavContext';

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
      <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-100 bg-white px-3 sm:h-auto sm:border-none sm:bg-transparent sm:px-8 sm:py-6 relative">
        {/* Hamburger — mobile only, opens the sliding sidebar */}
        <button
          onClick={openMenu}
          aria-label="Abrir menu"
          className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full text-ink transition-colors active:scale-95 hover:bg-slate-100 sm:hidden"
        >
          <Menu size={21} strokeWidth={2.3} />
        </button>

        {/* Desktop greeting (hidden on mobile, where the name sits centered instead) */}
        <div className="hidden sm:block">
          <p className="mb-0.5 text-[10px] font-black uppercase tracking-widest text-slate-400">
            Bem-vindo de volta
          </p>
          <h1 className="max-w-none truncate text-2xl font-black tracking-tight text-ink">{storeName}</h1>
        </div>

        {/* Centered store name — mobile only */}
        <h1 className="pointer-events-none absolute left-1/2 top-1/2 max-w-[55%] -translate-x-1/2 -translate-y-1/2 truncate text-center font-display text-[15px] font-black tracking-tight text-ink sm:hidden">
          {storeName}
        </h1>

        {/* Notifications */}
        <button
          aria-label="Notificações"
          className="relative flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full text-ink transition-colors active:scale-95 hover:bg-slate-100"
        >
          <Bell size={19} strokeWidth={2.2} />
          <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-brand ring-2 ring-white" />
        </button>
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

'use client';

import { Menu, Bell } from 'lucide-react';
import { MobileSidebarDrawer, type Plano } from './MobileSidebarDrawer';
import { useMobileNav } from './MobileNavContext';
import { cn } from '@/lib/cn';

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

  const floatingSurface =
    'flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl bg-white/80 backdrop-blur-xl ring-1 ring-black/[0.045] shadow-[0_4px_16px_rgba(15,23,42,0.05)] text-ink transition-colors active:scale-95 hover:bg-white';

  return (
    <>
      {/* No fixed bar — the hamburger and notifications float independently and stay
          put while the page scrolls, so nothing draws a hard line across the top. */}
      <button
        onClick={openMenu}
        aria-label="Abrir menu"
        className={cn('fixed left-4 top-4 z-30 sm:hidden', floatingSurface)}
      >
        <Menu size={19} strokeWidth={2.2} />
      </button>

      <button
        aria-label="Notificações"
        className={cn('fixed right-4 top-4 z-30 relative', floatingSurface)}
      >
        <Bell size={18} strokeWidth={2.2} />
        <span className="absolute right-2.5 top-2.5 h-2 w-2 rounded-full bg-brand ring-2 ring-white" />
      </button>

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

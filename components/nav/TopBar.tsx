'use client';

import { useEffect, useState } from 'react';
import { Menu, Bell } from 'lucide-react';
import { cn } from '@/lib/cn';
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
  hasUnreadNotifications = true,
}: {
  storeName: string;
  storeUrl: string | null;
  logoUrl?: string | null;
  plano?: Plano;
  /** Controls the small dot on the bell — only shown while there's something unread. */
  hasUnreadNotifications?: boolean;
}) {
  const { menuOpen, openMenu, closeMenu } = useMobileNav();

  // Merges with the page at rest; picks up a soft blurred surface once the
  // user actually scrolls, so the header never competes with page content.
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <>
      <header
        className={cn(
          'sticky top-0 z-30 flex h-16 items-center gap-3 px-3 sm:px-8',
          'transition-[background-color,backdrop-filter,box-shadow,border-color] duration-200 ease-out',
          scrolled
            ? 'border-b border-[rgba(28,25,23,0.08)] bg-[rgba(250,250,249,0.88)] shadow-[0_1px_0_rgba(28,25,23,0.04),0_8px_20px_-16px_rgba(28,25,23,0.12)] backdrop-blur-md'
            : 'border-b border-transparent bg-transparent shadow-none backdrop-blur-none',
        )}
      >
        {/* Hamburger — mobile only, opens the sliding sidebar */}
        <button
          onClick={openMenu}
          aria-label="Abrir menu"
          className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-2xl text-ink transition-colors active:scale-95 hover:bg-black/[0.04] sm:hidden"
        >
          <Menu size={19} strokeWidth={2.2} />
        </button>

        {/* Wordmark */}
        <span className="font-display text-[17px] font-black tracking-tighter text-ink sm:text-lg">
          Shopyump
        </span>

        <div className="ml-auto flex flex-shrink-0 items-center gap-2.5 sm:gap-3">
          {/* Notifications */}
          <button
            aria-label="Notificações"
            className="relative flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-2xl text-ink transition-colors active:scale-95 hover:bg-black/[0.04]"
          >
            <Bell size={18} strokeWidth={2.2} />
            {hasUnreadNotifications && (
              <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-brand ring-2 ring-white" />
            )}
          </button>

          {/* Profile */}
          <button
            aria-label="Perfil"
            className="flex h-9 w-9 flex-shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-brand to-orange-700 text-[12px] font-black text-white shadow-sm shadow-brand/20 transition-transform active:scale-95"
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

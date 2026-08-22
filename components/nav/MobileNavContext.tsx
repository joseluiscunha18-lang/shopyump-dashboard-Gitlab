'use client';

import { createContext, useContext, useState, type ReactNode } from 'react';

interface MobileNavContextValue {
  menuOpen: boolean;
  openMenu: () => void;
  closeMenu: () => void;
  bottomBarHidden: boolean;
  hideBottomBar: () => void;
  showBottomBar: () => void;
}

const MobileNavContext = createContext<MobileNavContextValue | null>(null);

/**
 * Shares the sidebar's open/closed state between TopBar (which owns the
 * hamburger trigger) and BottomNav (which needs to slide out of the way
 * while the sidebar is open, so the two surfaces never visually clash).
 *
 * Also shares `bottomBarHidden`, used by focused full-screen flows (e.g. the
 * product form) to tuck the bottom nav away while the flow is active. The
 * flow's own header owns the back/cancel action in its place.
 */
export function MobileNavProvider({ children }: { children: ReactNode }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [bottomBarHidden, setBottomBarHidden] = useState(false);

  return (
    <MobileNavContext.Provider
      value={{
        menuOpen,
        openMenu: () => setMenuOpen(true),
        closeMenu: () => setMenuOpen(false),
        bottomBarHidden,
        hideBottomBar: () => setBottomBarHidden(true),
        showBottomBar: () => setBottomBarHidden(false),
      }}
    >
      {children}
    </MobileNavContext.Provider>
  );
}

export function useMobileNav() {
  const ctx = useContext(MobileNavContext);
  if (!ctx) throw new Error('useMobileNav must be used within a MobileNavProvider');
  return ctx;
}

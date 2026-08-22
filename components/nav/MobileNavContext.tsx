'use client';

import { createContext, useContext, useState, type ReactNode } from 'react';

interface MobileNavContextValue {
  menuOpen: boolean;
  openMenu: () => void;
  closeMenu: () => void;
  bottomBarHidden: boolean;
  hideBottomBar: () => void;
  showBottomBar: () => void;
  topBarHidden: boolean;
  hideTopBar: () => void;
  showTopBar: () => void;
}

const MobileNavContext = createContext<MobileNavContextValue | null>(null);

/**
 * Shares the sidebar's open/closed state between TopBar (which owns the
 * hamburger trigger) and BottomNav (which needs to slide out of the way
 * while the sidebar is open, so the two surfaces never visually clash).
 *
 * Also shares `bottomBarHidden`/`topBarHidden`, used by focused full-screen
 * flows (e.g. the product form) to tuck the standard chrome away while the
 * flow is active. The flow's own header owns back/cancel and any secondary
 * actions in its place.
 */
export function MobileNavProvider({ children }: { children: ReactNode }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [bottomBarHidden, setBottomBarHidden] = useState(false);
  const [topBarHidden, setTopBarHidden] = useState(false);

  return (
    <MobileNavContext.Provider
      value={{
        menuOpen,
        openMenu: () => setMenuOpen(true),
        closeMenu: () => setMenuOpen(false),
        bottomBarHidden,
        hideBottomBar: () => setBottomBarHidden(true),
        showBottomBar: () => setBottomBarHidden(false),
        topBarHidden,
        hideTopBar: () => setTopBarHidden(true),
        showTopBar: () => setTopBarHidden(false),
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

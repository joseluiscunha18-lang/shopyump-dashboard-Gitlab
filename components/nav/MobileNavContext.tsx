'use client';

import { createContext, useContext, useState, type ReactNode } from 'react';

interface MobileNavContextValue {
  menuOpen: boolean;
  openMenu: () => void;
  closeMenu: () => void;
}

const MobileNavContext = createContext<MobileNavContextValue | null>(null);

/**
 * Shares the sidebar's open/closed state between TopBar (which owns the
 * hamburger trigger) and BottomNav (which needs to slide out of the way
 * while the sidebar is open, so the two surfaces never visually clash).
 */
export function MobileNavProvider({ children }: { children: ReactNode }) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <MobileNavContext.Provider
      value={{
        menuOpen,
        openMenu: () => setMenuOpen(true),
        closeMenu: () => setMenuOpen(false),
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

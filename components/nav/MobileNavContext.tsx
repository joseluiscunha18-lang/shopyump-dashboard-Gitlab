'use client';

import { createContext,useContext,useState,type ReactNode } from 'react';
const Context=createContext<{menuOpen:boolean;openMenu:()=>void;closeMenu:()=>void;desktopCollapsed:boolean;toggleDesktop:()=>void}|null>(null);
export function MobileNavProvider({children}:{children:ReactNode}){const [menuOpen,set]=useState(false);const [desktopCollapsed,collapse]=useState(false);return <Context.Provider value={{menuOpen,openMenu:()=>set(true),closeMenu:()=>set(false),desktopCollapsed,toggleDesktop:()=>collapse(v=>!v)}}>{children}</Context.Provider>}
export function useMobileNav(){const c=useContext(Context);if(!c)throw new Error('Navigation unavailable');return c}

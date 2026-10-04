"use client";

import { createContext, useContext } from "react";

/**
 * Elemento onde os pop-ups do editor (diálogos, menus, selects) são desenhados.
 * Fica DENTRO de `.ed-root`, para herdarem as variáveis de estilo do editor
 * sem afetar o resto do painel (por omissão o Radix desenha-os no <body>).
 */
export const PortalContainerContext = createContext<HTMLElement | null>(null);
export const usePortalContainer = () => useContext(PortalContainerContext);

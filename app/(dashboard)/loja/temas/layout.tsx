import type { ReactNode } from 'react';

/**
 * Layout próprio da área de temas — substitui completamente o layout do
 * dashboard nesta rota. Sem TopBar, sem BottomNav, sem Sidebar.
 * O ThemeCatalog desenha o seu próprio cabeçalho e controla toda a navegação.
 */
export default function TemasLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-[#F6F7F9]">
      {children}
    </div>
  );
}

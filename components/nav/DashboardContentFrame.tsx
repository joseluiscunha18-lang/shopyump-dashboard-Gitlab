'use client';

import { usePathname } from 'next/navigation';
import { isFocusModePath } from '@/lib/nav/productFormFlow';
import { cn } from '@/lib/cn';

/**
 * O `pb-28` no wrapper do conteúdo existe só para reservar o espaço que
 * a `<BottomNav />` fixa ocupa no mobile. Em rotas de "foco" (fluxo de
 * produto, "Personalizar loja") a barra não é mostrada — sem este
 * componente, o espaço reservado para ela continuava lá, sobrando em
 * baixo exatamente onde a pré-visualização precisava de altura.
 */
export function DashboardContentFrame({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const focusMode = isFocusModePath(pathname);

  return <div className={cn('flex-1 flex flex-col min-w-0', focusMode ? 'pb-0' : 'pb-28 sm:pb-0')}>{children}</div>;
}

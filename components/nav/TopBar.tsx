'use client';

import { useEffect, useRef, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Menu, Bell, ChevronLeft, MoreVertical, FileText, Trash2, HelpCircle } from 'lucide-react';
import { cn } from '@/lib/cn';
import { MobileSidebarDrawer, type Plano } from './MobileSidebarDrawer';
import { useMobileNav } from './MobileNavContext';
import { useProductFormGuard } from '@/components/produtos/ProductFormGuardContext';
import { isProductFormFlowPath, productFormFlowTitle } from '@/lib/nav/productFormFlow';

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
  const pathname = usePathname();
  const router = useRouter();
  const { requestExit } = useProductFormGuard();
  const [actionsOpen, setActionsOpen] = useState(false);
  const actionsRef = useRef<HTMLDivElement>(null);

  // Rotas de criar/editar produto: a TopBar deixa de ser a barra padrão e
  // vira o cabeçalho do fluxo (seta + título + ⋮). `inFlow` vem do pathname,
  // já disponível na primeira renderização — nunca aparece a barra padrão
  // antes de trocar, evitando qualquer flash.
  const inFlow = isProductFormFlowPath(pathname);

  // Merges with the page at rest; picks up a soft blurred surface once the
  // user actually scrolls, so the header never competes with page content.
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (!actionsOpen) return;
    function onClickOutside(e: MouseEvent) {
      if (actionsRef.current && !actionsRef.current.contains(e.target as Node)) setActionsOpen(false);
    }
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, [actionsOpen]);

  // Fecha o menu de ações se a rota mudar (ex.: seta/voltar navegou).
  useEffect(() => {
    setActionsOpen(false);
  }, [pathname]);

  if (inFlow) {
    return (
      <header
        className={cn(
          'sticky top-0 z-30 flex h-16 items-center px-3 sm:px-8',
          'border-b border-[rgba(28,25,23,0.08)] bg-[rgba(250,250,249,0.88)] backdrop-blur-md',
        )}
      >
        {/* Zona esquerda — mesma largura que a direita, para o título ficar
            realmente centrado entre as duas (3 zonas simétricas). */}
        <div className="flex flex-1 items-center justify-start">
          <button
            type="button"
            onClick={() => requestExit(() => router.back())}
            aria-label="Voltar"
            className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-2xl text-ink transition-colors active:scale-95 hover:bg-black/[0.04]"
          >
            <ChevronLeft size={22} strokeWidth={2.2} />
          </button>
        </div>

        <h1 className="flex-shrink-0 truncate px-2 text-center text-[16px] font-extrabold tracking-tight text-ink sm:text-[17px]">
          {productFormFlowTitle(pathname)}
        </h1>

        <div className="flex flex-1 items-center justify-end">
          <div className="relative flex-shrink-0" ref={actionsRef}>
            <button
              type="button"
              onClick={() => setActionsOpen((v) => !v)}
              aria-label="Mais ações"
              aria-expanded={actionsOpen}
              className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-2xl text-ink transition-colors active:scale-95 hover:bg-black/[0.04]"
            >
              <MoreVertical size={19} strokeWidth={2.2} />
            </button>

            {actionsOpen && (
              <div className="absolute right-0 top-11 z-50 w-52 overflow-hidden rounded-[16px] border border-[#E5E3E0] bg-white py-1.5 shadow-[0_12px_32px_-8px_rgba(0,0,0,0.18)]">
                <button
                  type="button"
                  onClick={() => setActionsOpen(false)}
                  className="flex w-full items-center gap-2.5 px-3.5 py-2.5 text-left text-[13px] font-semibold text-[#3F3F46] hover:bg-[#F4F4F3]"
                >
                  <FileText size={16} strokeWidth={2} />
                  Guardar como rascunho
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setActionsOpen(false);
                    requestExit(() => router.push('/produtos'));
                  }}
                  className="flex w-full items-center gap-2.5 px-3.5 py-2.5 text-left text-[13px] font-semibold text-[#B91C1C] hover:bg-[#FEF2F2]"
                >
                  <Trash2 size={16} strokeWidth={2} />
                  Descartar alterações
                </button>
                <div className="my-1 h-px bg-[#E5E3E0]" />
                <button
                  type="button"
                  onClick={() => setActionsOpen(false)}
                  className="flex w-full items-center gap-2.5 px-3.5 py-2.5 text-left text-[13px] font-semibold text-[#3F3F46] hover:bg-[#F4F4F3]"
                >
                  <HelpCircle size={16} strokeWidth={2} />
                  Ajuda
                </button>
              </div>
            )}
          </div>
        </div>
      </header>
    );
  }

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

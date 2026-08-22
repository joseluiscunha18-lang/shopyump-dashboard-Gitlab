'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, MoreVertical, FileText, Trash2, HelpCircle } from 'lucide-react';
import { useMobileNav } from '@/components/nav/MobileNavContext';
import { cn } from '@/lib/cn';

/**
 * Cabeçalho do fluxo de produto (criar/editar). Enquanto este componente
 * está montado, a TopBar e a barra inferior mobile ficam ocultas — o fluxo
 * passa a ter apenas esta seta de voltar e o menu de "⋮" como saída/ações.
 * Tudo volta ao normal ao desmontar, seja por "Voltar", por cancelar, ou
 * por gravar com sucesso (qualquer navegação para fora da página desmonta
 * este componente).
 */
export function ProductFormHeader({ mode }: { mode: 'criar' | 'editar' }) {
  const router = useRouter();
  const { hideBottomBar, showBottomBar, hideTopBar, showTopBar } = useMobileNav();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    hideBottomBar();
    hideTopBar();
    return () => {
      showBottomBar();
      showTopBar();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!menuOpen) return;
    function onClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    }
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, [menuOpen]);

  const title = mode === 'criar' ? 'Adicionar produto' : 'Editar produto';

  return (
    <div className="flex items-center justify-between gap-2.5 pt-2">
      <div className="flex items-center gap-2.5">
        <button
          type="button"
          onClick={() => router.back()}
          aria-label="Voltar"
          className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-2xl text-[#3F3F46] transition-colors active:scale-95 hover:bg-black/[0.04]"
        >
          <ArrowLeft size={20} strokeWidth={2.2} />
        </button>
        <h2 className="text-[19px] font-extrabold leading-tight tracking-tight text-[#111110]">
          {title}
        </h2>
      </div>

      <div className="relative" ref={menuRef}>
        <button
          type="button"
          onClick={() => setMenuOpen((v) => !v)}
          aria-label="Mais ações"
          aria-expanded={menuOpen}
          className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-2xl text-[#3F3F46] transition-colors active:scale-95 hover:bg-black/[0.04]"
        >
          <MoreVertical size={19} strokeWidth={2.2} />
        </button>

        {menuOpen && (
          <div
            className={cn(
              'absolute right-0 top-11 z-50 w-52 overflow-hidden rounded-[16px] border border-[#E5E3E0] bg-white py-1.5 shadow-[0_12px_32px_-8px_rgba(0,0,0,0.18)]',
            )}
          >
            <button
              type="button"
              onClick={() => setMenuOpen(false)}
              className="flex w-full items-center gap-2.5 px-3.5 py-2.5 text-left text-[13px] font-semibold text-[#3F3F46] hover:bg-[#F4F4F3]"
            >
              <FileText size={16} strokeWidth={2} />
              Guardar como rascunho
            </button>
            <button
              type="button"
              onClick={() => {
                setMenuOpen(false);
                router.push('/produtos');
              }}
              className="flex w-full items-center gap-2.5 px-3.5 py-2.5 text-left text-[13px] font-semibold text-[#B91C1C] hover:bg-[#FEF2F2]"
            >
              <Trash2 size={16} strokeWidth={2} />
              Descartar alterações
            </button>
            <div className="my-1 h-px bg-[#E5E3E0]" />
            <button
              type="button"
              onClick={() => setMenuOpen(false)}
              className="flex w-full items-center gap-2.5 px-3.5 py-2.5 text-left text-[13px] font-semibold text-[#3F3F46] hover:bg-[#F4F4F3]"
            >
              <HelpCircle size={16} strokeWidth={2} />
              Ajuda
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

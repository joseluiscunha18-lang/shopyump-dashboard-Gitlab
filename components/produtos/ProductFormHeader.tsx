'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { useMobileNav } from '@/components/nav/MobileNavContext';

/**
 * Cabeçalho do fluxo de produto (criar/editar). Enquanto este componente
 * está montado, a barra inferior mobile fica oculta — o fluxo passa a ter
 * apenas esta seta de voltar como saída. A barra volta a aparecer sozinha
 * ao desmontar, seja por "Voltar", por cancelar, ou por gravar com sucesso
 * (qualquer navegação para fora da página desmonta este componente).
 */
export function ProductFormHeader({ mode }: { mode: 'criar' | 'editar' }) {
  const router = useRouter();
  const { hideBottomBar, showBottomBar } = useMobileNav();

  useEffect(() => {
    hideBottomBar();
    return () => showBottomBar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const title = mode === 'criar' ? 'Adicionar produto' : 'Editar produto';

  return (
    <div className="flex items-center gap-2.5 pt-2">
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
  );
}

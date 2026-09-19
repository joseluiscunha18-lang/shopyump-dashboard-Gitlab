'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ExternalLink, Check, ArrowUpRight } from 'lucide-react';
import { cn } from '@/lib/cn';
import { ThemeThumbnail } from '@/components/loja/preview/ThemeThumbnail';
import { StorePreview } from '@/components/loja/preview/StorePreview';
import { THEMES, type Theme } from '@/types/theme';
import { previewStore, previewProducts } from '@/lib/mocks/storePreview';
import { loadCustomization, saveCustomization } from '@/lib/customize/storage';
import { useToast } from '@/components/ui/Toast';

const LOJA_ID = 'demo';

// ─── Overlay de preview ──────────────────────────────────────────────────────

function PreviewOverlay({ theme, onClose }: { theme: Theme; onClose: () => void }) {
  const { show } = useToast();
  const emUso = loadCustomization(LOJA_ID).temaId === theme.id;

  function usarTema() {
    const atual = loadCustomization(LOJA_ID);
    saveCustomization(LOJA_ID, { ...atual, temaId: theme.id });
    show('Tema aplicado.');
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col">
      {/* Barra escura */}
      <div className="flex shrink-0 items-center justify-between bg-[#111110] px-4 py-3">
        <button
          type="button"
          onClick={onClose}
          className="flex items-center gap-1.5 text-[13px] font-bold text-white/70 active:opacity-60"
        >
          <ArrowLeft size={15} />
          Voltar
        </button>

        <button
          type="button"
          onClick={usarTema}
          disabled={emUso}
          className={cn(
            'flex items-center gap-1.5 rounded-full px-5 py-2 text-[13px] font-bold transition-colors',
            emUso
              ? 'bg-white/10 text-white/40'
              : 'bg-white text-[#111110] active:opacity-80'
          )}
        >
          {emUso && <Check size={13} />}
          {emUso ? 'Em uso' : 'Usar este tema'}
        </button>
      </div>

      {/* Loja a 90-95% do ecrã — scroll da página, não de caixa interna */}
      <div className="flex-1 overflow-y-auto" style={{ backgroundColor: theme.colors.surface }}>
        <StorePreview
          theme={theme}
          store={previewStore}
          products={previewProducts}
          flow
        />
      </div>
    </div>
  );
}

// ─── Catálogo ────────────────────────────────────────────────────────────────

export function ThemeCatalog() {
  const router = useRouter();
  const { show } = useToast();
  const [previewTheme, setPreviewTheme] = useState<Theme | null>(null);

  const temaAtualId = loadCustomization(LOJA_ID).temaId;

  function usarTema(theme: Theme, e: React.MouseEvent) {
    e.stopPropagation();
    const atual = loadCustomization(LOJA_ID);
    saveCustomization(LOJA_ID, { ...atual, temaId: theme.id });
    show('Tema aplicado.');
  }

  return (
    <>
      <div className="mx-auto flex max-w-2xl flex-col">
        {/* Cabeçalho próprio — sem logo, sem sino */}
        <header className="sticky top-0 z-20 flex items-center justify-between border-b border-[#E5E3E0] bg-[#F6F7F9]/90 px-4 py-3 backdrop-blur-md">
          <button
            type="button"
            onClick={() => router.push('/loja')}
            className="flex items-center gap-1 text-[13px] font-bold text-slate-600 active:opacity-60"
          >
            <ArrowLeft size={15} />
            Editar loja
          </button>

          <button
            type="button"
            onClick={() => window.open('/', '_blank')}
            className="flex items-center gap-1 text-[13px] font-bold text-slate-500 active:opacity-60"
          >
            Ver loja
            <ArrowUpRight size={14} />
          </button>
        </header>

        <div className="flex flex-col gap-6 px-4 py-6">
          {/* Título */}
          <div>
            <h1 className="text-[22px] font-black tracking-tight text-[#111110]">Temas</h1>
            <p className="mt-0.5 text-[13px] font-medium text-slate-400">
              Escolha uma aparência para sua loja.
            </p>
          </div>

          {/* Grelha de temas */}
          <div className="grid grid-cols-2 gap-4">
            {THEMES.map((theme) => {
              const emUso = temaAtualId === theme.id;

              return (
                <div key={theme.id} className="flex flex-col gap-2">
                  {/* Miniatura — ocupa toda a largura, clicável */}
                  <button
                    type="button"
                    onClick={() => setPreviewTheme(theme)}
                    className="group relative w-full overflow-hidden rounded-[14px] border border-[#E5E3E0] bg-white shadow-[0_1px_3px_rgba(15,23,42,0.06)] active:opacity-80"
                    aria-label={`Ver loja modelo — ${theme.name}`}
                  >
                    <div className="h-44">
                      <ThemeThumbnail theme={theme} />
                    </div>
                  </button>

                  {/* Nome + estado / CTA */}
                  <div className="flex flex-col gap-1 px-0.5">
                    <span className="text-[13px] font-black text-[#111110]">{theme.name}</span>

                    {emUso ? (
                      <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-600">
                        <Check size={12} />
                        Em uso
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setPreviewTheme(theme)}
                        className="text-left text-[11px] font-bold text-slate-400 active:opacity-60"
                      >
                        Ver loja modelo →
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Overlay de preview */}
      {previewTheme && (
        <PreviewOverlay theme={previewTheme} onClose={() => setPreviewTheme(null)} />
      )}
    </>
  );
}

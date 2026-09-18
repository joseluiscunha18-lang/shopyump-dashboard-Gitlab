'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { ChevronLeft, Search, ArrowLeft, Check } from 'lucide-react';
import { cn } from '@/lib/cn';
import { ThemeThumbnail } from '@/components/loja/preview/ThemeThumbnail';
import { StorePreview } from '@/components/loja/preview/StorePreview';
import { THEMES, type Theme } from '@/types/theme';
import { previewStore, previewProducts } from '@/lib/mocks/storePreview';
import { loadCustomization, saveCustomization } from '@/lib/customize/storage';
import { useToast } from '@/components/ui/Toast';

type Filtro = 'todos' | 'gratis' | 'premium';

const FILTROS: { id: Filtro; label: string }[] = [
  { id: 'todos', label: 'Todos' },
  { id: 'gratis', label: 'Grátis' },
  { id: 'premium', label: 'Premium' },
];

// Loja simulada usada no preview — dados fixos de demonstração
const LOJA_ID = 'demo';

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
    <div className="fixed inset-0 z-50 flex flex-col" style={{ backgroundColor: theme.colors.surface }}>
      {/* Barra escura no topo */}
      <div className="sticky top-0 z-10 flex shrink-0 items-center justify-between bg-[#111110] px-4 py-3">
        <button
          type="button"
          onClick={onClose}
          className="flex items-center gap-1.5 text-[13px] font-bold text-white/80 active:opacity-60"
        >
          <ArrowLeft size={16} />
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

      {/* Preview ocupa os restantes 90–95% da tela e faz scroll normalmente */}
      <div className="flex-1 overflow-y-auto">
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

export function ThemeCatalog() {
  const [busca, setBusca] = useState('');
  const [filtro, setFiltro] = useState<Filtro>('todos');
  const [previewTheme, setPreviewTheme] = useState<Theme | null>(null);

  const temas = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    return THEMES.filter((t) => {
      const passaFiltro = filtro === 'todos' || t.pricing === filtro;
      const passaBusca = !termo || t.name.toLowerCase().includes(termo) || t.tagline.toLowerCase().includes(termo);
      return passaFiltro && passaBusca;
    });
  }, [busca, filtro]);

  return (
    <>
      <div className="flex flex-col gap-4 pt-2">
        <Link href="/loja" className="flex items-center gap-1 text-[13px] font-bold text-slate-500">
          <ChevronLeft size={18} /> Editar loja
        </Link>

        <div>
          <h2 className="text-lg font-black tracking-tight text-ink">Temas</h2>
          <p className="text-[12px] font-medium text-slate-400">Escolha uma aparência para sua loja.</p>
        </div>

        {/* Busca */}
        <div className="relative">
          <Search size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Procurar tema"
            className="h-11 w-full rounded-[13px] border border-[#E5E3E0] bg-white pl-10 pr-4 text-[13px] font-medium text-ink placeholder:text-slate-400 focus:border-[#111110] focus:outline-none"
          />
        </div>

        {/* Filtros */}
        <div className="flex gap-2">
          {FILTROS.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setFiltro(f.id)}
              className={cn(
                'rounded-full px-4 py-1.5 text-[12px] font-bold transition-colors',
                filtro === f.id ? 'bg-[#111110] text-white' : 'bg-[#F4F4F3] text-slate-500'
              )}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Grid de temas */}
        {temas.length === 0 ? (
          <p className="py-10 text-center text-[13px] font-medium text-slate-400">Nenhum tema encontrado.</p>
        ) : (
          <div className="grid grid-cols-2 gap-3.5">
            {temas.map((theme) => (
              <div
                key={theme.id}
                className="flex flex-col overflow-hidden rounded-[16px] border border-[#E5E3E0]"
              >
                {/* Miniatura — clicar abre o preview */}
                <button
                  type="button"
                  onClick={() => setPreviewTheme(theme)}
                  className="h-32 w-full transition-opacity active:opacity-80"
                  aria-label={`Ver loja modelo do tema ${theme.name}`}
                >
                  <ThemeThumbnail theme={theme} />
                </button>

                {/* Nome + selo + CTA */}
                <div className="flex flex-col gap-2 px-3 py-2.5">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-[12.5px] font-black text-ink">{theme.name}</span>
                    <span
                      className={cn(
                        'w-fit rounded-full px-2 py-0.5 text-[9.5px] font-bold',
                        theme.pricing === 'gratis' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'
                      )}
                    >
                      {theme.pricing === 'gratis' ? 'Grátis' : 'Premium'}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => setPreviewTheme(theme)}
                    className="w-full rounded-[10px] bg-[#111110] py-1.5 text-[11px] font-bold text-white active:opacity-80"
                  >
                    Ver loja modelo
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Overlay de preview — montado fora do scroll da lista */}
      {previewTheme && (
        <PreviewOverlay theme={previewTheme} onClose={() => setPreviewTheme(null)} />
      )}
    </>
  );
}

'use client';

import { useMemo, useState } from 'react';
import { Search, SlidersHorizontal, Check, ArrowLeft, X } from 'lucide-react';
import { cn } from '@/lib/cn';
import { ThemeThumbnail } from '@/components/loja/preview/ThemeThumbnail';
import { StorePreview } from '@/components/loja/preview/StorePreview';
import { THEMES, type Theme } from '@/types/theme';
import { previewStore, previewProducts } from '@/lib/mocks/storePreview';
import { loadCustomization, saveCustomization } from '@/lib/customize/storage';
import { useToast } from '@/components/ui/Toast';

const LOJA_ID = 'demo';

type Filtro = 'todos' | 'gratis' | 'premium';

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
            emUso ? 'bg-white/10 text-white/40' : 'bg-white text-[#111110] active:opacity-80'
          )}
        >
          {emUso && <Check size={13} />}
          {emUso ? 'Em uso' : 'Usar este tema'}
        </button>
      </div>
      <div className="flex-1 overflow-y-auto" style={{ backgroundColor: theme.colors.surface }}>
        <StorePreview theme={theme} store={previewStore} products={previewProducts} flow />
      </div>
    </div>
  );
}

// ─── Catálogo ────────────────────────────────────────────────────────────────

export function ThemeCatalog() {
  const [busca, setBusca] = useState('');
  const [filtro, setFiltro] = useState<Filtro>('todos');
  const [filtrosAbertos, setFiltrosAbertos] = useState(false);
  const [previewTheme, setPreviewTheme] = useState<Theme | null>(null);

  const temaAtualId = loadCustomization(LOJA_ID).temaId;

  const temas = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    return THEMES.filter((t) => {
      const passaFiltro = filtro === 'todos' || t.pricing === filtro;
      const passaBusca = !termo || t.name.toLowerCase().includes(termo);
      return passaFiltro && passaBusca;
    });
  }, [busca, filtro]);

  return (
    <>
      <div className="flex flex-col gap-6 py-2">
        {/* Título */}
        <div>
          <h1 className="text-[22px] font-black tracking-tight text-[#111110]">Temas</h1>
          <p className="mt-0.5 text-[13px] font-medium text-slate-400">
            Escolha uma aparência para sua loja.
          </p>
        </div>

        {/* Barra unificada: busca + filtros */}
        <div className="flex flex-col gap-2">
          <div className="flex gap-2">
            {/* Campo de busca */}
            <div className="relative flex-1">
              <Search
                size={15}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="text"
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                placeholder="Procurar tema…"
                className="h-10 w-full rounded-[11px] border border-[#E5E3E0] bg-white pl-9 pr-3 text-[13px] font-medium text-[#111110] placeholder:text-slate-400 focus:border-[#111110] focus:outline-none"
              />
              {busca && (
                <button
                  type="button"
                  onClick={() => setBusca('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 active:opacity-60"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Botão compacto de filtros */}
            <button
              type="button"
              onClick={() => setFiltrosAbertos((v) => !v)}
              className={cn(
                'flex h-10 items-center gap-1.5 rounded-[11px] border px-3.5 text-[13px] font-bold transition-colors',
                filtrosAbertos || filtro !== 'todos'
                  ? 'border-[#111110] bg-[#111110] text-white'
                  : 'border-[#E5E3E0] bg-white text-slate-600'
              )}
            >
              <SlidersHorizontal size={14} />
              Filtros
              {filtro !== 'todos' && (
                <span className="flex h-4 w-4 items-center justify-center rounded-full bg-white/20 text-[10px] font-black">
                  1
                </span>
              )}
            </button>
          </div>

          {/* Chips de filtro — aparecem ao abrir */}
          {filtrosAbertos && (
            <div className="flex gap-2">
              {(['todos', 'gratis', 'premium'] as Filtro[]).map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => { setFiltro(f); setFiltrosAbertos(false); }}
                  className={cn(
                    'rounded-full px-4 py-1.5 text-[12px] font-bold transition-colors',
                    filtro === f ? 'bg-[#111110] text-white' : 'bg-[#F4F4F3] text-slate-500'
                  )}
                >
                  {f === 'todos' ? 'Todos' : f === 'gratis' ? 'Gratuito' : 'Premium'}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Grelha de temas */}
        {temas.length === 0 ? (
          <p className="py-12 text-center text-[13px] font-medium text-slate-400">
            Nenhum tema encontrado.
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            {temas.map((theme) => {
              const emUso = temaAtualId === theme.id;
              return (
                <div key={theme.id} className="flex flex-col gap-2">
                  {/* Card da miniatura com badge sobreposto */}
                  <button
                    type="button"
                    onClick={() => setPreviewTheme(theme)}
                    className="relative w-full overflow-hidden rounded-[14px] border border-[#E5E3E0] bg-white shadow-[0_1px_3px_rgba(15,23,42,0.06)] active:opacity-80"
                    aria-label={`Ver loja modelo — ${theme.name}`}
                  >
                    <div className="h-44">
                      <ThemeThumbnail theme={theme} />
                    </div>

                    {/* Badge Gratuito / Premium sobre a imagem */}
                    <span
                      className={cn(
                        'absolute left-2 top-2 rounded-full px-2.5 py-1 text-[10px] font-black shadow-sm',
                        theme.pricing === 'gratis'
                          ? 'bg-emerald-500 text-white'
                          : 'bg-[#111110] text-white'
                      )}
                    >
                      {theme.pricing === 'gratis' ? 'Gratuito' : 'Premium'}
                    </span>

                    {/* Anel de "em uso" na borda do card */}
                    {emUso && (
                      <span className="absolute inset-0 rounded-[14px] ring-2 ring-inset ring-[#111110]" />
                    )}
                  </button>

                  {/* Nome + estado */}
                  <div className="flex flex-col gap-0.5 px-0.5">
                    <span className="text-[13px] font-black text-[#111110]">{theme.name}</span>
                    {emUso ? (
                      <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-600">
                        <Check size={12} /> Em uso
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
        )}
      </div>

      {previewTheme && (
        <PreviewOverlay theme={previewTheme} onClose={() => setPreviewTheme(null)} />
      )}
    </>
  );
}

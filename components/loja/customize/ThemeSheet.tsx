'use client';

import { Check } from 'lucide-react';
import { Sheet } from '@/components/ui/Sheet';
import { cn } from '@/lib/cn';
import { THEMES, type ThemeId } from '@/types/theme';
import { StorePreview, type StorePreviewSettings } from '@/components/loja/preview/StorePreview';
import type { PreviewProduct, PreviewStoreData } from '@/lib/mocks/storePreview';

/**
 * Lista de temas como cards visuais (§6). Tocar num tema NUNCA aplica de
 * imediato — só chama `onPreview`, que a página usa para atualizar a
 * pré-visualização principal como um estado temporário (§7). A aplicação
 * definitiva só acontece quando o vendedor confirma "Aplicar tema" fora
 * deste sheet.
 */
export function ThemeSheet({
  open,
  onClose,
  appliedThemeId,
  previewingThemeId,
  onPreview,
  store,
  products,
  settings,
}: {
  open: boolean;
  onClose: () => void;
  appliedThemeId: ThemeId;
  previewingThemeId: ThemeId;
  onPreview: (id: ThemeId) => void;
  store: PreviewStoreData;
  products: PreviewProduct[];
  settings?: StorePreviewSettings;
}) {
  return (
    <Sheet open={open} onClose={onClose} title="Tema" subtitle="Escolha uma aparência para sua loja." heightVh={82}>
      <div className="flex flex-col gap-4 pb-4">
        {THEMES.map((theme) => {
          const isApplied = theme.id === appliedThemeId;
          const isPreviewing = theme.id === previewingThemeId;
          return (
            <button
              key={theme.id}
              type="button"
              onClick={() => {
                onPreview(theme.id);
                onClose();
              }}
              className={cn(
                'flex flex-col overflow-hidden rounded-[16px] border-2 text-left transition-colors',
                isPreviewing ? 'border-[#111110]' : 'border-[#E5E3E0]'
              )}
            >
              <div className="h-40 w-full">
                <StorePreview theme={theme} store={store} products={products} settings={settings} size="thumb" />
              </div>
              <div className="flex items-center justify-between px-4 py-3">
                <div className="flex flex-col">
                  <span className="text-[13px] font-black text-ink">{theme.name}</span>
                  <span className="text-[11px] font-medium text-slate-400">{theme.tagline}</span>
                </div>
                {isApplied ? (
                  <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-600">
                    <Check size={14} /> Em uso
                  </span>
                ) : (
                  <span className="text-[11px] font-bold text-slate-500">Visualizar</span>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </Sheet>
  );
}

import { ShoppingBag } from 'lucide-react';
import { cn } from '@/lib/cn';
import type { Theme, ThemeButtonRadius } from '@/types/theme';
import type { PreviewProduct, PreviewStoreData } from '@/lib/mocks/storePreview';
import { previewCategories } from '@/lib/mocks/storePreview';

/**
 * Pré-visualização da loja — a peça central do editor (§1, §9 e §10 da
 * spec). Não sabe nada sobre "Minimal", "Boutique" ou "Modern": tudo o
 * que desenha vem do objeto `theme` recebido. Isto é o que permite
 * trocar os temas simulados pelos oficiais sem tocar neste componente.
 *
 * Também é usado (com props diferentes) tanto na página "Personalizar
 * loja" como dentro de cada card de "Tema" — daí `size`, que só ajusta
 * escala tipográfica/espaçamento, nunca a estrutura.
 */
export interface StorePreviewSettings {
  /** Sobrepõe `theme.colors.primary` — resultado do seletor de Cores. */
  corPrincipal?: string | null;
  /** Sobrepõe `theme.buttons.radius` — resultado do seletor de Estilo. */
  estiloBotao?: ThemeButtonRadius | null;
}

export interface StorePreviewProps {
  theme: Theme;
  store: PreviewStoreData;
  products: PreviewProduct[];
  settings?: StorePreviewSettings;
  size?: 'full' | 'thumb';
  className?: string;
}

const RADIUS_BUTTON: Record<ThemeButtonRadius, string> = {
  none: 'rounded-none',
  md: 'rounded-md',
  full: 'rounded-full',
};

const RADIUS_CARD: Record<Theme['cards']['radius'], string> = {
  none: 'rounded-none',
  md: 'rounded-lg',
  lg: 'rounded-2xl',
};

const SHADOW_CARD: Record<Theme['cards']['shadow'], string> = {
  none: '',
  sm: 'shadow-[0_1px_3px_rgba(15,23,42,0.08)]',
  lg: 'shadow-[0_10px_24px_-12px_rgba(15,23,42,0.35)]',
};

const SPACING_GAP: Record<Theme['spacing'], string> = {
  compact: 'gap-2',
  comfortable: 'gap-3',
  spacious: 'gap-4',
};

const SPACING_PAD: Record<Theme['spacing'], string> = {
  compact: 'px-3 py-3',
  comfortable: 'px-4 py-4',
  spacious: 'px-5 py-6',
};

const DISPLAY_WEIGHT: Record<Theme['typography']['display'], string> = {
  black: 'font-black',
  bold: 'font-bold',
  semibold: 'font-semibold',
};

const TRACKING: Record<Theme['typography']['tracking'], string> = {
  tight: 'tracking-tight',
  normal: 'tracking-normal',
  wide: 'tracking-wide',
};

function formatMzn(value: number): string {
  return `${value.toLocaleString('pt-MZ')} MZN`;
}

export function StorePreview({ theme, store, products, settings, size = 'full', className }: StorePreviewProps) {
  const primary = settings?.corPrincipal || theme.colors.primary;
  const buttonRadius = settings?.estiloBotao ?? theme.buttons.radius;
  const isThumb = size === 'thumb';
  const gridClass =
    theme.cards.layout === 'grid-1-featured'
      ? 'grid-cols-1'
      : theme.cards.layout === 'grid-2-compact'
        ? 'grid-cols-2'
        : 'grid-cols-2';

  return (
    <div
      className={cn(
        'flex h-full w-full flex-col overflow-hidden',
        isThumb ? 'text-[8px]' : 'text-[13px]',
        className
      )}
      style={{ backgroundColor: theme.colors.surface, color: theme.colors.ink }}
    >
      {/* Cabeçalho da loja simulada */}
      <div
        className={cn('flex shrink-0 items-center justify-between border-b', isThumb ? 'px-2 py-1.5' : 'px-4 py-3')}
        style={{ borderColor: theme.colors.surfaceAlt }}
      >
        <span
          className={cn(DISPLAY_WEIGHT[theme.typography.display], TRACKING[theme.typography.tracking], isThumb ? 'text-[9px]' : 'text-[15px]')}
        >
          {store.nome}
        </span>
        <ShoppingBag size={isThumb ? 10 : 16} style={{ color: theme.colors.muted }} />
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Banner */}
        <div
          className={cn('relative w-full overflow-hidden', isThumb ? 'h-12' : 'h-32')}
          style={{ backgroundColor: theme.colors.surfaceAlt }}
        >
          <img src={store.bannerUrl} alt="" className="h-full w-full object-cover" />
          {theme.header.bannerOverlay && (
            <div
              className={cn(
                'absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-black/55 via-black/10 to-transparent',
                isThumb ? 'p-1.5' : 'p-4',
                theme.header.align === 'center' ? 'items-center text-center' : 'items-start text-left'
              )}
            >
              <span className={cn('text-white', DISPLAY_WEIGHT[theme.typography.display], TRACKING[theme.typography.tracking], isThumb ? 'text-[9px]' : 'text-[16px]')}>
                {store.nome}
              </span>
            </div>
          )}
        </div>

        <div className={cn('flex flex-col', SPACING_PAD[theme.spacing])}>
          {!theme.header.bannerOverlay && (
            <div className={cn('flex flex-col', isThumb ? 'mb-1.5 gap-0.5' : 'mb-4 gap-1', theme.header.align === 'center' ? 'items-center text-center' : 'items-start text-left')}>
              <h3 className={cn(DISPLAY_WEIGHT[theme.typography.display], TRACKING[theme.typography.tracking], isThumb ? 'text-[9px]' : 'text-[16px]')}>{store.nome}</h3>
              <p className={cn(isThumb ? 'text-[6.5px]' : 'text-[11.5px]')} style={{ color: theme.colors.muted }}>
                {store.descricao}
              </p>
            </div>
          )}

          {/* Categorias */}
          <div className={cn('flex overflow-x-auto', isThumb ? 'mb-1.5 gap-1' : 'mb-4 gap-2')}>
            {previewCategories.map((cat, i) => (
              <span
                key={cat}
                className={cn('shrink-0 whitespace-nowrap font-bold', isThumb ? 'px-1.5 py-0.5 text-[6.5px]' : 'px-3 py-1.5 text-[11px]', RADIUS_BUTTON[buttonRadius])}
                style={
                  i === 0
                    ? { backgroundColor: primary, color: '#fff' }
                    : { backgroundColor: theme.colors.surfaceAlt, color: theme.colors.ink }
                }
              >
                {cat}
              </span>
            ))}
          </div>

          {/* Produtos */}
          <div className={cn('grid', gridClass, SPACING_GAP[theme.spacing])}>
            {products.map((p) => (
              <div
                key={p.id}
                className={cn('flex flex-col overflow-hidden bg-white', RADIUS_CARD[theme.cards.radius], SHADOW_CARD[theme.cards.shadow])}
              >
                <div
                  className={cn('w-full overflow-hidden', theme.cards.imageRatio === 'portrait' ? 'aspect-[3/4]' : 'aspect-square')}
                  style={{ backgroundColor: theme.colors.surfaceAlt }}
                >
                  <img src={p.imagem} alt={p.nome} className="h-full w-full object-cover" />
                </div>
                <div className={cn('flex flex-col', isThumb ? 'gap-0 px-1 py-1' : 'gap-0.5 px-2.5 py-2')}>
                  <span
                    className={cn(
                      'truncate font-semibold',
                      isThumb ? 'text-[6.5px]' : 'text-[11.5px]',
                      theme.typography.uppercaseLabels && 'uppercase tracking-wide'
                    )}
                  >
                    {p.nome}
                  </span>
                  <span className={cn('font-bold', isThumb ? 'text-[6.5px]' : 'text-[11px]')} style={{ color: primary }}>
                    {formatMzn(p.preco)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

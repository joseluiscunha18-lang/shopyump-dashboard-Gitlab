import { ShoppingBag } from 'lucide-react';
import { cn } from '@/lib/cn';
import type { Theme, ThemeButtonRadius } from '@/types/theme';
import type { PreviewProduct, PreviewStoreData } from '@/lib/mocks/storePreview';
import { previewCategories } from '@/lib/mocks/storePreview';

/**
 * Pré-visualização da loja — a peça central do editor (§1, §9 e §10 da
 * spec original, revista depois para o modelo "toque para editar"). Não
 * sabe nada sobre "Minimal", "Boutique" ou "Modern": tudo o que desenha
 * vem do objeto `theme` recebido. Isto é o que permite trocar os temas
 * simulados pelos oficiais sem tocar neste componente.
 *
 * Também é usado (com props diferentes) tanto na página "Personalizar
 * loja" como dentro de cada card de "Tema" — daí `size`, que só ajusta
 * escala tipográfica/espaçamento, nunca a estrutura.
 *
 * O modo interativo (`editable`) não adiciona nenhum ícone de lápis —
 * cada bloco editável fica clicável e, ao tocar, chama `onSelect`. O
 * destaque visual (anel + selo "Você está editando X") é a única pista
 * de que aquele bloco é editável, para não parecer um construtor de
 * sites cheio de ícones espalhados.
 */
export type EditableRegion = 'banner' | 'info' | 'produtos';

export interface StorePreviewSettings {
  /** Sobrepõe `theme.colors.primary` — resultado do painel de Cores. */
  corPrincipal?: string | null;
  /** Sobrepõe `theme.buttons.radius` — resultado do painel de Estilo. */
  estiloBotao?: ThemeButtonRadius | null;
  /** true = banner mais alto (ajuste feito no painel do Banner). */
  bannerGrande?: boolean;
  /** Sobrepõe o nº de colunas da grelha de produtos (painel de Produtos). */
  colunas?: 2 | 3;
}

export interface StorePreviewEditable {
  /** Região atualmente selecionada — mostra o destaque de "a editar". */
  selected: EditableRegion | null;
  onSelect: (region: EditableRegion) => void;
  /** Região a destacar discretamente antes do primeiro toque (onboarding). */
  hint?: EditableRegion | null;
}

export interface StorePreviewProps {
  theme: Theme;
  store: PreviewStoreData;
  products: PreviewProduct[];
  settings?: StorePreviewSettings;
  size?: 'full' | 'thumb';
  className?: string;
  editable?: StorePreviewEditable;
  /**
   * true = trata a pré-visualização como uma imagem: sem scroll interno
   * e sem interação nenhuma (pointer-events-none). Usado na página de
   * detalhe do tema (`/loja/temas/[id]`) — lá o objetivo é SÓ mostrar o
   * tema, como um screenshot; deslizar/tocar dentro dele não deve fazer
   * nada, porque não é a loja de verdade, é uma amostra.
   */
  frozen?: boolean;
  /**
   * true = modo "site normal": o wrapper não limita a altura nem cria
   * scroll interno. O conteúdo flui para baixo livremente e o scroll é
   * do elemento pai (ou da janela). Usado no overlay de pré-visualização
   * a ecrã cheio, onde queremos comportamento de página real.
   */
  flow?: boolean;
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

/** Anel de destaque — igual para seleção ativa e para a dica de onboarding, só muda a opacidade/animação. */
function regionRing(state: 'selected' | 'hint' | null): string {
  if (state === 'selected') return 'ring-2 ring-[#111110] ring-offset-2';
  if (state === 'hint') return 'ring-2 ring-[#111110]/40 animate-pulse';
  return '';
}

/** Rótulo discreto "Você está editando X". */
function RegionBadge({ label }: { label: string }) {
  return (
    <span className="absolute -top-2.5 left-2 z-10 rounded-full bg-[#111110] px-2 py-0.5 text-[9px] font-bold text-white shadow-sm">
      {label}
    </span>
  );
}

export function StorePreview({ theme, store, products, settings, size = 'full', className, editable, frozen = false, flow = false }: StorePreviewProps) {
  const primary = settings?.corPrincipal || theme.colors.primary;
  const buttonRadius = settings?.estiloBotao ?? theme.buttons.radius;
  const isThumb = size === 'thumb';
  const columns = settings?.colunas ?? (theme.cards.layout === 'grid-1-featured' ? 1 : 2);
  const gridClass = columns === 1 ? 'grid-cols-1' : columns === 3 ? 'grid-cols-3' : 'grid-cols-2';

  function regionState(region: EditableRegion): 'selected' | 'hint' | null {
    if (!editable) return null;
    if (editable.selected === region) return 'selected';
    if (!editable.selected && editable.hint === region) return 'hint';
    return null;
  }

  function regionClick(region: EditableRegion) {
    return editable ? () => editable.onSelect(region) : undefined;
  }

  return (
    <div
      className={cn(
        'flex w-full flex-col',
        flow ? '' : 'h-full overflow-hidden',
        isThumb ? 'text-[8px]' : 'text-[13px]',
        frozen && 'pointer-events-none select-none',
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

      <div className={cn(flow ? '' : 'flex-1', frozen ? 'overflow-hidden' : flow ? '' : 'overflow-y-auto')}>
        {/* Banner — tocável */}
        <div
          onClick={regionClick('banner')}
          role={editable ? 'button' : undefined}
          tabIndex={editable ? 0 : undefined}
          className={cn(
            'relative w-full overflow-hidden text-left',
            isThumb ? 'h-12' : settings?.bannerGrande ? 'h-48' : 'h-32',
            editable && 'cursor-pointer transition-all',
            regionRing(regionState('banner'))
          )}
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
          {regionState('banner') === 'selected' && !isThumb && <RegionBadge label="Banner" />}
        </div>

        <div className={cn('flex flex-col', SPACING_PAD[theme.spacing])}>
          {!theme.header.bannerOverlay && (
            <div
              onClick={regionClick('info')}
              role={editable ? 'button' : undefined}
              tabIndex={editable ? 0 : undefined}
              className={cn(
                'relative flex w-full flex-col',
                isThumb ? 'mb-1.5 gap-0.5' : 'mb-4 gap-1',
                theme.header.align === 'center' ? 'items-center text-center' : 'items-start text-left',
                editable && 'cursor-pointer rounded-md transition-all',
                regionRing(regionState('info'))
              )}
            >
              <h3 className={cn(DISPLAY_WEIGHT[theme.typography.display], TRACKING[theme.typography.tracking], isThumb ? 'text-[9px]' : 'text-[16px]')}>{store.nome}</h3>
              <p className={cn(isThumb ? 'text-[6.5px]' : 'text-[11.5px]')} style={{ color: theme.colors.muted }}>
                {store.descricao}
              </p>
              {regionState('info') === 'selected' && !isThumb && <RegionBadge label="Nome e descrição" />}
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

          {/* Produtos — tocável */}
          <div
            onClick={regionClick('produtos')}
            role={editable ? 'button' : undefined}
            tabIndex={editable ? 0 : undefined}
            className={cn('relative w-full', editable && 'cursor-pointer rounded-md transition-all', regionRing(regionState('produtos')))}
          >
            {regionState('produtos') === 'selected' && !isThumb && <RegionBadge label="Produtos" />}
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
    </div>
  );
}

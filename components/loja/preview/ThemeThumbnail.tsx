import { cn } from '@/lib/cn';
import type { Theme } from '@/types/theme';

/**
 * Miniatura do tema para o catálogo (grid 2 colunas). Ao contrário do
 * <StorePreview />, isto NÃO é a loja renderizada — é uma composição
 * abstrata e estática feita só dos tokens do tema (cores, espaçamento,
 * cantos, tipografia), pensada para ser reconhecida num relance, como
 * as miniaturas da Shopify Theme Store. Não tem scroll, não tem dados
 * reais, não reage a nada — o cartão inteiro é um único link para a
 * página de detalhe do tema, onde sim existe uma pré-visualização a
 * sério.
 */
export function ThemeThumbnail({ theme, className }: { theme: Theme; className?: string }) {
  const radiusCard: Record<Theme['cards']['radius'], string> = { none: 'rounded-none', md: 'rounded-md', lg: 'rounded-xl' };
  const radiusButton: Record<Theme['buttons']['radius'], string> = { none: 'rounded-none', md: 'rounded-sm', full: 'rounded-full' };

  return (
    <div
      className={cn('relative flex h-full w-full flex-col overflow-hidden', className)}
      style={{ backgroundColor: theme.colors.surface }}
    >
      {/* "Banner" — bloco de cor, não uma imagem real */}
      <div
        className={cn('flex shrink-0 items-end p-3', theme.header.align === 'center' ? 'justify-center text-center' : 'justify-start')}
        style={{
          height: '46%',
          background: `linear-gradient(135deg, ${theme.colors.primary}CC, ${theme.colors.surfaceAlt})`,
        }}
      >
        <span
          className={cn(
            'text-[11px] text-white',
            theme.typography.display === 'black' ? 'font-black' : theme.typography.display === 'bold' ? 'font-bold' : 'font-semibold',
            theme.typography.tracking === 'wide' && 'tracking-wide',
            theme.typography.uppercaseLabels && 'uppercase'
          )}
        >
          {theme.name}
        </span>
      </div>

      {/* Corpo — pequenas "pílulas" de categoria + grelha de "produtos" abstrata */}
      <div className="flex flex-1 flex-col gap-2 p-3">
        <div className="flex gap-1">
          <span className={cn('h-2.5 w-7', radiusButton[theme.buttons.radius])} style={{ backgroundColor: theme.colors.primary }} />
          <span className={cn('h-2.5 w-5', radiusButton[theme.buttons.radius])} style={{ backgroundColor: theme.colors.surfaceAlt }} />
          <span className={cn('h-2.5 w-5', radiusButton[theme.buttons.radius])} style={{ backgroundColor: theme.colors.surfaceAlt }} />
        </div>
        <div className={cn('grid flex-1 gap-1.5', theme.cards.layout === 'grid-1-featured' ? 'grid-cols-1' : 'grid-cols-2')}>
          {(theme.cards.layout === 'grid-1-featured' ? [0] : [0, 1]).map((i) => (
            <span key={i} className={cn('block h-full', radiusCard[theme.cards.radius])} style={{ backgroundColor: theme.colors.surfaceAlt }} />
          ))}
        </div>
      </div>
    </div>
  );
}

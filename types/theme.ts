/**
 * Estrutura de "tema" da loja — pensada para ser a única coisa que muda
 * quando os temas simulados (Minimal/Boutique/Modern) forem substituídos
 * pelos temas oficiais do Shopyump.
 *
 * Nada no editor de personalização, no <StorePreview />, ou nos cards de
 * seleção de tema deve depender do id/nome de um tema específico — tudo
 * lê estes campos. Adicionar um tema novo (real ou simulado) é apenas
 * acrescentar um objeto `Theme` a `THEMES`, nunca criar uma página nova.
 *
 * Os valores aqui são deliberadamente simples (classes utilitárias e
 * tokens, não CSS livre) para que o preview possa ser gerado apenas por
 * composição — sem `dangerouslySetInnerHTML` nem folhas de estilo por
 * tema.
 */

export type ThemeId = string;

export type ThemeSpacing = 'compact' | 'comfortable' | 'spacious';
export type ThemeButtonRadius = 'none' | 'md' | 'full';
export type ThemeCardRadius = 'none' | 'md' | 'lg';
export type ThemeImageRatio = 'square' | 'portrait';
export type ThemeLayout = 'grid-2' | 'grid-2-compact' | 'grid-1-featured';
export type ThemeHeaderAlign = 'left' | 'center';

export interface ThemeColors {
  /** Cor de destaque — botões, preços, badges. Pode ser substituída pelo
   *  vendedor em "Cores"; este é só o valor por omissão do tema. */
  primary: string;
  /** Fundo geral da loja. */
  surface: string;
  /** Fundo alternativo (banner, cabeçalho) quando o tema não usa `surface`. */
  surfaceAlt: string;
  /** Cor do texto principal. */
  ink: string;
  /** Cor do texto secundário (descrições, preços riscados). */
  muted: string;
}

export interface ThemeTypography {
  /** Peso/estilo do nome da loja e títulos de secção. */
  display: 'black' | 'bold' | 'semibold';
  /** Espaçamento entre letras dos títulos. */
  tracking: 'tight' | 'normal' | 'wide';
  /** true = nomes de produto em maiúsculas (look "boutique"). */
  uppercaseLabels: boolean;
}

export interface ThemeButtons {
  radius: ThemeButtonRadius;
  style: 'solid' | 'outline';
}

export interface ThemeCards {
  radius: ThemeCardRadius;
  shadow: 'none' | 'sm' | 'lg';
  imageRatio: ThemeImageRatio;
  layout: ThemeLayout;
}

export interface ThemeHeader {
  align: ThemeHeaderAlign;
  /** true = banner ocupa a largura toda por trás do nome da loja. */
  bannerOverlay: boolean;
}

export interface Theme {
  id: ThemeId;
  name: string;
  /** Frase curta mostrada no card de seleção de tema. */
  tagline: string;
  spacing: ThemeSpacing;
  colors: ThemeColors;
  typography: ThemeTypography;
  buttons: ThemeButtons;
  cards: ThemeCards;
  header: ThemeHeader;
}

/**
 * Três temas fictícios só para validar a arquitetura (seleção, preview,
 * "testar antes de aplicar", ajustes de aparência, guardar). Nomes e
 * estilos são provisórios — ver §16 da spec: substituir por temas
 * oficiais mais tarde nunca deve exigir reconstruir esta página.
 */
export const THEMES: Theme[] = [
  {
    id: 'minimal',
    name: 'Minimal',
    tagline: 'Limpo, espaçoso, aparência premium.',
    spacing: 'spacious',
    colors: {
      primary: '#111110',
      surface: '#FFFFFF',
      surfaceAlt: '#F4F4F3',
      ink: '#171717',
      muted: '#78716C',
    },
    typography: { display: 'semibold', tracking: 'tight', uppercaseLabels: false },
    buttons: { radius: 'md', style: 'outline' },
    cards: { radius: 'md', shadow: 'none', imageRatio: 'square', layout: 'grid-2' },
    header: { align: 'left', bannerOverlay: false },
  },
  {
    id: 'boutique',
    name: 'Boutique',
    tagline: 'Imagens grandes, tipografia elegante.',
    spacing: 'comfortable',
    colors: {
      primary: '#9A6B4A',
      surface: '#FBF7F2',
      surfaceAlt: '#EFE3D6',
      ink: '#2B211A',
      muted: '#8A7A6C',
    },
    typography: { display: 'black', tracking: 'wide', uppercaseLabels: true },
    buttons: { radius: 'none', style: 'solid' },
    cards: { radius: 'none', shadow: 'sm', imageRatio: 'portrait', layout: 'grid-1-featured' },
    header: { align: 'center', bannerOverlay: true },
  },
  {
    id: 'modern',
    name: 'Modern',
    tagline: 'Compacto, cards e botões contemporâneos.',
    spacing: 'compact',
    colors: {
      primary: '#4F46E5',
      surface: '#FFFFFF',
      surfaceAlt: '#EEF0FF',
      ink: '#18181B',
      muted: '#71717A',
    },
    typography: { display: 'bold', tracking: 'tight', uppercaseLabels: false },
    buttons: { radius: 'full', style: 'solid' },
    cards: { radius: 'lg', shadow: 'lg', imageRatio: 'square', layout: 'grid-2-compact' },
    header: { align: 'left', bannerOverlay: false },
  },
];

export function getThemeById(id: ThemeId | null | undefined): Theme {
  return THEMES.find((t) => t.id === id) ?? THEMES[0];
}

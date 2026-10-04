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
  /** 2–4 características em linguagem simples, para a página de detalhe do tema. */
  features: string[];
  /** Arquitetura pronta para quando existirem temas pagos — hoje todos são 'gratis'. */
  pricing: 'gratis' | 'premium';
  spacing: ThemeSpacing;
  colors: ThemeColors;
  typography: ThemeTypography;
  buttons: ThemeButtons;
  cards: ThemeCards;
  header: ThemeHeader;
}

/**
 * LUME — o tema padrão da plataforma Shopyump. Os tokens abaixo são só a
 * versão simplificada usada pelas miniaturas do catálogo (StorePreview); o
 * visual real do Lume vive em lib/store/themes/lume (loja pública) e em
 * theme-editor/themes/lume (editor + preview do "Personalizar loja").
 */
const LUME_THEME: Theme = {
  id: 'lume',
  name: 'Lume',
  tagline: 'Limpo e essencial: o tema padrão do Shopyump.',
  features: ['Banner com destaque', 'Grelha de produtos clara', 'Botões em pílula'],
  pricing: 'gratis',
  spacing: 'comfortable',
  colors: {
    primary: '#202020',
    surface: '#FFFFFF',
    surfaceAlt: '#F3F3F3',
    ink: '#202020',
    muted: '#696969',
  },
  typography: { display: 'black', tracking: 'tight', uppercaseLabels: false },
  buttons: { radius: 'full', style: 'solid' },
  cards: { radius: 'lg', shadow: 'none', imageRatio: 'square', layout: 'grid-2' },
  header: { align: 'center', bannerOverlay: false },
};

/**
 * Temas FUTUROS (ainda não ativos). Seis temas fictícios: os 3 originais (Minimal/Boutique/Modern) que
 * validam a arquitetura a sério, mais 3 "de efeito" (Fashion/Urban/
 * Studio) só para o catálogo parecer um catálogo de verdade em vez de 3
 * cartões soltos — reaproveitam as mesmas variações de tokens, não são
 * temas com identidade própria ainda. Nomes e estilos são provisórios —
 * ver §16 da spec original: substituir por temas oficiais mais tarde
 * nunca deve exigir reconstruir esta página.
 */
export const PLANNED_THEMES: Theme[] = [
  {
    id: 'minimal',
    name: 'Minimal',
    tagline: 'Limpo, espaçoso, aparência premium.',
    features: ['Produtos em destaque', 'Banner limpo', 'Navegação simples'],
    pricing: 'gratis',
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
    features: ['Fotos em destaque', 'Cabeçalho com banner', 'Estilo boutique'],
    pricing: 'gratis',
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
    features: ['Grelha compacta', 'Botões arredondados', 'Visual contemporâneo'],
    pricing: 'gratis',
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
  {
    id: 'fashion',
    name: 'Fashion',
    tagline: 'Editorial, com destaque total para a foto.',
    features: ['Foco na fotografia', 'Tipografia editorial', 'Visual de revista'],
    pricing: 'gratis',
    spacing: 'comfortable',
    colors: {
      primary: '#B3122B',
      surface: '#FFFFFF',
      surfaceAlt: '#F2E9E9',
      ink: '#1A1414',
      muted: '#8C7A7A',
    },
    typography: { display: 'black', tracking: 'wide', uppercaseLabels: true },
    buttons: { radius: 'none', style: 'outline' },
    cards: { radius: 'none', shadow: 'none', imageRatio: 'portrait', layout: 'grid-1-featured' },
    header: { align: 'center', bannerOverlay: true },
  },
  {
    id: 'urban',
    name: 'Urban',
    tagline: 'Ousado, contrastado, feito para streetwear.',
    features: ['Contraste forte', 'Grelha densa', 'Botões cheios'],
    pricing: 'gratis',
    spacing: 'compact',
    colors: {
      primary: '#EAB308',
      surface: '#111110',
      surfaceAlt: '#27272A',
      ink: '#FAFAF9',
      muted: '#A8A29E',
    },
    typography: { display: 'black', tracking: 'tight', uppercaseLabels: true },
    buttons: { radius: 'none', style: 'solid' },
    cards: { radius: 'md', shadow: 'none', imageRatio: 'square', layout: 'grid-2-compact' },
    header: { align: 'left', bannerOverlay: false },
  },
  {
    id: 'studio',
    name: 'Studio',
    tagline: 'Suave e neutro, deixa o produto falar.',
    features: ['Tons neutros', 'Cards arredondados', 'Layout equilibrado'],
    pricing: 'premium',
    spacing: 'spacious',
    colors: {
      primary: '#57534E',
      surface: '#FAFAF9',
      surfaceAlt: '#E7E5E4',
      ink: '#292524',
      muted: '#A8A29E',
    },
    typography: { display: 'semibold', tracking: 'normal', uppercaseLabels: false },
    buttons: { radius: 'full', style: 'outline' },
    cards: { radius: 'lg', shadow: 'sm', imageRatio: 'square', layout: 'grid-2' },
    header: { align: 'left', bannerOverlay: false },
  },
];

/**
 * Temas ativos no catálogo. Por agora só o Lume (tema padrão da plataforma).
 * Quando os próximos temas ficarem prontos, passam de PLANNED_THEMES para aqui.
 */
export const THEMES: Theme[] = [LUME_THEME];

export function getThemeById(id: ThemeId | null | undefined): Theme {
  return THEMES.find((t) => t.id === id) ?? THEMES[0];
}

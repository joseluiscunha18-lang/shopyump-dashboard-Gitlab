import type { ThemeId, ThemeButtonRadius } from '@/types/theme';

/**
 * O que o vendedor de facto escolhe em "Aparência" — não é o Theme
 * inteiro (isso vive em `types/theme.ts` e é sempre um dos temas
 * disponíveis), é a personalização por cima do tema aplicado: qual
 * tema, e os pequenos ajustes (§8 da spec: cor principal, estilo de
 * botão).
 *
 * `corPrincipal` e `estiloBotao` ficam `null` enquanto o vendedor não
 * mexe neles — nesse caso o preview usa o valor por omissão do próprio
 * tema (ver `getThemeById(...).colors.primary` / `.buttons.radius`).
 */
export interface LojaCustomization {
  temaId: ThemeId;
  corPrincipal: string | null;
  estiloBotao: ThemeButtonRadius | null;
}

export const DEFAULT_CUSTOMIZATION: LojaCustomization = {
  temaId: 'minimal',
  corPrincipal: null,
  estiloBotao: null,
};

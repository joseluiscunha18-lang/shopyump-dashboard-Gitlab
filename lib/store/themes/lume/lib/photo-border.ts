/**
 * Borda da foto do produto (cartões e galeria) — fonte única para a loja pública
 * (`buildLumePersonalizacao`) e para o editor. Sem React.
 *
 * Espessura: "inherit" segue a "Espessura das bordas" do Estilo da loja; as outras
 * três são valores próprios da foto. Cor: a foto usa uma linha própria do tema
 * (`--product-frame-line`, preto a 10 %), NÃO a cor global "Bordas"; a cor aqui só
 * conta quando o lojista a muda — com o valor por omissão não se emite nada e a
 * loja fica exatamente como o tema original.
 */
export const PHOTO_BORDER_PX = { thin: 1, medium: 2, thick: 4 } as const;
export type PhotoBorderPreset = keyof typeof PHOTO_BORDER_PX;

/** Valor por omissão da cor no painel (≈ o preto a 10 % do tema sobre fundo claro). */
export const PHOTO_BORDER_DEFAULT_COLOR = "#E6E6E6";

export function photoBorderPreset(setting: unknown): PhotoBorderPreset | null {
  return typeof setting === "string" && Object.prototype.hasOwnProperty.call(PHOTO_BORDER_PX, setting) ? (setting as PhotoBorderPreset) : null;
}

/** Espessura final em px: 0 se a borda está desligada, a da foto se o lojista escolheu, senão a global. */
export function photoBorderPx(setting: unknown, globalPx: number, enabled: boolean): number {
  if (!enabled) return 0;
  const preset = photoBorderPreset(setting);
  return preset ? PHOTO_BORDER_PX[preset] : globalPx;
}

/** Cor já resolvida (hex) → só devolve se o lojista a mudou; `undefined` = usar a do tema. */
export function photoBorderColor(resolved: string): string | undefined {
  return resolved.toLowerCase() === PHOTO_BORDER_DEFAULT_COLOR.toLowerCase() ? undefined : resolved;
}

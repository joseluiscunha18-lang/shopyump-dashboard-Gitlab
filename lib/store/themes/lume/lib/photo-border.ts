/**
 * Aparência da foto do produto (cartões e galeria): arredondamento próprio e cor da
 * borda — fonte única para a loja pública (`buildLumePersonalizacao`) e o editor.
 * Sem React.
 *
 * Arredondamento: "inherit" (valor por omissão) segue o "Arredondamento das imagens"
 * do Estilo da loja; um número (px, 999 = pílula) é só desta foto.
 *
 * Cor: a foto usa uma linha própria do tema (`--product-frame-line`, preto a 10 %),
 * NÃO a cor global "Bordas". A cor só conta quando o lojista a muda — com o valor por
 * omissão não se emite nada e a loja fica exatamente como o tema original.
 */
export const PHOTO_RADIUS_MAX = 999;

/** Valor por omissão da cor no painel (≈ o preto a 10 % do tema sobre fundo claro). */
export const PHOTO_BORDER_DEFAULT_COLOR = "#E6E6E6";

/** Raio final em px: o da foto se o lojista escolheu um número, senão o global. */
export function photoRadius(setting: unknown, globalPx: number): number {
  return typeof setting === "number" && Number.isFinite(setting) ? Math.min(PHOTO_RADIUS_MAX, Math.max(0, setting)) : globalPx;
}

/** Cor já resolvida (hex) → só devolve se o lojista a mudou; `undefined` = usar a do tema. */
export function photoBorderColor(resolved: string): string | undefined {
  return resolved.toLowerCase() === PHOTO_BORDER_DEFAULT_COLOR.toLowerCase() ? undefined : resolved;
}

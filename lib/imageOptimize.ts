/**
 * Otimização inteligente de imagens ANTES do envio ao R2 (corre no browser).
 *
 * Princípios:
 *  - NUNCA corta a fotografia (só reduz a escala, mantendo a proporção).
 *  - NUNCA aumenta a imagem.
 *  - Só recomprime quando há um benefício real; uma imagem já otimizada segue intacta.
 *  - Só codifica uma vez com perdas (sem recompressão em cadeia).
 *  - Preserva transparência.
 *  - À prova de falhas: qualquer erro devolve o ficheiro original (o envio nunca é bloqueado).
 */
import { sniffImageType, type R2ImageType } from '@/lib/r2/shared';

export type OptimizeArea = 'produtos' | 'lojas';

/** Lado maior máximo (px). Produtos: leve em 4G; lojas (banner): mais folga. */
export const MAX_SIDE: Record<OptimizeArea, number> = { produtos: 1600, lojas: 2400 };

/** JPEG/WebP até este tamanho, sem precisar de redimensionar, já estão bons: ficam como estão. */
const KEEP_MAX_BYTES = 250 * 1024;
/** …ou com densidade (bytes/píxel) igual ou abaixo disto. */
const KEEP_MAX_DENSITY = 0.2;

const Q_WEBP = 0.85;
const Q_JPEG = 0.88;

export type OptimizeInput = {
  type: R2ImageType;
  width: number;
  height: number;
  bytes: number;
  hasAlpha: boolean;
  area: OptimizeArea;
};

export type OptimizePlan =
  | { action: 'keep'; reason: string }
  | {
      action: 'encode';
      format: 'image/webp' | 'image/jpeg' | 'image/png';
      quality: number;
      width: number;
      height: number;
      /** O resultado só é aceite se tiver no máximo este rácio do tamanho original. */
      maxRatio: number;
    };

/** Decisão pura (sem browser): testável em Node. */
export function planOptimization(i: OptimizeInput): OptimizePlan {
  const { type, width, height, bytes, hasAlpha, area } = i;
  if (!(width > 0 && height > 0 && bytes > 0)) return { action: 'keep', reason: 'dimensões inválidas' };

  const maxSide = MAX_SIDE[area];
  const scale = Math.min(1, maxSide / Math.max(width, height));
  const needResize = scale < 1;
  const w = needResize ? Math.max(1, Math.round(width * scale)) : width;
  const h = needResize ? Math.max(1, Math.round(height * scale)) : height;
  const density = bytes / (width * height);

  if (type === 'image/png') {
    if (hasAlpha) {
      // Fotos de produto sem fundo → WebP com transparência (muito mais leve).
      // Logótipos/banners (lojas) → mantém PNG: só reduz se for demasiado grande.
      if (area === 'produtos') {
        return { action: 'encode', format: 'image/webp', quality: Q_WEBP, width: w, height: h, maxRatio: 0.7 };
      }
      return needResize
        ? { action: 'encode', format: 'image/png', quality: 1, width: w, height: h, maxRatio: 1 }
        : { action: 'keep', reason: 'PNG com transparência' };
    }
    // PNG opaco (tipicamente fotografia) → WebP.
    return { action: 'encode', format: 'image/webp', quality: Q_WEBP, width: w, height: h, maxRatio: needResize ? 1 : 0.7 };
  }

  // JPEG / WebP
  if (!needResize && (bytes <= KEEP_MAX_BYTES || density <= KEEP_MAX_DENSITY)) {
    return { action: 'keep', reason: 'já otimizada' };
  }
  return {
    action: 'encode',
    format: type === 'image/webp' ? 'image/webp' : 'image/jpeg',
    quality: type === 'image/webp' ? Q_WEBP : Q_JPEG,
    width: w,
    height: h,
    maxRatio: needResize ? 1 : 0.8,
  };
}

// ─── Parte de browser ────────────────────────────────────────────────────────

function canvasToBlob(canvas: HTMLCanvasElement, type: string, quality: number): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob((b) => resolve(b), type, quality));
}

/** Há píxeis (semi)transparentes? Amostra numa miniatura para ser rápido. */
function detectAlpha(bitmap: ImageBitmap): boolean {
  const s = Math.min(1, 128 / Math.max(bitmap.width, bitmap.height));
  const w = Math.max(1, Math.round(bitmap.width * s));
  const h = Math.max(1, Math.round(bitmap.height * s));
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const ctx = c.getContext('2d', { willReadFrequently: true });
  if (!ctx) return false;
  ctx.drawImage(bitmap, 0, 0, w, h);
  const d = ctx.getImageData(0, 0, w, h).data;
  for (let p = 3; p < d.length; p += 4) if (d[p] < 255) return true;
  return false;
}

const EXT: Record<string, string> = { 'image/webp': 'webp', 'image/jpeg': 'jpg', 'image/png': 'png' };

/**
 * Devolve o ficheiro a enviar: o mesmo `file` (se já estiver bom ou se algo falhar)
 * ou uma versão otimizada, sem cortes.
 */
export async function optimizeImage(file: File, area: OptimizeArea): Promise<File> {
  try {
    if (typeof document === 'undefined' || typeof createImageBitmap !== 'function') return file;

    const head = new Uint8Array(await file.slice(0, 12).arrayBuffer());
    const type = sniffImageType(head);
    if (!type) return file; // o servidor rejeita o que não for JPG/PNG/WEBP

    const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
    try {
      const hasAlpha = type === 'image/png' ? detectAlpha(bitmap) : false;
      const plan = planOptimization({
        type,
        width: bitmap.width,
        height: bitmap.height,
        bytes: file.size,
        hasAlpha,
        area,
      });
      if (plan.action === 'keep') return file;

      const canvas = document.createElement('canvas');
      canvas.width = plan.width;
      canvas.height = plan.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return file;
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(bitmap, 0, 0, plan.width, plan.height);

      let format = plan.format;
      let blob = await canvasToBlob(canvas, format, plan.quality);
      // Browsers sem codificador WebP devolvem PNG: usa JPEG se não houver transparência.
      if (blob && blob.type !== format && format === 'image/webp') {
        if (!hasAlpha) {
          format = 'image/jpeg';
          blob = await canvasToBlob(canvas, format, Q_JPEG);
        } else {
          return file;
        }
      }
      if (!blob || blob.type !== format) return file;

      // Só aceita se compensar (e nunca devolve algo maior que o original).
      if (blob.size >= file.size || blob.size > file.size * plan.maxRatio) return file;

      const base = (file.name || 'foto').replace(/\.[^.]+$/, '') || 'foto';
      return new File([blob], `${base}.${EXT[format]}`, { type: format, lastModified: Date.now() });
    } finally {
      bitmap.close?.();
    }
  } catch (err) {
    console.warn('[imageOptimize] a usar o ficheiro original:', err);
    return file;
  }
}

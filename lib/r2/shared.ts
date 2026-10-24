/**
 * Lógica PURA do Cloudflare R2 (sem rede, sem segredos). Seguro de importar no
 * browser e no servidor. Tudo o que toca em credenciais vive em `lib/r2/server.ts`.
 */

/** Tipos aceites para fotos de produto (o ecrã já diz «JPG, PNG ou WEBP»). */
export const R2_ALLOWED_TYPES = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
} as const;
export type R2ImageType = keyof typeof R2_ALLOWED_TYPES;

/** 10 MB por ficheiro. */
export const R2_MAX_BYTES = 10 * 1024 * 1024;

/** Pastas (prefixos) dentro do bucket: fotos de produto e imagens da loja (banner, logótipo, editor). */
export const R2_PRODUTOS_PREFIX = 'produtos';
export const R2_LOJAS_PREFIX = 'lojas';
export type R2Area = 'produtos' | 'lojas';
export const R2_AREAS: readonly R2Area[] = ['produtos', 'lojas'];
export const R2_MEDIA_KINDS = ['logo', 'banner', 'image'] as const;
export type R2MediaKind = (typeof R2_MEDIA_KINDS)[number];

/** Domínio público por omissão (não é segredo; permite resolver URLs também no browser). */
export const R2_PUBLIC_DEFAULT = 'https://img.shopyump.com';

export function isAllowedType(t: unknown): t is R2ImageType {
  return typeof t === 'string' && Object.prototype.hasOwnProperty.call(R2_ALLOWED_TYPES, t);
}

/** Valida o tamanho declarado (inteiro positivo, até ao máximo). */
export function isValidSize(n: unknown): n is number {
  return typeof n === 'number' && Number.isInteger(n) && n > 0 && n <= R2_MAX_BYTES;
}

/** UUID v4 (formato das lojas e dos ficheiros). Evita path traversal / chaves estranhas. */
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export const isUuid = (v: unknown): v is string => typeof v === 'string' && UUID_RE.test(v);

/** `produtos/<lojaId>/<uuid>.<ext>` — a loja vem SEMPRE da sessão, nunca do cliente. */
export function buildProdutoKey(lojaId: string, fileId: string, type: R2ImageType): string {
  if (!isUuid(lojaId) || !isUuid(fileId)) throw new Error('Identificador inválido.');
  return `${R2_PRODUTOS_PREFIX}/${lojaId}/${fileId}.${R2_ALLOWED_TYPES[type]}`;
}

/**
 * Imagem da biblioteca do editor de temas: `lojas/<lojaId>/<logo|banner|image>-<uuid>.<ext>`.
 * É o formato do `mediaId` guardado na personalização (o servidor transforma-o em URL público).
 */
export const R2_MEDIA_KEY =
  /^lojas\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\/(logo|banner|image)-[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(jpg|png|webp)$/i;

/** Nome de ficheiro de media do editor (dentro de `lojas/<lojaId>/`). */
export const R2_MEDIA_FILE = /^(logo|banner|image)-[0-9a-f-]{36}\.(jpg|png|webp)$/i;

/** Normaliza `R2_PUBLIC_URL`: só https, sem barra final. Devolve null se for inválido. */
export function normalizePublicBase(raw: string | undefined | null): string | null {
  if (!raw) return null;
  try {
    const u = new URL(raw.trim());
    if (u.protocol !== 'https:') return null;
    if (u.search || u.hash) return null;
    return (u.origin + u.pathname).replace(/\/+$/, '');
  } catch {
    return null;
  }
}

/** URL público de um objeto: `https://img.shopyump.com/<chave>`. */
export function buildPublicUrl(base: string, key: string): string {
  return `${base.replace(/\/+$/, '')}/${key.replace(/^\/+/, '')}`;
}

/**
 * Se `url` pertence ao nosso domínio público, devolve a chave do objeto; senão null
 * (ex.: imagens antigas do Supabase). Rejeita `..`, `//` e caracteres de controlo.
 */
export function keyFromPublicUrl(url: unknown, base: string): string | null {
  if (typeof url !== 'string') return null;
  const prefix = base.replace(/\/+$/, '') + '/';
  if (!url.startsWith(prefix)) return null;
  let key: string;
  try {
    key = decodeURIComponent(url.slice(prefix.length));
  } catch {
    return null;
  }
  if (!key || key.includes('..') || key.includes('//') || /[\u0000-\u001f\\?#]/.test(key)) return null;
  return key;
}

/** Descobre o tipo REAL pelos primeiros bytes (não confia em `file.type`/extensão). */
export function sniffImageType(b: Uint8Array): R2ImageType | null {
  if (b.length >= 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return 'image/jpeg';
  if (
    b.length >= 8 &&
    b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47 &&
    b[4] === 0x0d && b[5] === 0x0a && b[6] === 0x1a && b[7] === 0x0a
  ) return 'image/png';
  if (
    b.length >= 12 &&
    b[0] === 0x52 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x46 && // RIFF
    b[8] === 0x57 && b[9] === 0x45 && b[10] === 0x42 && b[11] === 0x50   // WEBP
  ) return 'image/webp';
  return null;
}

/**
 * Chave de uma imagem da loja: `lojas/<lojaId>/<uuid>.<ext>` (banner da loja)
 * ou `lojas/<lojaId>/<kind>-<uuid>.<ext>` (biblioteca do editor de temas).
 */
export function buildLojaKey(lojaId: string, fileId: string, type: R2ImageType, kind?: R2MediaKind): string {
  if (!isUuid(lojaId) || !isUuid(fileId)) throw new Error('Identificador inválido.');
  const nome = kind ? `${kind}-${fileId}` : fileId;
  return `${R2_LOJAS_PREFIX}/${lojaId}/${nome}.${R2_ALLOWED_TYPES[type]}`;
}

export const isMediaKind = (v: unknown): v is R2MediaKind =>
  typeof v === 'string' && (R2_MEDIA_KINDS as readonly string[]).includes(v);

/** `R2_PUBLIC_URL` válido, ou o domínio por omissão. */
export function resolvePublicBase(raw?: string | null): string {
  return normalizePublicBase(raw) ?? R2_PUBLIC_DEFAULT;
}

/** Todos os URLs do nosso domínio R2 que aparecem (a qualquer profundidade) num valor JSON. */
export function collectR2Urls(value: unknown, base: string): string[] {
  let txt: string;
  try {
    txt = JSON.stringify(value) ?? '';
  } catch {
    return [];
  }
  const esc = base.replace(/\/+$/, '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const re = new RegExp(esc + '/[^"\\s\\\\]+', 'g');
  return Array.from(new Set(txt.match(re) ?? []));
}

/** Todas as chaves `lojas/<id>/<media>` (ids do editor) que aparecem num valor JSON. */
export function collectMediaKeys(value: unknown): string[] {
  let txt: string;
  try {
    txt = JSON.stringify(value) ?? '';
  } catch {
    return [];
  }
  const re = /lojas\/[0-9a-f-]{36}\/(?:logo|banner|image)-[0-9a-f-]{36}\.(?:jpg|png|webp)/gi;
  return Array.from(new Set(txt.match(re) ?? []));
}

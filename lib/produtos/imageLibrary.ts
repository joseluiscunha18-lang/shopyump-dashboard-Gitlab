/**
 * Biblioteca de imagens do vendedor + enquadramento por imagem.
 *
 * - A fotografia original nunca é alterada: guardamos a referência (URL).
 * - A versão sem fundo (se existir) fica em `semFundo`.
 * - O enquadramento (modo de ajuste + posição) fica separado, por imagem,
 *   e é independente da proporção — ao mudar o tema (1:1 ↔ 4:5) a mesma
 *   posição é reaplicada ao novo formato.
 *
 * Persistência local (por loja) até existir backend real.
 */

export const MAX_FOTOS_PRODUTO = 8;
const MAX_BIBLIOTECA = 500;

export type ModoAjuste = 'cover' | 'contain';
export interface Enquadramento {
  modo: ModoAjuste;
  /** Posição em percentagem (0–100), como em object-position. */
  x: number;
  y: number;
  usarSemFundo: boolean;
}
export const ENQUADRAMENTO_INICIAL: Enquadramento = { modo: 'cover', x: 50, y: 50, usarSemFundo: false };

export interface ImagemBiblioteca {
  id: string;
  original: string;
  semFundo: string | null;
  criadaEm: number;
}

type Store = { imagens: ImagemBiblioteca[]; enquadramentos: Record<string, Enquadramento> };

const key = (lojaId: string) => `shopyump:biblioteca:${lojaId || 'demo'}`;

function read(lojaId: string): Store {
  if (typeof window === 'undefined') return { imagens: [], enquadramentos: {} };
  try {
    const raw = window.localStorage.getItem(key(lojaId));
    if (!raw) return { imagens: [], enquadramentos: {} };
    const s = JSON.parse(raw) as Partial<Store>;
    return { imagens: s.imagens ?? [], enquadramentos: s.enquadramentos ?? {} };
  } catch {
    return { imagens: [], enquadramentos: {} };
  }
}

function write(lojaId: string, s: Store) {
  if (typeof window === 'undefined') return;
  // Se o armazenamento encher, descarta as mais antigas até caber.
  let imagens = s.imagens.slice(0, MAX_BIBLIOTECA);
  for (;;) {
    try {
      window.localStorage.setItem(key(lojaId), JSON.stringify({ ...s, imagens }));
      return;
    } catch {
      if (imagens.length <= 1) return;
      imagens = imagens.slice(0, -1);
    }
  }
}

/** Mais recentes primeiro. */
export function listarBiblioteca(lojaId: string): ImagemBiblioteca[] {
  return [...read(lojaId).imagens].sort((a, b) => b.criadaEm - a.criadaEm);
}

/** Adiciona sem duplicar (mesmo URL original = mesma imagem). */
export function adicionarABiblioteca(lojaId: string, original: string): ImagemBiblioteca {
  const s = read(lojaId);
  const existente = s.imagens.find((i) => i.original === original);
  if (existente) {
    // Repetida: passa a ser a mais recente (sobe para o topo).
    const atualizada = { ...existente, criadaEm: Date.now() };
    write(lojaId, { ...s, imagens: [atualizada, ...s.imagens.filter((i) => i.id !== existente.id)] });
    return atualizada;
  }
  const nova: ImagemBiblioteca = {
    id: typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : String(Date.now()),
    original,
    semFundo: null,
    criadaEm: Date.now(),
  };
  write(lojaId, { ...s, imagens: [nova, ...s.imagens] });
  return nova;
}

export function guardarSemFundo(lojaId: string, original: string, semFundo: string | null) {
  const s = read(lojaId);
  write(lojaId, { ...s, imagens: s.imagens.map((i) => (i.original === original ? { ...i, semFundo } : i)) });
}

export function lerEnquadramento(lojaId: string, url: string): Enquadramento {
  return read(lojaId).enquadramentos[url] ?? ENQUADRAMENTO_INICIAL;
}

export function guardarEnquadramento(lojaId: string, url: string, e: Enquadramento) {
  const s = read(lojaId);
  write(lojaId, { ...s, enquadramentos: { ...s.enquadramentos, [url]: e } });
}

/** Quantas imagens ainda cabem no produto. */
export function vagasRestantes(atuais: number, max = MAX_FOTOS_PRODUTO): number {
  return Math.max(max - atuais, 0);
}

export type Proporcao = '1/1' | '4/5' | '3/4';

/** Apenas a configuração do cartão de produto define este formato. */
export function proporcaoDeTexto(raw: string): Proporcao {
  try {
    const value = JSON.parse(raw);
    const ratio = value?.sections?.products?.elements?.productCard?.aspectRatio
      ?? value?.sections?.['product-grid']?.elements?.card?.aspectRatio
      ?? value?.global?.productCard?.aspectRatio;
    return ratio === '4/5' || ratio === '3/4' ? ratio : '1/1';
  } catch {
    return '1/1';
  }
}

/** Lê a proporção dos cartões de produto do tema ativo; 1:1 por omissão. */
export function proporcaoDoTema(lojaId: string): Proporcao {
  if (typeof window === 'undefined') return '1/1';
  try {
    const raw = window.localStorage.getItem('shopyump:theme-editor:mock-customization')
      ?? window.localStorage.getItem(`shopyump:personalizar-loja:${lojaId}`) ?? '';
    return proporcaoDeTexto(raw);
  } catch {
    return '1/1';
  }
}

/** Reduz a imagem para guardar na biblioteca sem encher o armazenamento. */
export function reduzirImagem(file: Blob, max = 1000): Promise<string> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new window.Image();
    img.onload = () => {
      const k = Math.min(1, max / Math.max(img.naturalWidth, img.naturalHeight));
      const c = document.createElement('canvas');
      c.width = Math.round(img.naturalWidth * k);
      c.height = Math.round(img.naturalHeight * k);
      const ctx = c.getContext('2d');
      if (!ctx) {
        URL.revokeObjectURL(url);
        reject(new Error('Não foi possível preparar a imagem.'));
        return;
      }
      ctx.drawImage(img, 0, 0, c.width, c.height);
      URL.revokeObjectURL(url);
      // JPEG é muito mais leve que PNG — cabem centenas no armazenamento.
      resolve(c.toDataURL(file.type === 'image/png' ? 'image/webp' : 'image/jpeg', 0.82));
    };
    img.onerror = (e) => {
      URL.revokeObjectURL(url);
      reject(e);
    };
    img.src = url;
  });
}

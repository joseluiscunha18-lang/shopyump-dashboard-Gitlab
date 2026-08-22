/**
 * Rascunho automático do fluxo "criar produto" — guardado localmente para
 * que um toque errado (ou fechar a aba) não faça o lojista perder minutos
 * de preenchimento. Não guarda fotos (blob: URLs não sobrevivem a um
 * reload), só os campos de texto/números do formulário.
 */

export interface ProdutoDraft {
  nome: string;
  descricao: string;
  categoria: string;
  preco: string;
  precoPromo: string;
  savedAt: number;
}

function draftKey(lojaId: string) {
  return `shopyump:draft:produto:${lojaId}`;
}

export function readProdutoDraft(lojaId: string): ProdutoDraft | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(draftKey(lojaId));
    if (!raw) return null;
    return JSON.parse(raw) as ProdutoDraft;
  } catch {
    return null;
  }
}

/** Verdadeiro só se o rascunho tiver algum conteúdo relevante (evita prompts vazios). */
export function isDraftMeaningful(draft: ProdutoDraft | null): draft is ProdutoDraft {
  if (!draft) return false;
  return Boolean(draft.nome.trim() || draft.descricao.trim() || draft.categoria.trim() || draft.preco.trim());
}

export function writeProdutoDraft(lojaId: string, draft: Omit<ProdutoDraft, 'savedAt'>) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(draftKey(lojaId), JSON.stringify({ ...draft, savedAt: Date.now() }));
  } catch {
    // Armazenamento indisponível (modo privado, quota, etc.) — sem rascunho, sem drama.
  }
}

export function clearProdutoDraft(lojaId: string) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(draftKey(lojaId));
  } catch {
    // idem
  }
}

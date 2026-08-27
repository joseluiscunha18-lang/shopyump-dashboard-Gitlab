'use client';

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Publicação otimista de produtos.
 *
 * Antes, o ProductForm esperava (upload de fotos + insert na base de
 * dados) por inteiro antes de navegar para /produtos — daí a sensação de
 * "processar" seguida de "mudar de página". Agora o ProductForm regista
 * aqui um `PendingProduto` local (com a foto ainda em blob:) e navega de
 * imediato; o upload + insert continuam a decorrer em segundo plano e só
 * atualizam este contexto quando terminam.
 *
 * Este provider vive no layout de (dashboard) — não no ProductForm nem na
 * página Produtos — precisamente para sobreviver à navegação entre
 * /produtos/novo → /produtos. Sem isso, o trabalho em fundo perderia onde
 * reportar o resultado assim que o formulário desmontasse.
 *
 * O card de celebração ("Seu produto já está na sua loja") também passou
 * a viver aqui em vez de em query params (?publicado=id&foto=...) — deixa
 * de depender de o URL sobreviver a um router.refresh() e simplifica todo
 * o fluxo.
 */

export interface PendingProduto {
  tempId: string;
  nome: string;
  precoLabel: string;
  categoria: string;
  /** blob: URL local — só válido enquanto o documento não recarrega. */
  fotoPreview: string | null;
  /**
   * 'a-publicar': upload/insert ainda a decorrer.
   * 'publicado': já terminou com sucesso, mas ainda à espera de o
   *   `produtos` vindo do servidor (após router.refresh()) confirmar —
   *   mantém-se visível com a MESMA aparência de um produto real (ver
   *   PendingProductRow) para a troca pelo dado real ser impercetível.
   * 'erro': falhou — mostra nome/preço + motivo + ações.
   */
  status: 'a-publicar' | 'publicado' | 'erro';
  errorMessage?: string;
  /** Preenchido quando `status` passa a 'publicado'. */
  produtoId?: string;
  /**
   * Timestamp (Date.now()) até ao qual a PendingProductRow deve mostrar o
   * esqueleto da foto — definido UMA ÚNICA VEZ aqui, em startPublish, e
   * nunca num useState/useRef local do componente. A PendingProductRow
   * monta pelo menos duas vezes neste fluxo (uma dentro de loading.tsx,
   * assim que se navega para /produtos, e outra dentro da ProductsExplorer
   * quando o page.tsx real termina de carregar); se cada montagem contasse
   * o seu próprio temporizador do zero, uma troca rápida entre as duas
   * (comum quando a query de produtos responde depressa) fazia o esqueleto
   * da segunda montagem começar tarde demais para ser visto — na prática,
   * "o esqueleto não aparece". Guardando aqui um relógio absoluto, todas
   * as montagens leem o mesmo prazo e a janela real de exibição (medida
   * desde o clique, não desde o mount) fica sempre garantida.
   */
  skeletonUntil: number;
}

export interface Celebration {
  /** tempId do pending — preenchido imediatamente em startPublish. */
  tempId: string;
  /** Dados optimistas disponíveis desde startPublish — sem esperar rede. */
  nome: string;
  precoLabel: string;
  fotoPreview: string | null;
  /** Preenchido quando resolvePublish termina. Pode ser null enquanto upload/insert decorrem. */
  produtoId: string | null;
  /** URL permanente da foto — null até resolvePublish. */
  foto?: string;
}

interface PublishingContextValue {
  pending: PendingProduto[];
  celebration: Celebration | null;
  /** Regista um produto otimista e mostra-o de imediato na lista. */
  startPublish: (p: Omit<PendingProduto, 'status' | 'errorMessage' | 'produtoId' | 'skeletonUntil'>) => void;
  /** Publicação concluída com sucesso — actualiza celebration com produtoId e foto final. */
  resolvePublish: (tempId: string, result: { produtoId: string; foto?: string }) => void;
  /** Publicação falhou — o card fica com estado de erro em vez de desaparecer em silêncio. */
  failPublish: (tempId: string, message: string) => void;
  /** O lojista dispensa um card de erro. */
  dismissPending: (tempId: string) => void;
  /** O `produtoId` já apareceu nos `produtos` reais — o otimista deixa de ser necessário. */
  finalizePublish: (tempId: string) => void;
  clearCelebration: () => void;
}

const PublishingContext = createContext<PublishingContextValue | null>(null);

export function PublishingProvider({ children }: { children: ReactNode }) {
  const [pending, setPending] = useState<PendingProduto[]>([]);
  const [celebration, setCelebration] = useState<Celebration | null>(null);
  const router = useRouter();

  const startPublish = useCallback((p: Omit<PendingProduto, 'status' | 'errorMessage' | 'produtoId' | 'skeletonUntil'>) => {
    // Sorteado uma única vez aqui, no clique — não em cada montagem de
    // PendingProductRow — para que o esqueleto seja sempre medido a partir
    // do momento real da publicação, e não do momento em que este ou
    // aquele componente calhou de montar.
    const SKELETON_MIN_MS = 1600;
    const SKELETON_MAX_MS = 1800;
    const skeletonUntil = Date.now() + SKELETON_MIN_MS + Math.random() * (SKELETON_MAX_MS - SKELETON_MIN_MS);
    setPending((prev) => [...prev, { ...p, status: 'a-publicar', skeletonUntil }]);
    // Acende o banner imediatamente com os dados já disponíveis (nome, foto blob, preço).
    // O banner não precisa de esperar pelo upload/insert — mostra já os dados locais
    // e actualiza a foto/produtoId silenciosamente quando resolvePublish completar.
    setCelebration({
      tempId: p.tempId,
      nome: p.nome,
      precoLabel: p.precoLabel,
      fotoPreview: p.fotoPreview,
      produtoId: null,
      foto: undefined,
    });
  }, []);

  const resolvePublish = useCallback((tempId: string, result: { produtoId: string; foto?: string }) => {
    // Fica em `pending` (agora 'publicado') em vez de ser removido de
    // imediato: a lista que a página Produtos recebeu do servidor (no
    // momento em que se navegou para lá, ainda antes do insert terminar)
    // não sabe deste produto. Se limpássemos aqui, haveria uma janela sem
    // nem o otimista nem o real para mostrar — exatamente o "esqueleto a
    // aparecer sozinho" que queremos evitar. Mantém-se visível, com a
    // mesma foto local, até `finalizePublish` confirmar que já existe nos
    // dados reais.
    setPending((prev) => prev.map((p) => (p.tempId === tempId ? { ...p, status: 'publicado', produtoId: result.produtoId } : p)));
    // Enriquece a celebration já visível com produtoId e foto CDN.
    // Não substitui — o banner já está no ecrã desde startPublish.
    setCelebration((prev) =>
      prev?.tempId === tempId
        ? { ...prev, produtoId: result.produtoId, foto: result.foto }
        : prev
    );
    router.refresh();
  }, [router]);

  const failPublish = useCallback((tempId: string, message: string) => {
    setPending((prev) => prev.map((p) => (p.tempId === tempId ? { ...p, status: 'erro', errorMessage: message } : p)));
  }, []);

  const dismissPending = useCallback((tempId: string) => {
    setPending((prev) => prev.filter((p) => p.tempId !== tempId));
  }, []);

  const finalizePublish = useCallback((tempId: string) => {
    setPending((prev) => prev.filter((p) => p.tempId !== tempId));
  }, []);

  const clearCelebration = useCallback(() => setCelebration(null), []);

  const value = useMemo(
    () => ({ pending, celebration, startPublish, resolvePublish, failPublish, dismissPending, finalizePublish, clearCelebration }),
    [pending, celebration, startPublish, resolvePublish, failPublish, dismissPending, finalizePublish, clearCelebration],
  );

  return <PublishingContext.Provider value={value}>{children}</PublishingContext.Provider>;
}

export function usePublishing() {
  const ctx = useContext(PublishingContext);
  if (!ctx) throw new Error('usePublishing must be used within a PublishingProvider');
  return ctx;
}

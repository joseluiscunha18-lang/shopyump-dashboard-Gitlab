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
  status: 'a-publicar' | 'erro';
  errorMessage?: string;
}

export interface Celebration {
  produtoId: string;
  foto?: string;
}

interface PublishingContextValue {
  pending: PendingProduto[];
  celebration: Celebration | null;
  /** Regista um produto otimista e mostra-o de imediato na lista. */
  startPublish: (p: Omit<PendingProduto, 'status' | 'errorMessage'>) => void;
  /** Publicação concluída com sucesso — remove o otimista e acende a celebração. */
  resolvePublish: (tempId: string, result: Celebration) => void;
  /** Publicação falhou — o card fica com estado de erro em vez de desaparecer em silêncio. */
  failPublish: (tempId: string, message: string) => void;
  /** O lojista dispensa um card de erro. */
  dismissPending: (tempId: string) => void;
  clearCelebration: () => void;
}

const PublishingContext = createContext<PublishingContextValue | null>(null);

export function PublishingProvider({ children }: { children: ReactNode }) {
  const [pending, setPending] = useState<PendingProduto[]>([]);
  const [celebration, setCelebration] = useState<Celebration | null>(null);
  const router = useRouter();

  const startPublish = useCallback((p: Omit<PendingProduto, 'status' | 'errorMessage'>) => {
    setPending((prev) => [...prev, { ...p, status: 'a-publicar' }]);
  }, []);

  const resolvePublish = useCallback((tempId: string, result: Celebration) => {
    setPending((prev) => prev.filter((p) => p.tempId !== tempId));
    setCelebration(result);
    // O produto acabou de entrar na base de dados — a lista que a página
    // Produtos recebeu do servidor (no momento em que se navegou para lá,
    // ainda antes do insert terminar) não sabe disto. Um refresh() aqui,
    // feito a partir deste provider que nunca desmonta, busca-a de novo já
    // com o produto real, substituindo o card otimista sem sobressalto.
    router.refresh();
  }, [router]);

  const failPublish = useCallback((tempId: string, message: string) => {
    setPending((prev) => prev.map((p) => (p.tempId === tempId ? { ...p, status: 'erro', errorMessage: message } : p)));
  }, []);

  const dismissPending = useCallback((tempId: string) => {
    setPending((prev) => prev.filter((p) => p.tempId !== tempId));
  }, []);

  const clearCelebration = useCallback(() => setCelebration(null), []);

  const value = useMemo(
    () => ({ pending, celebration, startPublish, resolvePublish, failPublish, dismissPending, clearCelebration }),
    [pending, celebration, startPublish, resolvePublish, failPublish, dismissPending, clearCelebration],
  );

  return <PublishingContext.Provider value={value}>{children}</PublishingContext.Provider>;
}

export function usePublishing() {
  const ctx = useContext(PublishingContext);
  if (!ctx) throw new Error('usePublishing must be used within a PublishingProvider');
  return ctx;
}

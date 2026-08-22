'use client';

import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from 'react';

export type FlowMode = 'criar' | 'editar';

interface ProductFormGuardContextValue {
  /** Chamado pelo ProductForm sempre que o "sujo" do formulário muda. */
  setDirty: (dirty: boolean) => void;
  /** Chamado pelo ProductForm ao montar, para saber que texto usar no diálogo. */
  setMode: (mode: FlowMode) => void;
  /** Modo atual — exposto para a TopBar adaptar as ações do ⋮. */
  mode: FlowMode;
  /**
   * Regista o callback de "Guardar como rascunho" vindo do ProductForm.
   * A TopBar chama-o sem saber nada do formulário.
   */
  registerSaveAsDraft: (fn: () => Promise<void>) => void;
  /**
   * Regista o callback de "Descartar produto/alterações" vindo do ProductForm.
   */
  registerDiscard: (fn: () => void) => void;
  /** Invoca o callback de guardar como rascunho (criar produto). */
  triggerSaveAsDraft: () => Promise<void>;
  /** Invoca o callback de descartar. */
  triggerDiscard: () => void;
  /**
   * Pede para sair do fluxo (voltar, cancelar, descartar…). Se não há
   * alterações por guardar, executa `action` imediatamente — sem diálogo,
   * conforme a regra de não incomodar quando nada mudou. Se há alterações,
   * mostra o diálogo de confirmação apropriado ao modo (criar/editar) e só
   * executa `action` se o utilizador confirmar a saída.
   */
  requestExit: (action: () => void) => void;
}

const ProductFormGuardContext = createContext<ProductFormGuardContextValue | null>(null);

const COPY: Record<FlowMode, { title: string; description: string; confirm: string; cancel: string }> = {
  editar: {
    title: 'Descartar alterações?',
    description: 'As alterações feitas neste produto não serão guardadas.',
    confirm: 'Descartar',
    cancel: 'Continuar editando',
  },
  criar: {
    title: 'Sair sem guardar?',
    description: 'Os dados preenchidos serão perdidos.',
    confirm: 'Sair sem guardar',
    cancel: 'Continuar editando',
  },
};

export function ProductFormGuardProvider({ children }: { children: ReactNode }) {
  const dirtyRef = useRef(false);
  const modeRef = useRef<FlowMode>('criar');
  const pendingActionRef = useRef<(() => void) | null>(null);
  const [dialogMode, setDialogMode] = useState<FlowMode | null>(null);
  const [mode, setModeState] = useState<FlowMode>('criar');

  const saveAsDraftRef = useRef<(() => Promise<void>) | null>(null);
  const discardRef = useRef<(() => void) | null>(null);

  const setDirty = useCallback((dirty: boolean) => {
    dirtyRef.current = dirty;
  }, []);

  const setMode = useCallback((m: FlowMode) => {
    modeRef.current = m;
    setModeState(m);
  }, []);

  const registerSaveAsDraft = useCallback((fn: () => Promise<void>) => {
    saveAsDraftRef.current = fn;
  }, []);

  const registerDiscard = useCallback((fn: () => void) => {
    discardRef.current = fn;
  }, []);

  const triggerSaveAsDraft = useCallback(async () => {
    await saveAsDraftRef.current?.();
  }, []);

  const triggerDiscard = useCallback(() => {
    discardRef.current?.();
  }, []);

  const requestExit = useCallback((action: () => void) => {
    if (!dirtyRef.current) {
      action();
      return;
    }
    pendingActionRef.current = action;
    setDialogMode(modeRef.current);
  }, []);

  function handleCancel() {
    pendingActionRef.current = null;
    setDialogMode(null);
  }

  function handleConfirm() {
    const action = pendingActionRef.current;
    pendingActionRef.current = null;
    setDialogMode(null);
    action?.();
  }

  const copy = dialogMode ? COPY[dialogMode] : null;

  return (
    <ProductFormGuardContext.Provider value={{
      setDirty,
      setMode,
      mode,
      registerSaveAsDraft,
      registerDiscard,
      triggerSaveAsDraft,
      triggerDiscard,
      requestExit,
    }}>
      {children}

      {copy && (
        <div
          className="fixed inset-0 z-[100] flex items-end justify-center bg-black/40 p-4 sm:items-center"
          onClick={handleCancel}
        >
          <div
            className="w-full max-w-sm rounded-[20px] bg-white p-5 shadow-[0_20px_60px_-12px_rgba(0,0,0,0.35)]"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-[16px] font-extrabold text-[#111110]">{copy.title}</h3>
            <p className="mt-1.5 text-[13.5px] font-medium leading-snug text-[#71717A]">
              {copy.description}
            </p>
            <div className="mt-5 flex flex-col-reverse gap-2.5">
              <button
                type="button"
                onClick={handleConfirm}
                className="w-full rounded-[12px] bg-[#B91C1C] px-4 py-2.5 text-[13.5px] font-bold text-white transition-colors hover:bg-[#991B1B] active:scale-[0.99]"
              >
                {copy.confirm}
              </button>
              <button
                type="button"
                onClick={handleCancel}
                className="w-full rounded-[12px] border border-[#E5E3E0] bg-white px-4 py-2.5 text-[13.5px] font-bold text-[#3F3F46] transition-colors hover:bg-[#F4F4F3] active:scale-[0.99]"
              >
                {copy.cancel}
              </button>
            </div>
          </div>
        </div>
      )}
    </ProductFormGuardContext.Provider>
  );
}

export function useProductFormGuard() {
  const ctx = useContext(ProductFormGuardContext);
  if (!ctx) throw new Error('useProductFormGuard must be used within a ProductFormGuardProvider');
  return ctx;
}

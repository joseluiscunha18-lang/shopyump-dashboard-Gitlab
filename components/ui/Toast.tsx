'use client';

import { createContext, useCallback, useContext, useState, ReactNode } from 'react';
import { CheckCircle2, AlertTriangle, X } from 'lucide-react';

interface ToastMessage {
  id: number;
  title: string;
  tone: 'success' | 'error';
}

interface ToastContextValue {
  show: (title: string, tone?: 'success' | 'error') => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}

/** Replaces mostrarNotificacao / mostrarToastPremium / mostrarErroPremium from global.js and spa.js. */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const show = useCallback((title: string, tone: 'success' | 'error' = 'success') => {
    const id = Date.now();
    setToasts((t) => [...t, { id, title, tone }]);
    const duration = tone === 'error' ? 4500 : 2800;
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), duration);
  }, []);

  return (
    <ToastContext.Provider value={{ show }}>
      {children}
      {/* Fixo no fundo do ecrã, nunca no topo: no formulário de produto o
      campo em falta é sempre trazido para a vista com scrollIntoView, o
      que o deixa perto do topo — um toast lá em cima ficava por cima
      exatamente do que o utilizador precisa de ver e editar. Em baixo, o
      toast fica visível sem tapar o conteúdo em foco. */}
      <div className="pointer-events-none fixed inset-x-4 bottom-4 z-[200] flex flex-col-reverse items-center gap-2 sm:inset-x-auto sm:right-5 sm:bottom-5 sm:w-[340px] sm:items-stretch">
        {toasts.map((t) => (
          <div
            key={t.id}
            className="animate-toast-in pointer-events-auto flex max-h-[45vh] w-full max-w-[420px] items-start gap-2.5 overflow-y-auto rounded-xl border border-border/80 bg-card/95 p-3 shadow-lg backdrop-blur-md"
          >
            {t.tone === 'success' ? (
              <CheckCircle2 className="mt-px size-4 shrink-0 text-muted-foreground" strokeWidth={1.8} />
            ) : (
              <AlertTriangle className="mt-px size-4 shrink-0 text-destructive" strokeWidth={1.8} />
            )}
            <p className="flex-1 whitespace-pre-line text-[13px] font-medium leading-snug text-foreground">{t.title}</p>
            <button
              type="button"
              aria-label="Fechar aviso"
              onClick={() => setToasts((ts) => ts.filter((x) => x.id !== t.id))}
              className="rounded-md text-muted-foreground/70 transition-colors hover:text-foreground"
            >
              <X className="size-3.5" strokeWidth={1.8} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

'use client';

import { createContext, useCallback, useContext, useState, ReactNode } from 'react';
import { CheckCircle2, AlertTriangle, X } from 'lucide-react';
import { cn } from '@/lib/cn';

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
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 2800);
  }, []);

  return (
    <ToastContext.Provider value={{ show }}>
      {children}
      <div className="fixed top-5 left-5 right-5 sm:left-auto sm:right-5 sm:w-[340px] z-[200] flex flex-col gap-2 pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={cn(
              'animate-toast-in pointer-events-auto bg-white/95 backdrop-blur-xl border shadow-2xl rounded-2xl p-3.5 flex items-center gap-3',
              t.tone === 'success' ? 'border-emerald-100' : 'border-red-100'
            )}
          >
            <div
              className={cn(
                'w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0',
                t.tone === 'success' ? 'bg-emerald-50 text-emerald-500' : 'bg-red-50 text-red-500'
              )}
            >
              {t.tone === 'success' ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
            </div>
            <p className="flex-1 text-[12px] font-bold text-ink leading-tight">{t.title}</p>
            <button
              onClick={() => setToasts((ts) => ts.filter((x) => x.id !== t.id))}
              className="text-slate-300 hover:text-slate-500"
            >
              <X size={14} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

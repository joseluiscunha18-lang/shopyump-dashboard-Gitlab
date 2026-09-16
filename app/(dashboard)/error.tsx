'use client';

import { useEffect } from 'react';
import { RefreshCcw } from 'lucide-react';
import { Button } from '@/components/ui/Button';

/**
 * error.tsx — (dashboard)
 *
 * Antes deste ficheiro não existir, um erro real numa página do
 * dashboard (falha de rede, RLS do Supabase, etc.) não tinha um limite
 * claro para aparecer — o utilizador só via o skeleton de loading.tsx
 * ficar ali, sem indicação de que algo tinha corrido mal, especialmente
 * em ligações lentas onde é difícil distinguir "ainda a carregar" de
 * "falhou". Agora qualquer erro nesta parte da app cai aqui, com um
 * botão para tentar de novo.
 */
export default function DashboardError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3 pt-24 text-center">
      <p className="text-[15px] font-black text-ink">Não foi possível carregar esta página.</p>
      <p className="max-w-xs text-[12.5px] font-medium text-slate-400">
        Pode ter sido a ligação à internet. Verifica a rede e tenta novamente.
      </p>
      <Button type="button" variant="secondary" onClick={() => reset()}>
        <RefreshCcw size={15} /> Tentar novamente
      </Button>
    </div>
  );
}

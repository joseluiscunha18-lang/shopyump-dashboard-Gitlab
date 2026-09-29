'use client';

import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/components/ui/Toast';
import { DASHBOARD_BASE_PATH } from '@/lib/domains';

export function GoogleAuthButton() {
  const [loading, setLoading] = useState(false);
  const { show } = useToast();

  async function handleClick() {
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}${DASHBOARD_BASE_PATH}/api/auth/callback` },
    });
    if (error) {
      show(`Erro ao ligar à Google: ${error.message}`, 'error');
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={loading}
      className="w-full bg-white border border-slate-200 text-slate-700 font-bold py-3.5 rounded-2xl hover:bg-slate-50 transition-all active:scale-[0.98] flex items-center justify-center gap-3 shadow-sm disabled:opacity-60"
    >
      {loading ? (
        <Loader2 className="animate-spin" size={18} />
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="" className="w-5 h-5" />
      )}
      {loading ? 'A ligar à Google…' : 'Continuar com Google'}
    </button>
  );
}

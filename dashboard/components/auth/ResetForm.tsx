'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { PasswordInput } from '@/components/auth/PasswordInput';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';

export function ResetForm() {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { show } = useToast();

  const valid = useMemo(() => password.length >= 6 && password === confirm, [password, confirm]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!valid) return;
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) return show(error.message, 'error');
    show('Senha atualizada com sucesso.');
    router.push('/');
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-extrabold text-ink tracking-tight mb-2">Definir nova senha</h2>
        <p className="text-sm text-slate-500 font-medium">Escolhe uma nova senha para a tua conta.</p>
      </div>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="text-[11px] font-black uppercase tracking-widest text-slate-500 mb-1.5 block pl-1">Nova senha</label>
          <PasswordInput placeholder="Mínimo 6 caracteres" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </div>
        <div>
          <label className="text-[11px] font-black uppercase tracking-widest text-slate-500 mb-1.5 block pl-1">Confirmar senha</label>
          <PasswordInput placeholder="Repete a senha" value={confirm} onChange={(e) => setConfirm(e.target.value)} required />
        </div>
        <Button type="submit" className="w-full" loading={loading} disabled={!valid}>
          Guardar nova senha
        </Button>
      </form>
    </div>
  );
}

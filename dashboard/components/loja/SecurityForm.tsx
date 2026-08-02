'use client';

import { useMemo, useState } from 'react';
import { PasswordInput } from '@/components/auth/PasswordInput';
import { Button } from '@/components/ui/Button';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/components/ui/Toast';

export function SecurityForm() {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [saving, setSaving] = useState(false);
  const { show } = useToast();

  const valid = useMemo(() => password.length >= 6 && password === confirm, [password, confirm]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!valid) return;
    setSaving(true);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password });
    setSaving(false);
    if (error) return show(error.message, 'error');
    setPassword('');
    setConfirm('');
    show('Senha atualizada.');
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 max-w-md">
      <div>
        <label className="text-[11px] font-black uppercase tracking-widest text-slate-500 mb-1.5 block pl-1">Nova senha</label>
        <PasswordInput value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Mínimo 6 caracteres" />
      </div>
      <div>
        <label className="text-[11px] font-black uppercase tracking-widest text-slate-500 mb-1.5 block pl-1">Confirmar nova senha</label>
        <PasswordInput value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="Repete a senha" />
      </div>
      <Button type="submit" loading={saving} disabled={!valid} className="self-start mt-2">
        Atualizar senha
      </Button>
    </form>
  );
}

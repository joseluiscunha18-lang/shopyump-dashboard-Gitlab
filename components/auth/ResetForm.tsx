'use client';

import { useState } from 'react';
import { definirNovaSenha, terminarSessao } from '@/lib/auth/client';
import { AuthButton, AuthField, AuthHeading } from './AuthUI';

export function ResetForm() {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const missing = [password.length < 8 && 'pelo menos 8 caracteres', !/\d/.test(password) && 'um número (0-9)'].filter(Boolean) as string[];
  const mismatch = confirm.length > 0 && confirm !== password;
  const valid = missing.length === 0 && confirm === password;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!valid) return;
    setError(''); setLoading(true);
    const r = await definirNovaSenha(password);
    if (!r.ok) { setLoading(false); return setError(r.error); }
    // Pede que entre de novo com a senha nova.
    await terminarSessao();
    window.location.assign('/login');
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex-1 flex flex-col">
      <AuthHeading title="Crie uma nova senha" subtitle="Escolha uma senha que ainda não tenha usado nesta conta." />
      <AuthField label="Nova senha" type="password" placeholder="Senha" autoComplete="new-password" autoFocus value={password} onChange={(e) => setPassword(e.target.value)} invalid={password.length > 0 && missing.length > 0} className="rounded-full px-5" />
      <div className="mt-2 text-[15px]">
        {missing.length ? (
          <>
            <p className="font-semibold text-foreground/80">A senha deve conter</p>
            <ul className="mt-1 space-y-0.5">
              {missing.map((m) => <li key={m} className="flex items-center gap-2 text-foreground/80"><span className="w-1.5 h-1.5 rounded-full bg-foreground/70" />{m}</li>)}
            </ul>
          </>
        ) : <p className="font-semibold text-success">A senha atende a todos os requisitos</p>}
      </div>
      <div className="mt-4">
        <AuthField label="Confirmar senha" type="password" placeholder="Repita a senha" autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} error={mismatch ? 'As senhas não coincidem.' : undefined} className="rounded-full px-5" />
      </div>
      {error && <p className="mt-3 text-[14px] text-destructive" role="alert">{error}</p>}
      <AuthButton type="submit" loading={loading} disabled={!valid} className="mt-5 rounded-full">Guardar nova senha</AuthButton>
    </form>
  );
}

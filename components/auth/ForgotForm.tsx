'use client';

import { useEffect, useState } from 'react';
import { MailCheck } from 'lucide-react';
import { enviarLinkRecuperacao } from '@/lib/auth/client';
import { AuthButton, AuthField, AuthHeading, BackButton } from './AuthUI';

const emailOk = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());

/** Recuperar senha: envia um LINK (o registo usa código de 6 dígitos). */
export function ForgotForm() {
  const [email, setEmail] = useState('');
  const [editing, setEditing] = useState(true);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [resent, setResent] = useState(false);

  useEffect(() => {
    const saved = sessionStorage.getItem('shopyump-auth-email') || '';
    if (emailOk(saved)) { setEmail(saved); setEditing(false); }
  }, []);

  async function send(e?: React.FormEvent) {
    e?.preventDefault();
    if (!emailOk(email)) return setError('Introduza um e-mail válido.');
    setLoading(true);
    const r = await enviarLinkRecuperacao(email);
    setLoading(false);
    if (!r.ok) return setError(r.error);
    sessionStorage.setItem('shopyump-auth-email', email.trim());
    setSent(true);
  }

  if (sent) {
    return (
      <div className="flex-1 flex flex-col">
        <BackButton onClick={() => setSent(false)} />
        <div className="mb-5 w-14 h-14 rounded-full border-[1.5px] border-foreground/20 flex items-center justify-center text-foreground">
          <MailCheck size={24} />
        </div>
        <AuthHeading
          title="Verifique o seu e-mail"
          subtitle={<>Enviámos um link de redefinição para <span className="font-semibold text-foreground">{email}</span>. Abra o e-mail e toque no link para criar uma nova senha.</>}
        />
        <p className="-mt-3 mb-6 text-[14px] text-muted-foreground">O link é válido por 1 hora. Se não o encontrar, verifique a pasta de spam.</p>
        <p className="mt-6 text-center text-[14px] text-muted-foreground">
          Não recebeu?{' '}
          <button type="button" onClick={async () => { const r = await enviarLinkRecuperacao(email); if (r.ok) setResent(true); else setError(r.error); }} className="font-semibold text-foreground underline underline-offset-4">{resent ? 'Link reenviado' : 'Reenviar link'}</button>
        </p>
        <a href="/login" className="mt-4 block text-center text-[14px] font-semibold text-foreground underline underline-offset-4">Voltar a entrar</a>
      </div>
    );
  }

  return (
    <form onSubmit={send} noValidate className="flex-1 flex flex-col">
      <BackButton onClick={() => window.location.assign('/login')} />
      <AuthHeading title="Redefina a sua senha" subtitle="Vamos enviar-lhe um link por e-mail para criar uma nova senha." />
      {editing ? (
        <AuthField label="E-mail" type="email" inputMode="email" autoComplete="email" autoFocus value={email} onChange={(e) => { setEmail(e.target.value); setError(''); }} error={error} className="rounded-full px-5" />
      ) : (
        <>
          <span className="block mb-2 text-[17px] font-semibold text-foreground">E-mail</span>
          <div className="h-[58px] rounded-full border border-foreground/25 bg-transparent px-5 flex items-center">
            <span className="truncate text-[16px] text-foreground/75">{email}</span>
          </div>
          <div className="mt-2 flex items-start justify-between gap-3 text-[14px]">
            <span className="text-muted-foreground">O link será enviado para este e-mail.</span>
            <button type="button" onClick={() => { setEditing(true); setEmail(''); }} className="shrink-0 font-semibold text-foreground underline underline-offset-4">Usar outro e-mail</button>
          </div>
        </>
      )}
      <AuthButton type="submit" loading={loading} disabled={!email} className="mt-5 rounded-full">Enviar link de redefinição</AuthButton>
      <p className="mt-6 text-center text-[17px] text-muted-foreground">
        Lembrou-se da senha? <a href="/login" className="text-foreground underline underline-offset-4">Entrar</a>
      </p>
    </form>
  );
}

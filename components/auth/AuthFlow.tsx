'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { confirmarCodigo, criarConta, entrarComSenha, metodoDaConta, reenviarCodigo } from '@/lib/auth/client';
import { AuthButton, AuthField, AuthHeading, BackButton, Divider } from './AuthUI';
import { GoogleAuthButton } from './GoogleAuthButton';

type Step = 'email' | 'google' | 'password' | 'create' | 'code';
const emailOk = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());

/** Entrar (/login) ou Criar conta (/register): e-mail primeiro; contas Gmail continuam com Google. */
export function AuthFlow({ mode = 'login' }: { mode?: 'login' | 'register' }) {
  const router = useRouter();
  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const [notice, setNotice] = useState('');

  const go = (s: Step, aviso = '') => { setError(''); setNotice(aviso); setStep(s); };
  const [touched, setTouched] = useState(false);


  async function submitEmail(e: React.FormEvent) {
    e.preventDefault();
    if (!emailOk(email)) return setError('Introduz um e-mail válido.');
    setPassword(''); setTouched(false);
    sessionStorage.setItem('shopyump-auth-email', email.trim());

    // Descobre como esta conta entra, para mostrar só o caminho que funciona.
    setLoading(true);
    const metodo = await metodoDaConta(email);
    setLoading(false);

    if (metodo === 'pendente') {
      return go('code', 'Este e-mail ainda não foi confirmado. Introduza o código que enviámos, ou peça um novo.');
    }
    if (metodo === 'google') return go('google');
    // Conta com senha (mesmo no ecrã de criar conta): segue para entrar com a senha.
    if (metodo === 'senha' || metodo === 'ambos') return go('password');
    go(mode === 'login' ? 'password' : 'create');
  }

  async function submitPassword(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const r = await entrarComSenha(email, password);
    if (!r.ok) { setLoading(false); return setError(r.error); }
    // O middleware decide: painel (tem loja) ou onboarding (ainda não tem).
    router.push('/'); router.refresh();
  }

  async function submitCreate(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const r = await criarConta(email, password);
    setLoading(false);
    if (!r.ok && r.limite) {
      // Limite de e-mails do Supabase: pode já existir um código recente — deixa tentar.
      return go('code', 'Já enviámos um código há pouco. Introduza-o abaixo. Se não o tiver, aguarde alguns minutos e peça um novo.');
    }
    if (!r.ok) return setError(r.error);
    go('code');
  }

  const title = mode === 'login' ? 'Entrar' : 'Crie sua conta';
  const footer = mode === 'login'
    ? <>Não tem uma conta? <a href="/register" className="text-foreground underline underline-offset-4">Crie sua conta</a></>
    : <>Já tem uma conta? <a href="/login" className="text-foreground underline underline-offset-4">Entrar</a></>;
  const bottom = (
    <>
      <p className="mt-6 text-center text-[17px] text-muted-foreground">{footer}</p>
      {mode === 'register' && (
        <p className="mt-6 pt-6 border-t border-border text-[13px] leading-relaxed text-muted-foreground">
          Ao se cadastrar, você concorda com nossos <a className="text-foreground underline underline-offset-2" href="#">Termos de Serviço</a> e nossa <a className="text-foreground underline underline-offset-2" href="#">Política de Privacidade</a>.
        </p>
      )}
    </>
  );
  const subtitle = mode === 'login' ? 'Acesse sua loja e gerencie suas vendas.' : 'Comece a vender online em poucos minutos.';
  const heading = (
    <div className="pt-0 pb-16">
      <h1 className="text-[34px] leading-[1.1] font-bold tracking-tight text-foreground">{title}</h1>
      <p className="mt-2 text-[16px] leading-snug text-muted-foreground">{subtitle}</p>
    </div>
  );

  if (step === 'email') {
    return (
      <div className="flex-1 flex flex-col">
        {heading}
        <form onSubmit={submitEmail} className="space-y-4" noValidate>
          <AuthField label="E-mail" type="email" inputMode="email" autoComplete="email" placeholder="nome@exemplo.com" value={email} onChange={(e) => { setEmail(e.target.value); setError(''); }} error={error} className="rounded-full px-5" />
          <AuthButton type="submit" loading={loading} disabled={!email} className="rounded-full">Continuar</AuthButton>
        </form>
        <Divider label="ou" />
        <GoogleAuthButton />
        {bottom}
      </div>
    );
  }

  const emailBox = (
    <>
      <span className="block mb-2 text-[17px] font-semibold text-foreground">E-mail</span>
      <div className="h-[58px] rounded-full border border-foreground/25 bg-transparent px-5 flex items-center justify-between gap-3">
        <span className="truncate text-[16px] text-foreground/75">{email}</span>
        <button type="button" onClick={() => go('email')} className="text-[17px] font-medium text-foreground underline underline-offset-4">Editar</button>
      </div>
    </>
  );
  const loginHeading = (
    <div className="pt-0 pb-16">
      <h1 className="text-[34px] leading-[1.1] font-bold tracking-tight text-foreground">Entrar</h1>
      <p className="mt-2 text-[16px] leading-snug text-muted-foreground">Acesse sua loja e gerencie suas vendas.</p>
    </div>
  );

  if (step === 'google') {
    return (
      <div className="flex-1 flex flex-col">
        {loginHeading}
        {emailBox}
        <div className="mt-4">
          <GoogleAuthButton email={email} variant="primary" />
        </div>
        {bottom}
      </div>
    );
  }

  if (step === 'password') {
    return (
      <form onSubmit={submitPassword} noValidate className="flex-1 flex flex-col">
        {loginHeading}
        {emailBox}
        <div className="mt-5 space-y-5">
          <AuthField label="Senha" type="password" placeholder="Senha" autoComplete="current-password" autoFocus value={password} onChange={(e) => { setPassword(e.target.value); setError(''); }} error={error} className="rounded-full px-5" />
          <AuthButton type="submit" loading={loading} disabled={!password} className="rounded-full">Entrar</AuthButton>
          <a href="/forgot-password" className="block text-center text-[14px] font-semibold text-foreground underline underline-offset-4 py-1">Esqueceu a senha?</a>
        </div>
        {bottom}
      </form>
    );
  }

  if (step === 'create') {
    const missing = [
      password.length < 8 && 'pelo menos 8 caracteres',
      !/\d/.test(password) && 'um número (0-9)',
    ].filter(Boolean) as string[];
    return (
      <form onSubmit={(e) => {
        e.preventDefault();
        setTouched(true);
        if (!password) return setError('A senha é obrigatória');
        if (missing.length) return setError('Falha na validação da senha. Tente usar uma senha com pelo menos 8 caracteres e um número (0-9).');
        void submitCreate(e);
      }} noValidate className="flex-1 flex flex-col">
        {heading}
        {emailBox}
        <div className="mt-5">
          <AuthField label="Senha" type="password" placeholder="Senha" autoComplete="new-password" autoFocus value={password} onChange={(e) => { setPassword(e.target.value); setError(''); }} onBlur={() => password && setTouched(true)} className="rounded-full px-5" invalid={!!error || (password.length > 0 && missing.length > 0)} />
          <div id="pw-rules" className="mt-2 text-[17px]">
            {missing.length ? (
              <>
                <p className="font-semibold text-foreground/80">A senha deve conter</p>
                <ul className="mt-1 space-y-0.5">
                  {missing.map((m) => <li key={m} className="flex items-center gap-2 text-foreground/80"><span className="w-1.5 h-1.5 rounded-full bg-foreground/70" />{m}</li>)}
                </ul>
              </>
            ) : <p className="font-semibold text-success">A senha atende a todos os requisitos</p>}
            {error && <p className="mt-2 text-destructive">{error}</p>}
          </div>
        </div>
        <AuthButton type="submit" loading={loading} disabled={missing.length > 0} className="mt-4 rounded-full">Crie sua conta</AuthButton>
        {bottom}
      </form>
    );
  }

  return <CodeStep email={email} notice={notice} onBack={() => go('email')} onDone={() => { window.location.assign('/onboarding'); }} />;
}

export function CodeStep({ email, notice, onBack, onDone }: { email: string; notice?: string; onBack: () => void; onDone: () => void }) {
  const [digits, setDigits] = useState<string[]>(Array(6).fill(''));
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const refs = useRef<(HTMLInputElement | null)[]>([]);
  const complete = digits.every((d) => d);
  useEffect(() => { refs.current[0]?.focus(); }, []);

  async function confirmar() {
    if (!complete || loading) return;
    setError(''); setLoading(true);
    const r = await confirmarCodigo(email, digits.join(''));
    if (!r.ok) { setLoading(false); setError(r.error); setDigits(Array(6).fill('')); refs.current[0]?.focus(); return; }
    onDone();
  }
  // Confirma sozinho quando o 6.º dígito é escrito.
  useEffect(() => { if (complete) void confirmar(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [complete]);

  async function reenviar() {
    setError('');
    const r = await reenviarCodigo(email);
    if (!r.ok) return setError(r.error);
    setSent(true);
  }

  function set(i: number, v: string) {
    if (loading) return;
    setError('');
    const clean = v.replace(/\D/g, '');
    if (clean.length > 1) {
      const next = clean.slice(0, 6).split('');
      setDigits([...next, ...Array(6 - next.length).fill('')]);
      refs.current[Math.min(next.length, 5)]?.focus();
      return;
    }
    setDigits((d) => d.map((x, j) => (j === i ? clean : x)));
    if (clean && i < 5) refs.current[i + 1]?.focus();
  }

  return (
    <div>
      <BackButton onClick={onBack} />
      <AuthHeading title="Confirme o seu e-mail" subtitle={<>Enviámos um código de 6 dígitos para <span className="font-semibold text-foreground">{email}</span>. Introduza-o abaixo para ativar a sua conta.</>} />
      {notice && <p className="mb-4 -mt-2 text-[14px] leading-snug text-muted-foreground" role="status">{notice}</p>}
      <div className="flex justify-between gap-2">
        {digits.map((d, i) => (
          <input
            key={i}
            ref={(el) => { refs.current[i] = el; }}
            value={d}
            inputMode="numeric"
            autoComplete={i === 0 ? 'one-time-code' : 'off'}
            aria-label={`Dígito ${i + 1}`}
            maxLength={6}
            readOnly={loading}
            onChange={(e) => set(i, e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Backspace' && !d && i > 0) refs.current[i - 1]?.focus(); }}
            className="w-full min-w-0 h-[60px] rounded-xl border border-foreground/25 bg-transparent text-center text-[22px] font-bold text-foreground outline-none transition-colors focus:border-info disabled:opacity-60"
          />
        ))}
      </div>
      {error && <p className="mt-3 text-[14px] text-destructive" role="alert">{error}</p>}
      <button
        type="button"
        disabled={!complete || loading}
        onClick={() => void confirmar()}
        aria-busy={loading}
        className="mt-6 flex h-[56px] w-full items-center justify-center gap-2 rounded-xl bg-foreground text-[17px] font-semibold text-background transition-opacity disabled:opacity-50"
      >
        {loading && <span className="h-4 w-4 animate-spin rounded-full border-2 border-background/40 border-t-background" aria-hidden />}
        {loading ? 'A verificar…' : 'Confirmar código'}
      </button>
      <p className="mt-6 text-[14px] text-muted-foreground">
        Não recebeu o código? Verifique o spam ou{' '}
        <button type="button" onClick={() => void reenviar()} className="font-semibold text-foreground underline underline-offset-4">{sent ? 'Código reenviado' : 'reenviar código'}</button>
      </p>
    </div>
  );
}

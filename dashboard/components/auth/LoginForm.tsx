'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Mail } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { Input } from '@/components/ui/Input';
import { PasswordInput } from '@/components/auth/PasswordInput';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';
import { GoogleAuthButton } from '@/components/auth/GoogleAuthButton';

export function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { show } = useToast();

  // Same validity rule as validateLogin() in the legacy view-login.js.
  const valid = useMemo(() => email.includes('@') && email.length > 5 && password.length >= 1, [email, password]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!valid) return;
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password: password.trim() });
    if (error) {
      show(`Erro: ${error.message}`, 'error');
      setLoading(false);
      return;
    }
    router.push('/');
    router.refresh();
  }

  return (
    <div className="space-y-5">
      <div className="mb-2 text-center">
        <h2 className="text-2xl font-extrabold text-ink tracking-tight mb-2">Iniciar sessão</h2>
        <p className="text-sm text-slate-500 font-medium">Insere as tuas credenciais para aceder ao painel.</p>
      </div>

      <GoogleAuthButton />

      <div className="flex items-center gap-4 py-1">
        <div className="h-px bg-slate-200 flex-1" />
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Ou</span>
        <div className="h-px bg-slate-200 flex-1" />
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="E-mail"
          type="email"
          icon={<Mail size={16} />}
          placeholder="exemplo@loja.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <div>
          <div className="flex justify-between items-center mb-1.5 px-1">
            <label className="text-[11px] font-black uppercase tracking-widest text-slate-500">Senha</label>
            <Link href="/recuperar" className="text-[11px] font-bold text-slate-400 hover:text-ink transition-colors">
              Esqueceste-te?
            </Link>
          </div>
          <PasswordInput placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </div>

        <Button type="submit" className="w-full mt-2" disabled={!valid} loading={loading}>
          Entrar
        </Button>
      </form>

      <div className="text-center border-t border-slate-100 pt-6">
        <p className="text-sm text-slate-500 font-semibold">
          Novo na plataforma?{' '}
          <Link href="/registar" className="text-ink font-black hover:underline underline-offset-4">
            Criar conta grátis
          </Link>
        </p>
      </div>
    </div>
  );
}

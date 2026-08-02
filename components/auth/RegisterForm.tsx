'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Mail, User } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { Input } from '@/components/ui/Input';
import { PasswordInput } from '@/components/auth/PasswordInput';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';
import { GoogleAuthButton } from '@/components/auth/GoogleAuthButton';

export function RegisterForm() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { show } = useToast();

  const valid = useMemo(
    () => name.trim().length > 1 && email.includes('@') && email.length > 5 && password.length >= 6,
    [name, email, password]
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!valid) return;
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signUp({
      email: email.trim(),
      password: password.trim(),
      options: { data: { nome: name.trim() } },
    });
    if (error) {
      show(`Erro: ${error.message}`, 'error');
      setLoading(false);
      return;
    }
    router.push('/verificar');
  }

  return (
    <div className="space-y-5">
      <div className="mb-2 text-center">
        <h2 className="text-2xl font-extrabold text-ink tracking-tight mb-2">Criar conta</h2>
        <p className="text-sm text-slate-500 font-medium">Começa a vender no Shopyump em poucos minutos.</p>
      </div>

      <GoogleAuthButton />

      <div className="flex items-center gap-4 py-1">
        <div className="h-px bg-slate-200 flex-1" />
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Ou</span>
        <div className="h-px bg-slate-200 flex-1" />
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input label="Nome" icon={<User size={16} />} placeholder="O teu nome" value={name} onChange={(e) => setName(e.target.value)} required />
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
          <label className="text-[11px] font-black uppercase tracking-widest text-slate-500 mb-1.5 block pl-1">Senha</label>
          <PasswordInput placeholder="Mínimo 6 caracteres" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </div>

        <Button type="submit" className="w-full mt-2" disabled={!valid} loading={loading}>
          Criar conta grátis
        </Button>
      </form>

      <div className="text-center border-t border-slate-100 pt-6">
        <p className="text-sm text-slate-500 font-semibold">
          Já tens conta?{' '}
          <Link href="/login" className="text-ink font-black hover:underline underline-offset-4">
            Iniciar sessão
          </Link>
        </p>
      </div>
    </div>
  );
}

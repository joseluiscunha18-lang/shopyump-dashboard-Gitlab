'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Mail, ArrowLeft } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';
import { DASHBOARD_BASE_PATH } from '@/lib/domains';

export function ForgotForm() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const { show } = useToast();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}${DASHBOARD_BASE_PATH}/nova-senha`,
    });
    setLoading(false);
    if (error) return show(error.message, 'error');
    setSent(true);
  }

  if (sent) {
    return (
      <div className="text-center space-y-4">
        <h2 className="text-2xl font-extrabold text-ink tracking-tight">Verifica o teu e-mail</h2>
        <p className="text-sm text-slate-500 font-medium">
          Se existir uma conta associada a <strong className="text-ink">{email}</strong>, vais receber um link para
          repor a senha.
        </p>
        <Link href="/login" className="text-sm font-bold text-ink hover:underline underline-offset-4 inline-block pt-2">
          Voltar a iniciar sessão
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Link href="/login" className="inline-flex items-center gap-1.5 text-[11px] font-bold text-slate-400 hover:text-ink">
        <ArrowLeft size={14} /> Voltar
      </Link>
      <div>
        <h2 className="text-2xl font-extrabold text-ink tracking-tight mb-2">Recuperar senha</h2>
        <p className="text-sm text-slate-500 font-medium">Insere o teu e-mail e enviamos-te um link para repor a senha.</p>
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
        <Button type="submit" className="w-full" loading={loading} disabled={!email.includes('@')}>
          Enviar link
        </Button>
      </form>
    </div>
  );
}

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { MailCheck } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useToast } from '@/components/ui/Toast';

export function VerifyNotice() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const { show } = useToast();

  async function resend() {
    if (!email.includes('@')) {
      show('Indica o e-mail que usaste no registo.', 'error');
      return;
    }
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.resend({ type: 'signup', email: email.trim() });
    setLoading(false);
    if (error) return show(error.message, 'error');
    show('E-mail de confirmação reenviado.');
  }

  return (
    <div className="text-center space-y-6">
      <div className="w-16 h-16 rounded-full bg-brand-soft text-brand flex items-center justify-center mx-auto">
        <MailCheck size={26} />
      </div>
      <div>
        <h2 className="text-2xl font-extrabold text-ink tracking-tight mb-2">Confirma o teu e-mail</h2>
        <p className="text-sm text-slate-500 font-medium leading-relaxed">
          Enviámos um link de confirmação para a tua caixa de entrada. Depois de confirmares, já podes iniciar sessão.
        </p>
      </div>
      <div className="space-y-3 text-left pt-2">
        <Input placeholder="O teu e-mail" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <Button variant="secondary" className="w-full" loading={loading} onClick={resend}>
          Reenviar e-mail
        </Button>
      </div>
      <Link href="/login" className="text-sm font-bold text-ink hover:underline underline-offset-4 inline-block pt-2">
        Voltar a iniciar sessão
      </Link>
    </div>
  );
}

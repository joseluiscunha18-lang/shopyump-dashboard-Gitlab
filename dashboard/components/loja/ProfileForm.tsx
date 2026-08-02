'use client';

import { useState } from 'react';
import { User, Mail } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/components/ui/Toast';

export function ProfileForm({ initialName, email }: { initialName: string; email: string }) {
  const [name, setName] = useState(initialName);
  const [saving, setSaving] = useState(false);
  const { show } = useToast();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ data: { nome: name.trim() } });
    setSaving(false);
    if (error) return show(error.message, 'error');
    show('Perfil atualizado.');
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 max-w-md">
      <Input label="Nome" icon={<User size={15} />} value={name} onChange={(e) => setName(e.target.value)} />
      <Input label="E-mail" icon={<Mail size={15} />} value={email} disabled hint="Contacta o suporte para alterar o e-mail da conta." />
      <Button type="submit" loading={saving} className="self-start mt-2">
        Guardar alterações
      </Button>
    </form>
  );
}

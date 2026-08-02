import type { Metadata } from 'next';
import { getUserContext } from '@/lib/auth/getUserContext';
import { ProfileForm } from '@/components/loja/ProfileForm';
import { createClient } from '@/lib/supabase/server';

export const metadata: Metadata = { title: 'Perfil | Shopyump' };

export default async function PerfilPage() {
  const ctx = await getUserContext();
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="flex flex-col gap-6 pt-2">
      <div>
        <h2 className="text-lg font-black text-ink tracking-tight">Perfil</h2>
        <p className="text-[12px] font-medium text-slate-400">Dados da tua conta</p>
      </div>
      <ProfileForm initialName={(user?.user_metadata?.nome as string) ?? ''} email={ctx.email ?? ''} />
    </div>
  );
}

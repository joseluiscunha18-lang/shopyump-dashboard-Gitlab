import type { Metadata } from 'next';
import { getUserContext } from '@/lib/auth/getUserContext';
import { StoreSettingsForm } from '@/components/loja/StoreSettingsForm';

export const metadata: Metadata = { title: 'Editar loja | Shopyump' };

export default async function LojaPage() {
  const ctx = await getUserContext();
  if (!ctx.loja) return null;

  return (
    <div className="flex flex-col gap-6 pt-2">
      <div>
        <h2 className="text-lg font-black text-ink tracking-tight">Editar loja</h2>
        <p className="text-[12px] font-medium text-slate-400">Configurações da tua loja pública</p>
      </div>
      <StoreSettingsForm loja={ctx.loja} />
    </div>
  );
}

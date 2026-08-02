import type { Metadata } from 'next';
import { SecurityForm } from '@/components/loja/SecurityForm';

export const metadata: Metadata = { title: 'Segurança | Shopyump' };

export default function SegurancaPage() {
  return (
    <div className="flex flex-col gap-6 pt-2">
      <div>
        <h2 className="text-lg font-black text-ink tracking-tight">Segurança</h2>
        <p className="text-[12px] font-medium text-slate-400">Alterar a tua senha de acesso</p>
      </div>
      <SecurityForm />
    </div>
  );
}

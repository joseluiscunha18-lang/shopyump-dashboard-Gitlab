'use client';

import { useState } from 'react';
import { Trash2, Loader2 } from 'lucide-react';
import { limparDadosExemplo } from '@/lib/mutations/limparDadosExemplo';
import { useToast } from '@/components/ui/Toast';
import { useRouter } from 'next/navigation';

/**
 * "Remover todos os dados de exemplo com 1 clique" — limpa o conteúdo
 * institucional genérico (Sobre/Entrega/Termos) semeado no onboarding.
 * Ver lib/mutations/limparDadosExemplo.ts para o porquê de não haver
 * "produtos de exemplo" para limpar aqui — esses nunca são gravados.
 *
 * Integração: em StoreSettingsForm.tsx (ou onde fizer sentido nas
 * definições da loja), passando `loja.id`:
 *   <RemoverDadosExemploButton lojaId={loja.id} />
 */
export function RemoverDadosExemploButton({ lojaId }: { lojaId: string }) {
  const [loading, setLoading] = useState(false);
  const [confirmando, setConfirmando] = useState(false);
  const { show } = useToast();
  const router = useRouter();

  async function confirmar() {
    setLoading(true);
    const res = await limparDadosExemplo(lojaId);
    setLoading(false);
    setConfirmando(false);
    if (res.ok) {
      show('Dados de exemplo removidos.');
      router.refresh();
    } else {
      show(res.error ?? 'Não foi possível remover os dados de exemplo.');
    }
  }

  if (confirmando) {
    return (
      <div className="flex flex-col gap-2 rounded-[12px] border border-red-200 bg-red-50 p-3.5">
        <p className="text-[12.5px] font-semibold text-red-700">
          Isto apaga o texto de Sobre, Entregas e Termos da tua loja. Não pode ser desfeito. Tens a certeza?
        </p>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={confirmar}
            disabled={loading}
            className="flex items-center gap-1.5 rounded-full bg-red-600 px-4 py-2 text-[12.5px] font-bold text-white active:opacity-80"
          >
            {loading && <Loader2 size={13} className="animate-spin" />}
            Sim, remover
          </button>
          <button
            type="button"
            onClick={() => setConfirmando(false)}
            className="rounded-full bg-white px-4 py-2 text-[12.5px] font-bold text-slate-500"
          >
            Cancelar
          </button>
        </div>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setConfirmando(true)}
      className="flex items-center gap-1.5 text-[12.5px] font-bold text-red-600 active:opacity-60"
    >
      <Trash2 size={14} />
      Remover todos os dados de exemplo
    </button>
  );
}

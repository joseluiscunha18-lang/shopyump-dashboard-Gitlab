'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ChevronLeft, Check } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';
import { StorePreview } from '@/components/loja/preview/StorePreview';
import type { Theme } from '@/types/theme';
import { resolvePreviewProductsDireto, resolvePreviewStore } from '@/lib/mocks/storePreview';
import { loadCustomization, saveCustomization } from '@/lib/customize/storage';
import type { Loja } from '@/types/database';
import type { ProdutoPreview } from '@/lib/queries/produtos';

/**
 * Página de detalhe de um tema — entre o catálogo (miniaturas) e o
 * editor (toque para editar). O preview aqui é responsivo por si só
 * (o mesmo <StorePreview /> que a loja pública usa), sem alternador
 * Mobile/Desktop: não é o lugar para simular dispositivos, é o lugar
 * para ver o tema. Continua estático — não reage a toques. "Usar este
 * tema" aplica e volta para "Personalizar loja".
 */
export function ThemeDetail({ loja, produtos, theme }: { loja: Loja; produtos: ProdutoPreview[]; theme: Theme }) {
  const router = useRouter();
  const { show } = useToast();
  const [applying, setApplying] = useState(false);
  const emUso = loadCustomization(loja.id).temaId === theme.id;

  const store = resolvePreviewStore({ nome: loja.nome, descricao: loja.descricao, bannerUrl: loja.banner_url });
  const products = resolvePreviewProductsDireto(produtos);

  function usarTema() {
    setApplying(true);
    const atual = loadCustomization(loja.id);
    saveCustomization(loja.id, { ...atual, temaId: theme.id });
    show('Tema aplicado.');
    router.push('/loja');
  }

  return (
    <div className="flex flex-col gap-5 pt-2">
      <div className="flex items-center justify-between">
        <Link href="/loja/temas" className="flex items-center gap-1 text-[13px] font-bold text-slate-500">
          <ChevronLeft size={18} /> Temas
        </Link>
        {emUso && (
          <span className="flex items-center gap-1 text-[12px] font-bold text-emerald-600">
            <Check size={14} /> Em uso
          </span>
        )}
      </div>

      <div className="text-center">
        <h2 className="text-lg font-black tracking-tight text-ink">{theme.name}</h2>
        <p className="text-[12px] font-medium text-slate-400">{theme.tagline}</p>
      </div>

      {/* Preview estático, responsivo — sem alternador de dispositivo */}
      <div className="h-[500px] w-full overflow-hidden rounded-[20px] border border-[#E5E3E0] shadow-[0_1px_3px_rgba(15,23,42,0.06)]">
        <StorePreview theme={theme} store={store} products={products} />
      </div>

      {/* Características */}
      <div className="flex flex-col gap-2 rounded-[16px] border border-[#E5E3E0] px-4 py-3.5">
        <span className="text-[11px] font-black uppercase tracking-widest text-slate-500">Características</span>
        <ul className="flex flex-col gap-2">
          {theme.features.map((f) => (
            <li key={f} className="flex items-center gap-2 text-[13px] font-medium text-ink">
              <Check size={15} className="text-emerald-600" /> {f}
            </li>
          ))}
        </ul>
      </div>

      {!emUso ? (
        <Button type="button" size="lg" loading={applying} onClick={usarTema}>
          Usar este tema
        </Button>
      ) : (
        <Button type="button" size="lg" variant="secondary" onClick={() => router.push('/loja')}>
          Voltar ao editor
        </Button>
      )}
    </div>
  );
}

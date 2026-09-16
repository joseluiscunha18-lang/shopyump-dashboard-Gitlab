'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ChevronLeft, Check, Smartphone, Monitor } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';
import { cn } from '@/lib/cn';
import { StorePreview } from '@/components/loja/preview/StorePreview';
import type { Theme } from '@/types/theme';
import { resolvePreviewProductsDireto, resolvePreviewStore } from '@/lib/mocks/storePreview';
import { loadCustomization, saveCustomization } from '@/lib/customize/storage';
import type { Loja } from '@/types/database';
import type { ProdutoPreview } from '@/lib/queries/produtos';

/**
 * Página de detalhe de um tema — entre o catálogo (cartões pequenos) e o
 * editor (toque para editar). Aqui o preview é maior e tem o alternador
 * Mobile/Desktop, mas continua estático: serve para VER o tema, não para
 * editar nada. "Usar este tema" aplica e volta para "Personalizar loja".
 *
 * Mobile-first ≠ mobile-only: a loja pública tem de funcionar bem nos
 * dois, por isso o alternador existe aqui — mas o catálogo (onde o
 * vendedor só está a comparar rapidamente) mostra só mobile, que é o
 * dispositivo com que ele está a gerir a loja.
 */
export function ThemeDetail({ loja, produtos, theme }: { loja: Loja; produtos: ProdutoPreview[]; theme: Theme }) {
  const router = useRouter();
  const { show } = useToast();
  const [device, setDevice] = useState<'mobile' | 'desktop'>('mobile');
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

      {/* Mobile / Desktop */}
      <div className="flex justify-center">
        <div className="inline-flex rounded-full border border-[#E5E3E0] p-1">
          <button
            type="button"
            onClick={() => setDevice('mobile')}
            className={cn(
              'flex items-center gap-1.5 rounded-full px-4 py-1.5 text-[12px] font-bold transition-colors',
              device === 'mobile' ? 'bg-[#111110] text-white' : 'text-slate-500'
            )}
          >
            <Smartphone size={14} /> Mobile
          </button>
          <button
            type="button"
            onClick={() => setDevice('desktop')}
            className={cn(
              'flex items-center gap-1.5 rounded-full px-4 py-1.5 text-[12px] font-bold transition-colors',
              device === 'desktop' ? 'bg-[#111110] text-white' : 'text-slate-500'
            )}
          >
            <Monitor size={14} /> Desktop
          </button>
        </div>
      </div>

      {/* Preview estático, maior — continua sem reagir a toques */}
      <div className="flex justify-center">
        <div
          className={cn(
            'overflow-hidden border border-[#E5E3E0] shadow-[0_1px_3px_rgba(15,23,42,0.06)] transition-all',
            device === 'mobile' ? 'h-[600px] w-[300px] rounded-[28px]' : 'h-[420px] w-full rounded-[16px]'
          )}
        >
          <StorePreview theme={theme} store={store} products={products} settings={device === 'desktop' ? { colunas: 3 } : undefined} />
        </div>
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

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ChevronLeft, Check, Loader2, Eye } from 'lucide-react';
import { cn } from '@/lib/cn';
import { Sheet } from '@/components/ui/Sheet';
import { StorePreview } from '@/components/loja/preview/StorePreview';
import type { Theme } from '@/types/theme';
import { resolvePreviewProductsDireto, resolvePreviewStore } from '@/lib/mocks/storePreview';
import { loadCustomization, saveCustomization } from '@/lib/customize/storage';
import { useToast } from '@/components/ui/Toast';
import type { Loja } from '@/types/database';
import type { ProdutoPreview } from '@/lib/queries/produtos';

/**
 * Página de detalhe de um tema — entre o catálogo (miniaturas) e o
 * editor (toque para editar).
 *
 * O preview "de corpo inteiro" na página fica sempre `frozen` — só de
 * olhar, sem scroll nem toque, como uma foto do tema. Para explorar de
 * verdade, o botão de olho abre uma pré-visualização quase em ecrã
 * cheio DENTRO da mesma página (um <Sheet> a 96vh) — não navega para
 * lado nenhum, só sobe por cima como "uma página dentro da outra",
 * igual ao "Try" da Shopify Theme Store. Só aí o preview deixa de ser
 * `frozen` e volta a rolar normalmente.
 */
export function ThemeDetail({ loja, produtos, theme }: { loja: Loja; produtos: ProdutoPreview[]; theme: Theme }) {
  const router = useRouter();
  const { show } = useToast();
  const [applying, setApplying] = useState(false);
  const [previewAberto, setPreviewAberto] = useState(false);
  const emUso = loadCustomization(loja.id).temaId === theme.id;

  const store = resolvePreviewStore({ nome: loja.nome, descricao: loja.descricao, bannerUrl: loja.banner_url });
  const products = resolvePreviewProductsDireto(produtos);

  function usarTema() {
    if (emUso) return;
    setApplying(true);
    const atual = loadCustomization(loja.id);
    saveCustomization(loja.id, { ...atual, temaId: theme.id });
    show('Tema aplicado.');
    router.push('/loja');
  }

  const botaoUsar = (
    <button
      type="button"
      onClick={usarTema}
      disabled={emUso || applying}
      className={cn(
        'flex shrink-0 items-center gap-1.5 rounded-full px-5 py-2.5 text-[13px] font-bold transition-colors',
        emUso ? 'bg-[#F4F4F3] text-slate-400' : 'bg-[#111110] text-white active:opacity-80'
      )}
    >
      {applying && <Loader2 size={14} className="animate-spin" />}
      {emUso ? 'Em uso' : 'Usar tema'}
    </button>
  );

  return (
    <div className="flex flex-col gap-8 pt-2">
      <Link href="/loja/temas" className="flex items-center gap-1 text-[13px] font-bold text-slate-500">
        <ChevronLeft size={18} /> Temas
      </Link>

      {/* Preview congelado — só de olhar, com o botão de olho e a barra
          de ação flutuante por cima, como a Shopify Theme Store */}
      <div className="relative pb-8">
        <div className="h-[560px] w-full overflow-hidden rounded-[22px] border border-[#E5E3E0] shadow-[0_1px_3px_rgba(15,23,42,0.06)]">
          <StorePreview theme={theme} store={store} products={products} frozen />
        </div>

        <button
          type="button"
          onClick={() => setPreviewAberto(true)}
          aria-label="Ver tema"
          className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-black/55 text-white backdrop-blur-sm active:opacity-80"
        >
          <Eye size={17} />
        </button>

        <div className="absolute inset-x-4 -bottom-0 flex items-center justify-between gap-3 rounded-[16px] border border-[#E5E3E0] bg-white px-4 py-3 shadow-[0_8px_24px_-8px_rgba(15,23,42,0.25)]">
          <div className="flex min-w-0 flex-col">
            <span className="truncate text-[14px] font-black text-ink">{theme.name}</span>
            <span className="flex items-center gap-1.5 text-[11px] font-bold text-slate-400">
              {theme.pricing === 'gratis' ? 'Grátis' : 'Premium'}
              {emUso && (
                <>
                  <span aria-hidden>·</span>
                  <span className="flex items-center gap-1 text-emerald-600">
                    <Check size={12} /> Em uso
                  </span>
                </>
              )}
            </span>
          </div>
          {botaoUsar}
        </div>
      </div>

      <div>
        <h2 className="text-lg font-black tracking-tight text-ink">{theme.name}</h2>
        <p className="text-[12.5px] font-medium text-slate-400">{theme.tagline}</p>
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

      {/* Pré-visualização quase em ecrã cheio — sobe por cima da própria
          página, não navega. Aqui sim o preview rola normalmente. */}
      <Sheet
        open={previewAberto}
        onClose={() => setPreviewAberto(false)}
        title={theme.name}
        subtitle="Pré-visualização do tema"
        heightVh={96}
        closeButton
        footer={
          <div className="flex items-center justify-between gap-3">
            <span className="text-[12px] font-bold text-slate-400">{theme.pricing === 'gratis' ? 'Grátis' : 'Premium'}</span>
            {botaoUsar}
          </div>
        }
      >
        <div className="h-[70vh] w-full overflow-hidden rounded-[16px] border border-[#E5E3E0]">
          <StorePreview theme={theme} store={store} products={products} />
        </div>
      </Sheet>
    </div>
  );
}

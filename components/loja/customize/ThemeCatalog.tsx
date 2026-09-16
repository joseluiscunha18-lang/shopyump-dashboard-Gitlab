'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ChevronLeft, Check } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';
import { StorePreview } from '@/components/loja/preview/StorePreview';
import { THEMES } from '@/types/theme';
import { resolvePreviewProductsDireto, resolvePreviewStore } from '@/lib/mocks/storePreview';
import { loadCustomization, saveCustomization } from '@/lib/customize/storage';
import type { Loja } from '@/types/database';
import type { ProdutoPreview } from '@/lib/queries/produtos';

/**
 * Catálogo de temas — página dedicada, separada do editor (§ pedido do
 * utilizador). Diferente do antigo `ThemeSheet` (removido): não é um
 * modal, e o preview de cada card é só uma imagem estática da loja — não
 * reage a toques. Explorar/comparar temas acontece aqui; ver um tema em
 * detalhe acontece na página seguinte (`/loja/temas/[id]`); editar só
 * acontece de volta em "Personalizar loja".
 *
 * O preview aqui é sempre mobile — é onde o vendedor decide entre temas
 * rapidamente, e a versão mobile é a mais rápida de entender num cartão
 * pequeno. A comparação com desktop fica para a página de detalhe.
 */
export function ThemeCatalog({ loja, produtos }: { loja: Loja; produtos: ProdutoPreview[] }) {
  const router = useRouter();
  const { show } = useToast();
  const [appliedThemeId, setAppliedThemeId] = useState(() => loadCustomization(loja.id).temaId);
  const [applying, setApplying] = useState<string | null>(null);

  const store = resolvePreviewStore({ nome: loja.nome, descricao: loja.descricao, bannerUrl: loja.banner_url });
  const products = resolvePreviewProductsDireto(produtos);

  function usarTema(id: string) {
    setApplying(id);
    const atual = loadCustomization(loja.id);
    saveCustomization(loja.id, { ...atual, temaId: id });
    setAppliedThemeId(id);
    show('Tema aplicado.');
    router.push('/loja');
  }

  return (
    <div className="flex flex-col gap-5 pt-2">
      <Link href="/loja" className="flex items-center gap-1 text-[13px] font-bold text-slate-500">
        <ChevronLeft size={18} /> Editar loja
      </Link>

      <div>
        <h2 className="text-lg font-black tracking-tight text-ink">Temas</h2>
        <p className="text-[12px] font-medium text-slate-400">Escolha uma aparência para sua loja.</p>
      </div>

      <div className="flex flex-col gap-5">
        {THEMES.map((theme) => {
          const emUso = theme.id === appliedThemeId;
          return (
            <div key={theme.id} className="flex flex-col overflow-hidden rounded-[20px] border border-[#E5E3E0]">
              {/* Preview estático — sem onSelect/editable, não reage a toques */}
              <Link href={`/loja/temas/${theme.id}`} className="block h-64 w-full">
                <StorePreview theme={theme} store={store} products={products} />
              </Link>
              <div className="flex flex-col gap-3 px-4 py-3.5">
                <div className="flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className="text-[14px] font-black text-ink">{theme.name}</span>
                    <span className="text-[11.5px] font-medium text-slate-400">{theme.tagline}</span>
                  </div>
                  {emUso && (
                    <span className="flex shrink-0 items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-600">
                      <Check size={13} /> Em uso
                    </span>
                  )}
                </div>
                <div className="flex gap-2">
                  <Link href={`/loja/temas/${theme.id}`} className="flex-1">
                    <Button type="button" variant="secondary" className="w-full">
                      Visualizar
                    </Button>
                  </Link>
                  {!emUso && (
                    <Button
                      type="button"
                      className="flex-1"
                      loading={applying === theme.id}
                      onClick={() => usarTema(theme.id)}
                    >
                      Usar este tema
                    </Button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

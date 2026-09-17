'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ChevronDown, ChevronLeft, ChevronRight, ExternalLink, Palette } from 'lucide-react';
import { Sheet } from '@/components/ui/Sheet';
import { StorePreview, type EditableRegion } from '@/components/loja/preview/StorePreview';
import { StoreSettingsForm } from '@/components/loja/StoreSettingsForm';
import { ColorSheet } from './ColorSheet';
import { ButtonStyleSheet } from './ButtonStyleSheet';
import { BannerSheet } from './BannerSheet';
import { InfoSheet } from './InfoSheet';
import { ProdutosSheet } from './ProdutosSheet';
import { getThemeById } from '@/types/theme';
import type { ThemeButtonRadius } from '@/types/theme';
import { resolvePreviewProductsDireto, resolvePreviewStore } from '@/lib/mocks/storePreview';
import { loadCustomization, saveCustomization, hasSeenEditHint, markEditHintSeen } from '@/lib/customize/storage';
import type { LojaCustomization } from '@/lib/customize/types';
import type { Loja } from '@/types/database';
import type { ProdutoPreview } from '@/lib/queries/produtos';
import { getStoreUrl } from '@/lib/storeUrl';

type PanelKind = 'cores' | 'estilo' | 'banner' | 'info' | 'produtos' | 'completo' | null;

/**
 * "Personalizar loja" — editor por toque na pré-visualização.
 *
 * A escolha de TEMA não vive mais aqui: é uma página dedicada
 * (`/loja/temas`, catálogo estático) + a página de detalhe de cada tema
 * (`/loja/temas/[id]`) — nunca um modal, e o preview delas nunca reage a
 * toques. Esta página só lida com o tema já aplicado (mostra o nome e
 * um link "Alterar") e com os ajustes por toque na prévia (banner, nome/
 * descrição, produtos), que são coisas de EDIÇÃO, diferentes de
 * ESCOLHER um tema. Tudo o resto (cores, estilo, contactos, secções)
 * fica atrás de "Mais configurações", fechado por omissão.
 */
export function PersonalizarLojaPage({ loja, produtos }: { loja: Loja; produtos: ProdutoPreview[] }) {
  const router = useRouter();

  const [applied, setApplied] = useState<LojaCustomization>(() => loadCustomization(loja.id));
  const [corPrincipal, setCorPrincipal] = useState<string | null>(applied.corPrincipal);
  const [estiloBotao, setEstiloBotao] = useState<ThemeButtonRadius | null>(applied.estiloBotao);
  const [bannerGrande, setBannerGrande] = useState<boolean>(applied.bannerGrande);
  const [colunas, setColunas] = useState<2 | 3 | null>(applied.colunas);

  const [selectedRegion, setSelectedRegion] = useState<EditableRegion | null>(null);
  const [panel, setPanel] = useState<PanelKind>(null);
  const [maisConfigAberto, setMaisConfigAberto] = useState(false);
  const [showHint, setShowHint] = useState(false);

  useEffect(() => {
    // Relê a personalização sempre que a página monta — cobre o caso de
    // voltar de /loja/temas depois de aplicar um tema novo.
    setApplied(loadCustomization(loja.id));
    setShowHint(!hasSeenEditHint(loja.id));
  }, [loja.id]);

  const appliedTheme = getThemeById(applied.temaId);
  const storeUrl = getStoreUrl(loja.slug);

  const previewStoreData = useMemo(
    () => resolvePreviewStore({ nome: loja.nome, descricao: loja.descricao, bannerUrl: loja.banner_url }),
    [loja.nome, loja.descricao, loja.banner_url]
  );

  const previewProductsData = useMemo(() => resolvePreviewProductsDireto(produtos), [produtos]);

  function persist(patch: Partial<LojaCustomization>) {
    setApplied((prev) => {
      const next = { ...prev, ...patch };
      saveCustomization(loja.id, next);
      return next;
    });
  }

  function handleSelectRegion(region: EditableRegion) {
    if (showHint) {
      setShowHint(false);
      markEditHintSeen(loja.id);
    }
    setSelectedRegion(region);
    setPanel(region);
  }

  function closePanel() {
    setPanel(null);
    setSelectedRegion(null);
  }

  function handleCorChange(hex: string | null) {
    setCorPrincipal(hex);
    persist({ corPrincipal: hex });
  }

  function handleEstiloChange(radius: ThemeButtonRadius | null) {
    setEstiloBotao(radius);
    persist({ estiloBotao: radius });
  }

  function handleBannerGrandeChange(value: boolean) {
    setBannerGrande(value);
    persist({ bannerGrande: value });
  }

  function handleColunasChange(value: 2 | 3 | null) {
    setColunas(value);
    persist({ colunas: value });
  }

  return (
    <div className="flex flex-col gap-5 pt-2">
      <div className="flex items-center justify-between">
        <Link href="/" className="flex items-center gap-1 text-[13px] font-bold text-slate-500">
          <ChevronLeft size={18} /> Personalizar loja
        </Link>
        <a href={storeUrl} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-[13px] font-bold text-ink">
          Ver loja <ExternalLink size={14} />
        </a>
      </div>

      <div>
        <h2 className="text-lg font-black tracking-tight text-ink">Personalize sua loja</h2>
        <p className="text-[12px] font-medium text-slate-400">
          {showHint ? 'Toque em uma parte da loja para editar.' : 'Toque em qualquer parte da loja para editar.'}
        </p>
      </div>

      {/* Pré-visualização — a principal forma de editar */}
      <div className="h-[560px] w-full overflow-hidden rounded-[20px] border border-[#E5E3E0] shadow-[0_1px_3px_rgba(15,23,42,0.06)]">
        <StorePreview
          theme={appliedTheme}
          store={previewStoreData}
          products={previewProductsData}
          settings={{ corPrincipal, estiloBotao, bannerGrande, colunas: colunas ?? undefined }}
          editable={{ selected: selectedRegion, onSelect: handleSelectRegion, hint: showHint ? 'banner' : null }}
        />
      </div>

      {/* Tema — configuração global, com página dedicada própria */}
      <Link
        href="/loja/temas"
        className="flex items-center gap-3 rounded-[16px] border border-[#E5E3E0] px-4 py-3.5 text-left"
      >
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#F4F4F3] text-ink">
          <Palette size={17} />
        </span>
        <span className="flex-1">
          <span className="block text-[11px] font-black uppercase tracking-widest text-slate-400">Tema</span>
          <span className="block text-[14px] font-bold text-ink">{appliedTheme.name}</span>
        </span>
        <span className="text-[12px] font-bold text-slate-400">Alterar</span>
        <ChevronRight size={18} className="text-slate-300" />
      </Link>

      {/* Mais configurações — fechado por omissão para a tela inicial ficar limpa */}
      <div className="rounded-[16px] border border-[#E5E3E0]">
        <button
          type="button"
          onClick={() => setMaisConfigAberto((v) => !v)}
          className="flex w-full items-center justify-between px-4 py-3.5 text-left"
        >
          <span className="text-[13px] font-bold text-ink">Mais configurações</span>
          <ChevronDown size={18} className={`text-slate-400 transition-transform ${maisConfigAberto ? 'rotate-180' : ''}`} />
        </button>
        {maisConfigAberto && (
          <div className="flex flex-col border-t border-[#E5E3E0] px-4">
            <SettingsRow title="Cores" subtitle="Cor principal da loja" onClick={() => setPanel('cores')} />
            <SettingsRow title="Estilo" subtitle="Botões e elementos visuais" onClick={() => setPanel('estilo')} />
            <SettingsRow title="Informações da loja" subtitle="Contactos, secções, política de entrega e termos" onClick={() => setPanel('completo')} />
          </div>
        )}
      </div>

      {/* Painéis contextuais de cada bloco tocável */}
      <BannerSheet
        open={panel === 'banner'}
        onClose={closePanel}
        lojaId={loja.id}
        bannerUrl={loja.banner_url}
        bannerGrande={bannerGrande}
        onBannerGrandeChange={handleBannerGrandeChange}
        onSaved={() => router.refresh()}
      />

      <InfoSheet
        open={panel === 'info'}
        onClose={closePanel}
        lojaId={loja.id}
        nome={loja.nome}
        descricao={loja.descricao ?? ''}
        onSaved={() => router.refresh()}
      />

      <ProdutosSheet open={panel === 'produtos'} onClose={closePanel} colunas={colunas} onColunasChange={handleColunasChange} />

      <ColorSheet open={panel === 'cores'} onClose={closePanel} value={corPrincipal} onChange={handleCorChange} themeDefault={appliedTheme.colors.primary} />

      <ButtonStyleSheet open={panel === 'estilo'} onClose={closePanel} value={estiloBotao} onChange={handleEstiloChange} themeDefault={appliedTheme.buttons.radius} />

      <Sheet
        open={panel === 'completo'}
        onClose={closePanel}
        title="Informações da loja"
        subtitle="Nome, descrição, contactos e secções visíveis"
        heightVh={90}
      >
        <StoreSettingsForm loja={loja} />
      </Sheet>
    </div>
  );
}

function SettingsRow({ title, subtitle, onClick }: { title: string; subtitle: string; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="flex items-center gap-3 border-b border-slate-100 py-3.5 text-left last:border-0">
      <span className="flex-1">
        <span className="block text-[13px] font-bold text-ink">{title}</span>
        <span className="block text-[11.5px] font-medium text-slate-400">{subtitle}</span>
      </span>
      <ChevronRight size={18} className="text-slate-300" />
    </button>
  );
}

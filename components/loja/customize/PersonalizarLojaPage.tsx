'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ChevronLeft, ChevronRight, ExternalLink, Palette, Paintbrush, MousePointerClick, Store as StoreIcon, ListChecks } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Sheet } from '@/components/ui/Sheet';
import { useToast } from '@/components/ui/Toast';
import { StorePreview } from '@/components/loja/preview/StorePreview';
import { StoreSettingsForm } from '@/components/loja/StoreSettingsForm';
import { ThemeSheet } from './ThemeSheet';
import { ColorSheet } from './ColorSheet';
import { ButtonStyleSheet } from './ButtonStyleSheet';
import { getThemeById } from '@/types/theme';
import type { ThemeId, ThemeButtonRadius } from '@/types/theme';
import { resolvePreviewProducts, resolvePreviewStore, type PreviewProduct } from '@/lib/mocks/storePreview';
import { loadCustomization, saveCustomization } from '@/lib/customize/storage';
import type { LojaCustomization } from '@/lib/customize/types';
import type { Loja, Produto } from '@/types/database';

type SheetKind = 'tema' | 'cores' | 'estilo' | 'informacoes' | null;

/**
 * Editor + pré-visualização da "Personalizar loja" (§1, §14).
 *
 * Estado importante para entender o fluxo:
 * - `applied` é a personalização confirmada (o que a loja pública usa).
 * - `previewingThemeId` é só o tema mostrado no preview ENQUANTO o
 *   vendedor está a experimentar — nasce igual a `applied.temaId` e só
 *   diverge quando ele toca noutro tema no sheet "Tema" (§7). A barra
 *   "Aplicar tema" só aparece nesse momento.
 * - Cor e estilo de botão, ao contrário do tema, aplicam-se em tempo
 *   real (§8) — não têm passo de "testar antes", porque são ajustes
 *   pequenos sobre o tema já aplicado, não uma troca de aparência
 *   inteira.
 */
export function PersonalizarLojaPage({
  loja,
  produtos,
}: {
  loja: Loja;
  produtos: Produto[];
}) {
  const router = useRouter();
  const { show } = useToast();

  const [applied, setApplied] = useState<LojaCustomization>(() => loadCustomization(loja.id));
  const [previewingThemeId, setPreviewingThemeId] = useState<ThemeId>(applied.temaId);
  const [corPrincipal, setCorPrincipal] = useState<string | null>(applied.corPrincipal);
  const [estiloBotao, setEstiloBotao] = useState<ThemeButtonRadius | null>(applied.estiloBotao);
  const [openSheet, setOpenSheet] = useState<SheetKind>(null);
  const [saving, setSaving] = useState(false);

  const isTestingTheme = previewingThemeId !== applied.temaId;
  const previewTheme = getThemeById(previewingThemeId);
  const storeUrl = `${process.env.NEXT_PUBLIC_WEB_URL ?? 'https://shopyump.vercel.app'}/loja/${loja.slug}`;

  const previewStoreData = useMemo(
    () => resolvePreviewStore({ nome: loja.nome, descricao: loja.descricao, bannerUrl: loja.banner_url }),
    [loja.nome, loja.descricao, loja.banner_url]
  );

  const previewProductsData = useMemo(
    () =>
      resolvePreviewProducts<Produto>(
        produtos.filter((p) => p.ativo && !p.rascunho).slice(0, 4),
        (p): PreviewProduct => ({ id: p.id, nome: p.nome, preco: p.preco, imagem: p.fotos?.[0] ?? '' })
      ),
    [produtos]
  );

  function applyTheme() {
    const next: LojaCustomization = { ...applied, temaId: previewingThemeId };
    setApplied(next);
    saveCustomization(loja.id, next);
    show('Tema aplicado.');
  }

  function handleCorChange(hex: string | null) {
    setCorPrincipal(hex);
    setApplied((prev) => {
      const next = { ...prev, corPrincipal: hex };
      saveCustomization(loja.id, next);
      return next;
    });
  }

  function handleEstiloChange(radius: ThemeButtonRadius | null) {
    setEstiloBotao(radius);
    setApplied((prev) => {
      const next = { ...prev, estiloBotao: radius };
      saveCustomization(loja.id, next);
      return next;
    });
  }

  function handleGuardar() {
    setSaving(true);
    // O tema/cor/estilo já ficam guardados a cada alteração (ver
    // handleCorChange/handleEstiloChange e applyTheme) — este botão
    // existe para dar ao vendedor um momento explícito de "pronto,
    // terminei", coerente com o resto do dashboard, que sempre fecha
    // uma alteração com "Guardar alterações".
    saveCustomization(loja.id, applied);
    setSaving(false);
    show('Personalização guardada.');
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-6 pt-2">
      <div className="flex items-center justify-between">
        <Link href="/" className="flex items-center gap-1 text-[13px] font-bold text-slate-500">
          <ChevronLeft size={18} /> Personalizar loja
        </Link>
        <a
          href={storeUrl}
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-1 text-[13px] font-bold text-ink"
        >
          Ver loja <ExternalLink size={14} />
        </a>
      </div>

      {/* Pré-visualização */}
      <div className="flex flex-col gap-2">
        <div className="h-[420px] w-full overflow-hidden rounded-[20px] border border-[#E5E3E0] shadow-[0_1px_3px_rgba(15,23,42,0.06)]">
          <StorePreview
            theme={previewTheme}
            store={previewStoreData}
            products={previewProductsData}
            settings={{ corPrincipal, estiloBotao }}
          />
        </div>

        {isTestingTheme && (
          <div className="flex items-center justify-between rounded-[13px] bg-[#F4F4F3] px-4 py-3">
            <span className="text-[12px] font-semibold text-slate-500">
              A testar: <span className="font-black text-ink">{previewTheme.name}</span>
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setPreviewingThemeId(applied.temaId)}
                className="text-[12px] font-bold text-slate-400"
              >
                Cancelar
              </button>
              <Button type="button" size="sm" onClick={applyTheme}>
                Aplicar tema
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Aparência */}
      <section className="flex flex-col gap-1">
        <h3 className="mb-1 text-[12px] font-black uppercase tracking-widest text-slate-500">Aparência</h3>
        <SettingsRow
          icon={<Palette size={17} />}
          title="Tema"
          subtitle={`Escolha uma aparência para sua loja · ${getThemeById(applied.temaId).name}`}
          onClick={() => setOpenSheet('tema')}
        />
        <SettingsRow icon={<Paintbrush size={17} />} title="Cores" subtitle="Defina as cores principais" onClick={() => setOpenSheet('cores')} />
        <SettingsRow icon={<MousePointerClick size={17} />} title="Estilo" subtitle="Botões e elementos visuais" onClick={() => setOpenSheet('estilo')} />
      </section>

      {/* Conteúdo */}
      <section className="flex flex-col gap-1">
        <h3 className="mb-1 text-[12px] font-black uppercase tracking-widest text-slate-500">Conteúdo</h3>
        <SettingsRow
          icon={<StoreIcon size={17} />}
          title="Informações da loja"
          subtitle="Nome, descrição e contactos"
          onClick={() => setOpenSheet('informacoes')}
        />
        <SettingsRow
          icon={<ListChecks size={17} />}
          title="Seções da loja"
          subtitle="Escolha o que aparece"
          onClick={() => setOpenSheet('informacoes')}
        />
      </section>

      <Button type="button" className="self-start" loading={saving} onClick={handleGuardar}>
        Guardar alterações
      </Button>

      <ThemeSheet
        open={openSheet === 'tema'}
        onClose={() => setOpenSheet(null)}
        appliedThemeId={applied.temaId}
        previewingThemeId={previewingThemeId}
        onPreview={setPreviewingThemeId}
        store={previewStoreData}
        products={previewProductsData}
        settings={{ corPrincipal, estiloBotao }}
      />

      <ColorSheet
        open={openSheet === 'cores'}
        onClose={() => setOpenSheet(null)}
        value={corPrincipal}
        onChange={handleCorChange}
        themeDefault={previewTheme.colors.primary}
      />

      <ButtonStyleSheet
        open={openSheet === 'estilo'}
        onClose={() => setOpenSheet(null)}
        value={estiloBotao}
        onChange={handleEstiloChange}
        themeDefault={previewTheme.buttons.radius}
      />

      <Sheet
        open={openSheet === 'informacoes'}
        onClose={() => setOpenSheet(null)}
        title="Informações da loja"
        subtitle="Nome, descrição, contactos e seções visíveis"
        heightVh={90}
      >
        <StoreSettingsForm loja={loja} />
      </Sheet>
    </div>
  );
}

function SettingsRow({
  icon,
  title,
  subtitle,
  onClick,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center gap-3 border-b border-slate-100 py-3.5 text-left last:border-0"
    >
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#F4F4F3] text-ink">{icon}</span>
      <span className="flex-1">
        <span className="block text-[13px] font-bold text-ink">{title}</span>
        <span className="block text-[11.5px] font-medium text-slate-400">{subtitle}</span>
      </span>
      <ChevronRight size={18} className="text-slate-300" />
    </button>
  );
}

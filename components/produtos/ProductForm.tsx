'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Input, Textarea } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Switch } from '@/components/ui/Switch';
import { PhotoUploader } from '@/components/produtos/PhotoUploader';
import { CategoryPicker } from '@/components/produtos/CategoryPicker';
import { VariantEditor, type VariantesState } from '@/components/produtos/VariantEditor';
import { PesoPadraoInput } from '@/components/produtos/PesoPadraoInput';
import { StockSection } from '@/components/produtos/StockSection';
import { MoreOptions } from '@/components/produtos/MoreOptions';
import { useToast } from '@/components/ui/Toast';
import { createProduto, updateProduto } from '@/lib/mutations/produtos';
import { uploadImage, BUCKETS } from '@/lib/storage';
import { totalEstoque } from '@/lib/variantes';
import { pesoParaKg, type UnidadePeso } from '@/lib/peso';
import type { Produto, ProdutoMaisOpcoes } from '@/types/database';

/* ── Primitivos de layout ──────────────────────────────────────────────────── */

function SectionDivider() {
  return <div className="h-px bg-[#E5E3E0]" />;
}

function SectionHeader({
  title,
  right,
}: {
  title: string;
  right?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between">
      <h3 className="text-[11px] font-black uppercase tracking-[0.07em] text-[#52525B]">
        {title}
      </h3>
      {right && <div className="text-[11.5px] font-semibold text-[#71717A]">{right}</div>}
    </div>
  );
}

/* ── Bloco de controlo (Estoque / Peso) ────────────────────────────────────── */

function ConfigBlock({
  title,
  description,
  checked,
  onToggle,
  ariaLabel,
  children,
}: {
  title: string;
  description: string;
  checked: boolean;
  onToggle: (v: boolean) => void;
  ariaLabel: string;
  children?: React.ReactNode;
}) {
  return (
    <div
      className={[
        'rounded-[18px] border px-4 py-4 flex flex-col gap-4 transition-colors duration-150',
        checked
          ? 'border-[#D4D2CF] bg-white'
          : 'border-[#E5E3E0] bg-[#FAFAF9]',
      ].join(' ')}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-0.5">
          <span className="text-[14px] font-bold text-[#111110]">{title}</span>
          <span className="text-[12px] font-medium leading-snug text-[#71717A]">{description}</span>
        </div>
        <Switch checked={checked} onChange={onToggle} ariaLabel={ariaLabel} size="sm" />
      </div>
      {children}
    </div>
  );
}

/* ── Rótulo com tag "opcional" ─────────────────────────────────────────────── */

function FieldLabel({ label, optional }: { label: string; optional?: boolean }) {
  return (
    <div className="flex items-center gap-2 pl-0.5">
      <span className="text-[11px] font-black uppercase tracking-[0.06em] text-[#27272A]">
        {label}
      </span>
      {optional && (
        <span className="text-[10px] font-semibold normal-case tracking-normal text-[#71717A]">
          opcional
        </span>
      )}
    </div>
  );
}

/* ── ProductForm ───────────────────────────────────────────────────────────── */

export function ProductForm({ lojaId, produto }: { lojaId: string; produto?: Produto }) {
  const [nome, setNome]               = useState(produto?.nome ?? '');
  const [descricao, setDescricao]     = useState(produto?.descricao ?? '');
  const [categoria, setCategoria]     = useState(produto?.categoria ?? '');
  const [preco, setPreco]             = useState(produto ? String(produto.preco) : '');
  const [precoPromo, setPrecoPromo]   = useState(produto?.preco_promo ? String(produto.preco_promo) : '');
  const [fotos, setFotos]             = useState<string[]>(produto?.fotos ?? []);

  const [variantes, setVariantes] = useState<VariantesState>({
    raiz:                     produto?.variantes?.raiz                     ?? null,
    filha:                    produto?.variantes?.filha                    ?? null,
    neta:                     produto?.variantes?.neta                     ?? null,
    versoes:                  produto?.variantes?.versoes                  ?? [],
    imagensPorCaracteristica: produto?.variantes?.imagensPorCaracteristica ?? undefined,
  });

  const genero = produto?.genero ?? null;

  const [controlarEstoque, setControlarEstoque] = useState(typeof produto?.estoque === 'number');
  const [estoqueSimples, setEstoqueSimples]     = useState(
    typeof produto?.estoque === 'number' ? String(produto.estoque) : ''
  );

  const [controlarPeso, setControlarPeso]         = useState(true);
  const [pesoPadraoUnidade, setPesoPadraoUnidade] = useState<UnidadePeso>('kg');
  const [pesoPadraoValor, setPesoPadraoValor]     = useState(
    typeof produto?.mais_opcoes?.peso === 'number' ? String(produto.mais_opcoes.peso) : ''
  );
  const pesoPadraoKg = useMemo(() => {
    if (pesoPadraoValor.trim() === '' || Number.isNaN(Number(pesoPadraoValor))) return null;
    return pesoParaKg(Number(pesoPadraoValor), pesoPadraoUnidade);
  }, [pesoPadraoValor, pesoPadraoUnidade]);

  const [maisOpcoes, setMaisOpcoes] = useState<Omit<ProdutoMaisOpcoes, 'peso'>>(produto?.mais_opcoes ?? {});
  const [saving, setSaving]         = useState(false);

  const router      = useRouter();
  const { show }    = useToast();
  const hasVariants = !!variantes.raiz || !!variantes.filha || !!variantes.neta;

  const valid = useMemo(
    () => nome.trim().length > 1 && Number(preco) > 0 && fotos.length > 0 && categoria.trim().length > 0,
    [nome, preco, fotos, categoria]
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!valid) return;
    setSaving(true);

    const estoque = !controlarEstoque
      ? null
      : hasVariants
        ? totalEstoque(variantes.versoes)
        : estoqueSimples === ''
          ? null
          : Number(estoqueSimples);

    const maisOpcoesFinal: ProdutoMaisOpcoes = {
      ...maisOpcoes,
      peso: controlarPeso ? pesoPadraoKg : null,
    };

    const fotosFinais: string[] = [];
    for (const foto of fotos) {
      if (!foto.startsWith('blob:')) { fotosFinais.push(foto); continue; }
      try {
        const res  = await fetch(foto);
        const blob = await res.blob();
        const file = new File([blob], `foto.${blob.type.split('/')[1] || 'jpg'}`, { type: blob.type });
        const { url, error } = await uploadImage(BUCKETS.produtos, file, lojaId);
        if (error || !url) { setSaving(false); return show(error ?? 'Não foi possível enviar uma das imagens.', 'error'); }
        fotosFinais.push(url);
      } catch {
        setSaving(false);
        return show('Não foi possível enviar uma das imagens.', 'error');
      }
    }

    const payload = {
      loja_id:    lojaId,
      nome:       nome.trim(),
      preco:      Number(preco),
      preco_promo: precoPromo ? Number(precoPromo) : null,
      categoria,
      descricao:  descricao.trim() || null,
      genero,
      fotos:      fotosFinais,
      variantes:  hasVariants
        ? {
            raiz:  variantes.raiz,
            filha: variantes.filha,
            neta:  variantes.neta,
            versoes: variantes.versoes,
            imagensPorCaracteristica: variantes.imagensPorCaracteristica,
          }
        : null,
      estoque,
      mais_opcoes: Object.values(maisOpcoesFinal).some((v) => v !== undefined && v !== null && v !== '')
        ? maisOpcoesFinal
        : null,
      ativo: produto?.ativo ?? true,
    };

    const res = produto
      ? await updateProduto(produto.id, payload)
      : await createProduto(payload);

    setSaving(false);
    if (!res.ok) return show(res.error ?? 'Não foi possível guardar o produto.', 'error');
    show(produto ? 'Produto atualizado.' : 'Produto criado.');
    router.push('/produtos');
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="flex max-w-2xl flex-col gap-8 pb-28">

      {/* ── 1. Imagens ── */}
      <PhotoUploader photos={fotos} onChange={setFotos} lojaId={lojaId} />

      <SectionDivider />

      {/* ── 2. Nome ── */}
      <div className="flex flex-col gap-1.5">
        <FieldLabel label="Nome do produto" />
        <Input
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          placeholder="Ex: Tênis Nike Air Max"
          required
        />
      </div>

      {/* ── 3. Descrição ── */}
      <div className="flex flex-col gap-1.5">
        <FieldLabel label="Descrição" optional />
        <Textarea
          rows={4}
          value={descricao}
          onChange={(e) => setDescricao(e.target.value)}
          placeholder="Descreve o produto…"
        />
      </div>

      <SectionDivider />

      {/* ── 4. Categoria ── */}
      <CategoryPicker value={categoria} onChange={setCategoria} />

      <SectionDivider />

      {/* ── 5. Preço ── */}
      <div className="flex flex-col gap-4">
        <SectionHeader title="Preço" />

        {/* Preço principal — destaque visual */}
        <div className="flex flex-col gap-1.5">
          <FieldLabel label="Preço base" />
          <div className="relative">
            <Input
              type="number"
              min={0}
              value={preco}
              onChange={(e) => setPreco(e.target.value)}
              placeholder="0"
              required
              className="text-[22px] font-extrabold tracking-tight pr-14"
            />
            <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[13px] font-bold text-[#52525B]">
              MT
            </span>
          </div>
        </div>

        {/* Preço promocional — secundário */}
        <div className="flex flex-col gap-1.5">
          <FieldLabel label="Preço promocional" optional />
          <div className="relative">
            <Input
              type="number"
              min={0}
              value={precoPromo}
              onChange={(e) => setPrecoPromo(e.target.value)}
              placeholder="0"
              className="pr-14"
            />
            <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[13px] font-bold text-[#52525B]">
              MT
            </span>
          </div>
        </div>
      </div>

      <SectionDivider />

      {/* ── 6. Estoque ── */}
      <div className="flex flex-col gap-3">
        <SectionHeader title="Estoque" />
        <ConfigBlock
          title="Controlar estoque"
          description={
            controlarEstoque
              ? 'Define a quantidade disponível.'
              : 'O produto fica sempre disponível, sem limite de quantidade.'
          }
          checked={controlarEstoque}
          onToggle={setControlarEstoque}
          ariaLabel="Controlar estoque"
        >
          {controlarEstoque && !hasVariants && (
            <Input
              type="number"
              min={0}
              value={estoqueSimples}
              onChange={(e) => setEstoqueSimples(e.target.value)}
              placeholder="0"
              label="Quantidade"
            />
          )}
          {controlarEstoque && hasVariants && (
            <p className="text-[12px] font-medium text-[#71717A]">
              Define o estoque de cada combinação em &ldquo;Opções do produto&rdquo;.
            </p>
          )}
        </ConfigBlock>
      </div>

      <SectionDivider />

      {/* ── 7. Peso ── */}
      <div className="flex flex-col gap-3">
        <SectionHeader title="Peso" />
        <ConfigBlock
          title="Controlar peso"
          description={
            controlarPeso
              ? 'O peso entra no cálculo de envio deste produto.'
              : 'O peso não entra no cálculo de envio deste produto.'
          }
          checked={controlarPeso}
          onToggle={setControlarPeso}
          ariaLabel="Controlar peso"
        >
          {controlarPeso && (
            <PesoPadraoInput
              valor={pesoPadraoValor}
              unidade={pesoPadraoUnidade}
              onChangeValor={setPesoPadraoValor}
              onChangeUnidade={setPesoPadraoUnidade}
            />
          )}
        </ConfigBlock>
      </div>

      <SectionDivider />

      {/* ── 8. Opções do produto ── */}
      <div className="flex flex-col gap-3">
        <SectionHeader title="Opções do produto" />
        <VariantEditor state={variantes} onChange={setVariantes} />
      </div>

      {/* ── 9. Versões / Estoque por combinação ── */}
      {hasVariants && (
        <div className="flex flex-col gap-3">
          <SectionHeader
            title="Versões disponíveis"
            right={
              controlarEstoque
                ? `${totalEstoque(variantes.versoes)} unidades`
                : undefined
            }
          />
          <StockSection
            raiz={variantes.raiz}
            filha={variantes.filha}
            neta={variantes.neta}
            versoes={variantes.versoes}
            onVersoesChange={(versoes) => setVariantes((v) => ({ ...v, versoes }))}
            controlarEstoque={controlarEstoque}
            controlarPeso={controlarPeso}
            precoBase={Number(preco) || 0}
            pesoPadrao={pesoPadraoKg}
            fotos={fotos}
            onAddFoto={(url) => setFotos((f) => (f.includes(url) ? f : [...f, url]))}
            lojaId={lojaId}
            imagensPorCaracteristica={variantes.imagensPorCaracteristica}
            onChangeImagensCaracteristica={(nomeCaracteristica, valor, urls) =>
              setVariantes((v) => ({
                ...v,
                imagensPorCaracteristica: {
                  ...(v.imagensPorCaracteristica ?? {}),
                  [nomeCaracteristica]: {
                    ...(v.imagensPorCaracteristica?.[nomeCaracteristica] ?? {}),
                    [valor]: urls,
                  },
                },
              }))
            }
          />
        </div>
      )}

      <SectionDivider />

      {/* ── 10. Mais opções ── */}
      <MoreOptions value={maisOpcoes} onChange={setMaisOpcoes} />

      {/* ── 11. Ação ── */}
      <div className="flex gap-3 pb-6 pt-2">
        <Button type="submit" loading={saving} disabled={!valid} className="flex-1 sm:flex-none">
          {produto ? 'Guardar alterações' : 'Publicar produto'}
        </Button>
        <Button type="button" variant="secondary" onClick={() => router.push('/produtos')}>
          Cancelar
        </Button>
      </div>
    </form>
  );
}

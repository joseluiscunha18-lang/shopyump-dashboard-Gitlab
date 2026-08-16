'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Input, Textarea } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { PhotoUploader } from '@/components/produtos/PhotoUploader';
import { CategoryPicker } from '@/components/produtos/CategoryPicker';
import { VariantEditor, type VariantesState } from '@/components/produtos/VariantEditor';
import { StockSection } from '@/components/produtos/StockSection';
import { MoreOptions } from '@/components/produtos/MoreOptions';
import { useToast } from '@/components/ui/Toast';
import { createProduto, updateProduto } from '@/lib/mutations/produtos';
import { totalEstoque } from '@/lib/variantes';
import type { Produto, ProdutoMaisOpcoes, Genero } from '@/types/database';
import { GENEROS } from '@/types/database';

export function ProductForm({ lojaId, produto }: { lojaId: string; produto?: Produto }) {
  const [nome, setNome] = useState(produto?.nome ?? '');
  const [descricao, setDescricao] = useState(produto?.descricao ?? '');
  const [categoria, setCategoria] = useState(produto?.categoria ?? '');
  const [preco, setPreco] = useState(produto ? String(produto.preco) : '');
  const [precoPromo, setPrecoPromo] = useState(produto?.preco_promo ? String(produto.preco_promo) : '');
  const [fotos, setFotos] = useState<string[]>(produto?.fotos ?? []);

  const [variantes, setVariantes] = useState<VariantesState>({
    raiz: produto?.variantes?.raiz ?? null,
    filha: produto?.variantes?.filha ?? null,
    versoes: produto?.variantes?.versoes ?? [],
  });

  const [genero, setGenero] = useState<Genero | null>(produto?.genero ?? null);

  const [controlarEstoque, setControlarEstoque] = useState(typeof produto?.estoque === 'number');
  const [estoqueSimples, setEstoqueSimples] = useState(
    typeof produto?.estoque === 'number' ? String(produto.estoque) : ''
  );

  const [maisOpcoes, setMaisOpcoes] = useState<ProdutoMaisOpcoes>(produto?.mais_opcoes ?? {});

  const [saving, setSaving] = useState(false);
  const router = useRouter();
  const { show } = useToast();

  const hasVariants = !!variantes.raiz || !!variantes.filha;

  const valid = useMemo(
    () => nome.trim().length > 1 && Number(preco) > 0 && fotos.length > 0 && categoria.trim().length > 0,
    [nome, preco, fotos, categoria]
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!valid) return;
    setSaving(true);

    const estoque = hasVariants
      ? totalEstoque(variantes.versoes)
      : controlarEstoque
        ? estoqueSimples === ''
          ? null
          : Number(estoqueSimples)
        : null;

    const payload = {
      loja_id: lojaId,
      nome: nome.trim(),
      preco: Number(preco),
      preco_promo: precoPromo ? Number(precoPromo) : null,
      categoria,
      descricao: descricao.trim() || null,
      genero,
      fotos,
      variantes: hasVariants
        ? { raiz: variantes.raiz, filha: variantes.filha, versoes: variantes.versoes }
        : null,
      estoque,
      mais_opcoes: Object.values(maisOpcoes).some((v) => v !== undefined && v !== null && v !== '') ? maisOpcoes : null,
      ativo: produto?.ativo ?? true,
    };

    const res = produto ? await updateProduto(produto.id, payload) : await createProduto(payload);

    setSaving(false);
    if (!res.ok) return show(res.error ?? 'Não foi possível guardar o produto.', 'error');
    show(produto ? 'Produto atualizado.' : 'Produto criado.');
    router.push('/produtos');
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="flex max-w-2xl flex-col gap-7 pb-24">
      {/* 1. Imagens */}
      <PhotoUploader photos={fotos} onChange={setFotos} lojaId={lojaId} />

      {/* 2. Nome do produto */}
      <Input
        label="Nome do produto"
        value={nome}
        onChange={(e) => setNome(e.target.value)}
        placeholder="Ex: Tênis Nike Air Max"
        required
      />

      {/* 3. Descrição */}
      <Textarea
        label="Descrição"
        rows={4}
        value={descricao}
        onChange={(e) => setDescricao(e.target.value)}
        placeholder="Descreve o produto…"
      />

      {/* 4. Categoria */}
      <CategoryPicker value={categoria} onChange={setCategoria} />

      {/* Para quem é este produto? — informação geral, não cria versões */}
      <div>
        <label className="mb-1.5 block pl-1 text-[11px] font-black uppercase tracking-widest text-slate-400">
          Para quem é este produto? <span className="font-medium normal-case text-slate-300">— opcional</span>
        </label>
        <div className="flex gap-1.5">
          {GENEROS.map((g) => (
            <button
              key={g}
              type="button"
              onClick={() => setGenero((atual) => (atual === g ? null : g))}
              className={[
                'rounded-full px-3.5 py-2 text-[12px] font-bold transition-colors',
                genero === g ? 'bg-ink text-white' : 'bg-slate-100 text-slate-500',
              ].join(' ')}
            >
              {g}
            </button>
          ))}
        </div>
      </div>

      {/* 5. Preço */}
      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Preço (MT)"
          type="number"
          min={0}
          value={preco}
          onChange={(e) => setPreco(e.target.value)}
          placeholder="0"
          required
        />
        <Input
          label="Preço promocional"
          hint="Opcional"
          type="number"
          min={0}
          value={precoPromo}
          onChange={(e) => setPrecoPromo(e.target.value)}
          placeholder="0"
        />
      </div>

      {/* 6. Opções do produto */}
      <VariantEditor state={variantes} onChange={setVariantes} />

      {/* 7. Versões disponíveis / Estoque */}
      <StockSection
        raiz={variantes.raiz}
        filha={variantes.filha}
        versoes={variantes.versoes}
        onVersoesChange={(versoes) => setVariantes((v) => ({ ...v, versoes }))}
        estoqueSimples={estoqueSimples}
        onEstoqueSimplesChange={setEstoqueSimples}
        controlarEstoque={controlarEstoque}
        onControlarEstoqueChange={setControlarEstoque}
        precoBase={Number(preco) || 0}
        pesoPadrao={maisOpcoes.peso ?? null}
        fotos={fotos}
        onAddFoto={(url) => setFotos((f) => (f.includes(url) ? f : [...f, url]))}
        lojaId={lojaId}
      />

      {/* 8. Mais opções */}
      <MoreOptions value={maisOpcoes} onChange={setMaisOpcoes} hasVariants={hasVariants} />

      {/* 9. Publicar / Guardar — fixo e acessível no mobile */}
      <div className="sticky bottom-0 -mx-4 flex gap-3 border-t border-slate-100 bg-white/90 px-4 pb-[calc(env(safe-area-inset-bottom,0px)+12px)] pt-3 backdrop-blur-xl sm:static sm:mx-0 sm:border-0 sm:bg-transparent sm:p-0 sm:backdrop-blur-none">
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

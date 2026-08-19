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
import { totalEstoque } from '@/lib/variantes';
import { pesoParaKg, type UnidadePeso } from '@/lib/peso';
import type { Produto, ProdutoMaisOpcoes } from '@/types/database';

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
    neta: produto?.variantes?.neta ?? null,
    versoes: produto?.variantes?.versoes ?? [],
    imagensPorCaracteristica: produto?.variantes?.imagensPorCaracteristica ?? undefined,
  });

  // "Para quem é este produto?" foi removido do formulário — o campo
  // continua a existir no registo (e em `Genero` como opção de variante,
  // que é uma coisa diferente), mas deixou de ser editável aqui. Preserva
  // o valor já gravado em vez de o apagar silenciosamente ao guardar.
  const genero = produto?.genero ?? null;

  const [controlarEstoque, setControlarEstoque] = useState(typeof produto?.estoque === 'number');
  const [estoqueSimples, setEstoqueSimples] = useState(
    typeof produto?.estoque === 'number' ? String(produto.estoque) : ''
  );

  // Peso padrão — vive antes de "Opções do produto" porque é usado
  // automaticamente por todas as variantes. Guardado sempre em kg
  // (`mais_opcoes.peso`), mas o vendedor pode digitar em g, kg, lb ou oz.
  // "Controlar peso" segue a mesma lógica do interruptor de estoque: quando
  // desligado, o campo fica escondido e o valor gravado passa a null, mas
  // nada já digitado é apagado da tela enquanto o formulário está aberto.
  const [controlarPeso, setControlarPeso] = useState(true);
  const [pesoPadraoUnidade, setPesoPadraoUnidade] = useState<UnidadePeso>('kg');
  const [pesoPadraoValor, setPesoPadraoValor] = useState(
    typeof produto?.mais_opcoes?.peso === 'number' ? String(produto.mais_opcoes.peso) : ''
  );
  const pesoPadraoKg = useMemo(() => {
    if (pesoPadraoValor.trim() === '' || Number.isNaN(Number(pesoPadraoValor))) return null;
    return pesoParaKg(Number(pesoPadraoValor), pesoPadraoUnidade);
  }, [pesoPadraoValor, pesoPadraoUnidade]);

  const [maisOpcoes, setMaisOpcoes] = useState<Omit<ProdutoMaisOpcoes, 'peso'>>(produto?.mais_opcoes ?? {});

  const [saving, setSaving] = useState(false);
  const router = useRouter();
  const { show } = useToast();

  const hasVariants = !!variantes.raiz || !!variantes.filha || !!variantes.neta;

  const valid = useMemo(
    () => nome.trim().length > 1 && Number(preco) > 0 && fotos.length > 0 && categoria.trim().length > 0,
    [nome, preco, fotos, categoria]
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!valid) return;
    setSaving(true);

    // "Controlar estoque" é um interruptor único, definido antes de "Opções
    // do produto": quando desligado, o produto fica sempre disponível
    // (estoque null), quer tenha variantes ou não. Os valores já digitados
    // por combinação continuam guardados em `variantes.versoes` mesmo
    // desligado — só deixam de contar para o total.
    const estoque = !controlarEstoque
      ? null
      : hasVariants
        ? totalEstoque(variantes.versoes)
        : estoqueSimples === ''
          ? null
          : Number(estoqueSimples);

    const maisOpcoesFinal: ProdutoMaisOpcoes = { ...maisOpcoes, peso: controlarPeso ? pesoPadraoKg : null };

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
        ? {
            raiz: variantes.raiz,
            filha: variantes.filha,
            neta: variantes.neta,
            versoes: variantes.versoes,
            imagensPorCaracteristica: variantes.imagensPorCaracteristica,
          }
        : null,
      estoque,
      mais_opcoes: Object.values(maisOpcoesFinal).some((v) => v !== undefined && v !== null && v !== '') ? maisOpcoesFinal : null,
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

      {/* 6. Estoque — interruptor único, antes de "Opções do produto" para
      quem publica um produto simples nem precisar de pensar em estoque. */}
      <div>
        <div className="mb-2 flex items-center justify-between pl-1">
          <h3 className="text-[13px] font-black text-ink">Estoque</h3>
          <label className="flex items-center gap-2">
            <span className="text-[11px] font-semibold text-slate-400">Controlar estoque</span>
            <Switch checked={controlarEstoque} onChange={setControlarEstoque} ariaLabel="Controlar estoque" size="sm" />
          </label>
        </div>

        {controlarEstoque && !hasVariants && (
          <Input
            type="number"
            min={0}
            value={estoqueSimples}
            onChange={(e) => setEstoqueSimples(e.target.value)}
            placeholder="0"
          />
        )}

        {controlarEstoque && hasVariants && (
          <p className="pl-1 text-[11px] font-medium text-slate-400">
            Define o estoque de cada combinação mais abaixo, em "Opções do produto".
          </p>
        )}

        {!controlarEstoque && (
          <p className="pl-1 text-[11px] font-medium text-slate-400">
            O produto fica sempre disponível, sem limite de quantidade.
          </p>
        )}
      </div>

      {/* 7. Peso — mesmo padrão do interruptor de Estoque acima: quando
      desligado, o produto fica sem peso definido (não entra no cálculo de
      envio), mas o valor já digitado continua guardado na tela. */}
      <div>
        <div className="mb-2 flex items-center justify-between pl-1">
          <h3 className="text-[13px] font-black text-ink">Peso</h3>
          <label className="flex items-center gap-2">
            <span className="text-[11px] font-semibold text-slate-400">Controlar peso</span>
            <Switch checked={controlarPeso} onChange={setControlarPeso} ariaLabel="Controlar peso" size="sm" />
          </label>
        </div>

        {controlarPeso ? (
          <PesoPadraoInput
            valor={pesoPadraoValor}
            unidade={pesoPadraoUnidade}
            onChangeValor={setPesoPadraoValor}
            onChangeUnidade={setPesoPadraoUnidade}
          />
        ) : (
          <p className="pl-1 text-[11px] font-medium text-slate-400">
            O peso não entra no cálculo de envio deste produto.
          </p>
        )}
      </div>

      {/* 8. Opções do produto */}
      <VariantEditor state={variantes} onChange={setVariantes} />

      {/* 9. Versões disponíveis / Estoque por combinação — só faz sentido com opções definidas */}
      {hasVariants && (
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
                [nomeCaracteristica]: { ...(v.imagensPorCaracteristica?.[nomeCaracteristica] ?? {}), [valor]: urls },
              },
            }))
          }
        />
      )}

      {/* 10. Mais opções */}
      <MoreOptions value={maisOpcoes} onChange={setMaisOpcoes} />

      {/* 11. Publicar / Guardar — fixo e acessível no mobile */}
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

'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Input, Textarea } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { PhotoUploader } from '@/components/produtos/PhotoUploader';
import { VariantEditor } from '@/components/produtos/VariantEditor';
import { useToast } from '@/components/ui/Toast';
import { createProduto, updateProduto } from '@/lib/mutations/produtos';
import type { Produto } from '@/types/database';

const CATEGORIAS = ['Moda', 'Beleza', 'Casa', 'Eletrónica', 'Acessórios', 'Alimentação', 'Outros'];

export function ProductForm({ lojaId, produto }: { lojaId: string; produto?: Produto }) {
  const [nome, setNome] = useState(produto?.nome ?? '');
  const [preco, setPreco] = useState(produto ? String(produto.preco) : '');
  const [precoPromo, setPrecoPromo] = useState(produto?.preco_promo ? String(produto.preco_promo) : '');
  const [categoria, setCategoria] = useState(produto?.categoria ?? CATEGORIAS[0]);
  const [descricao, setDescricao] = useState(produto?.descricao ?? '');
  const [fotos, setFotos] = useState<string[]>(produto?.fotos ?? []);
  const [tamanhos, setTamanhos] = useState<string[]>(produto?.variantes?.tamanhos ?? []);
  const [cores, setCores] = useState<string[]>(produto?.variantes?.cores ?? []);
  const [saving, setSaving] = useState(false);
  const router = useRouter();
  const { show } = useToast();

  const valid = useMemo(() => nome.trim().length > 1 && Number(preco) > 0 && fotos.length > 0, [nome, preco, fotos]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!valid) return;
    setSaving(true);

    const payload = {
      loja_id: lojaId,
      nome: nome.trim(),
      preco: Number(preco),
      preco_promo: precoPromo ? Number(precoPromo) : null,
      categoria,
      descricao: descricao.trim() || null,
      fotos,
      variantes: { tamanhos, cores },
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
    <form onSubmit={handleSubmit} className="flex flex-col gap-6 max-w-2xl">
      <PhotoUploader photos={fotos} onChange={setFotos} lojaId={lojaId} />

      <Input label="Nome do produto" value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Ex: Vestido floral" required />

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
          label="Preço promocional (opcional)"
          type="number"
          min={0}
          value={precoPromo}
          onChange={(e) => setPrecoPromo(e.target.value)}
          placeholder="0"
        />
      </div>

      <div>
        <label className="text-[11px] font-black uppercase tracking-widest text-slate-500 mb-1.5 block pl-1">Categoria</label>
        <select
          value={categoria}
          onChange={(e) => setCategoria(e.target.value)}
          className="w-full bg-slate-50 border border-transparent rounded-2xl px-4 py-3.5 text-[13px] font-semibold text-ink outline-none focus:bg-white focus:border-ink focus:ring-4 focus:ring-ink/5 transition-all"
        >
          {CATEGORIAS.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      <VariantEditor tamanhos={tamanhos} cores={cores} onTamanhosChange={setTamanhos} onCoresChange={setCores} />

      <Textarea label="Descrição" rows={5} value={descricao} onChange={(e) => setDescricao(e.target.value)} placeholder="Descreve o produto…" />

      <div className="flex gap-3 pt-2">
        <Button type="submit" loading={saving} disabled={!valid}>
          {produto ? 'Guardar alterações' : 'Publicar produto'}
        </Button>
        <Button type="button" variant="secondary" onClick={() => router.push('/produtos')}>
          Cancelar
        </Button>
      </div>
    </form>
  );
}

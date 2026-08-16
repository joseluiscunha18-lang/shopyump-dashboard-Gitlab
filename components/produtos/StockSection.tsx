'use client';

import { useState } from 'react';
import Image from 'next/image';
import { ChevronDown, ImagePlus } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { Switch } from '@/components/ui/Switch';
import { VariantImagePicker } from '@/components/produtos/VariantImagePicker';
import { aplicarPesoATodas, totalEstoque } from '@/lib/variantes';
import type { ProdutoCombinacao } from '@/types/database';
import { cn } from '@/lib/cn';

export function StockSection({
  hasVariants,
  combinacoes,
  onCombinacoesChange,
  estoqueSimples,
  onEstoqueSimplesChange,
  controlarEstoque,
  onControlarEstoqueChange,
  precoBase,
  pesoPadrao,
  fotos,
  onAddFoto,
  lojaId,
}: {
  hasVariants: boolean;
  combinacoes: ProdutoCombinacao[];
  onCombinacoesChange: (v: ProdutoCombinacao[]) => void;
  estoqueSimples: string;
  onEstoqueSimplesChange: (v: string) => void;
  controlarEstoque: boolean;
  onControlarEstoqueChange: (v: boolean) => void;
  precoBase: number;
  /** Peso padrão do produto (kg) — só é relevante quando o produto não tem variantes. */
  pesoPadrao?: number | null;
  /** Galeria geral do produto — cada variante escolhe imagens daqui, nunca envia de novo. */
  fotos: string[];
  onAddFoto: (url: string) => void;
  lojaId: string;
}) {
  if (hasVariants) {
    return (
      <div>
        <div className="mb-2 flex items-center justify-between pl-1">
          <h3 className="text-[13px] font-black text-ink">Variantes</h3>
          <span className="text-[11px] font-bold text-slate-400">
            {totalEstoque(combinacoes)} unidades no total
          </span>
        </div>
        <div className="flex flex-col gap-2">
          {combinacoes.map((c, i) => (
            <CombinacaoRow
              key={c.chave}
              combinacao={c}
              precoBase={precoBase}
              fotos={fotos}
              onAddFoto={onAddFoto}
              lojaId={lojaId}
              onChange={(next) => {
                const copy = [...combinacoes];
                copy[i] = next;
                onCombinacoesChange(copy);
              }}
              onAplicarPesoATodas={(peso) => onCombinacoesChange(aplicarPesoATodas(combinacoes, peso))}
              mostrarAplicarATodas={combinacoes.length > 1}
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-2 flex items-center justify-between pl-1">
        <h3 className="text-[13px] font-black text-ink">Estoque</h3>
        <label className="flex items-center gap-2">
          <span className="text-[11px] font-semibold text-slate-400">Controlar estoque</span>
          <Switch checked={controlarEstoque} onChange={onControlarEstoqueChange} ariaLabel="Controlar estoque" size="sm" />
        </label>
      </div>
      {controlarEstoque && (
        <Input
          type="number"
          min={0}
          value={estoqueSimples}
          onChange={(e) => onEstoqueSimplesChange(e.target.value)}
          placeholder="0"
        />
      )}
      {!controlarEstoque && (
        <p className="pl-1 text-[11px] font-medium text-slate-400">
          O produto fica sempre disponível, sem limite de quantidade.
        </p>
      )}
      {typeof pesoPadrao === 'number' && (
        <p className="mt-2 pl-1 text-[11px] font-medium text-slate-400">Peso: {pesoPadrao} kg</p>
      )}
    </div>
  );
}

function CombinacaoRow({
  combinacao,
  precoBase,
  fotos,
  onAddFoto,
  lojaId,
  onChange,
  onAplicarPesoATodas,
  mostrarAplicarATodas,
}: {
  combinacao: ProdutoCombinacao;
  precoBase: number;
  fotos: string[];
  onAddFoto: (url: string) => void;
  lojaId: string;
  onChange: (c: ProdutoCombinacao) => void;
  onAplicarPesoATodas: (peso: number | null) => void;
  mostrarAplicarATodas: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const [imagePickerOpen, setImagePickerOpen] = useState(false);

  const ativa = combinacao.ativa !== false;
  const imagens = combinacao.imagens ?? [];

  return (
    <div className={cn('rounded-2xl bg-slate-50/70 px-3.5 py-2.5 transition-opacity', !ativa && 'opacity-50')}>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="flex flex-1 items-center gap-1.5 text-left"
        >
          <ChevronDown size={13} className={cn('shrink-0 text-slate-400 transition-transform', expanded && 'rotate-180')} />
          <span className="truncate text-[12px] font-bold text-ink">{combinacao.chave}</span>
          {!ativa && (
            <span className="shrink-0 rounded-full bg-slate-200 px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-slate-500">
              Indisponível
            </span>
          )}
        </button>
        <input
          type="number"
          min={0}
          disabled={!ativa}
          value={combinacao.estoque ?? ''}
          onChange={(e) =>
            onChange({ ...combinacao, estoque: e.target.value === '' ? null : Number(e.target.value) })
          }
          placeholder="0"
          className="h-9 w-20 shrink-0 rounded-xl border border-transparent bg-white px-3 text-right text-[13px] font-bold text-ink shadow-sm outline-none focus:border-ink focus:ring-2 focus:ring-ink/10 disabled:cursor-not-allowed"
        />
      </div>

      {expanded && (
        <div className="mt-2.5 flex flex-col gap-3 border-t border-slate-200/70 pt-2.5">
          <div>
            <label className="mb-1 block text-[10px] font-black uppercase tracking-widest text-slate-400">
              Preço desta variante
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={0}
                value={combinacao.preco ?? ''}
                onChange={(e) =>
                  onChange({ ...combinacao, preco: e.target.value === '' ? null : Number(e.target.value) })
                }
                placeholder={String(precoBase || 0)}
                className="h-9 w-full rounded-xl border border-transparent bg-white px-3 text-[13px] font-bold text-ink shadow-sm outline-none focus:border-ink focus:ring-2 focus:ring-ink/10"
              />
              <span className="shrink-0 text-[11px] font-bold text-slate-400">MT</span>
            </div>
            <p className="mt-1.5 text-[10px] font-medium text-slate-400">
              Deixa em branco para usar o preço principal ({precoBase || 0} MT).
            </p>
          </div>

          <div>
            <label className="mb-1 block text-[10px] font-black uppercase tracking-widest text-slate-400">
              Peso desta variante
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={0}
                step="0.01"
                value={combinacao.peso ?? ''}
                onChange={(e) =>
                  onChange({ ...combinacao, peso: e.target.value === '' ? null : Number(e.target.value) })
                }
                placeholder="0"
                className="h-9 w-full rounded-xl border border-transparent bg-white px-3 text-[13px] font-bold text-ink shadow-sm outline-none focus:border-ink focus:ring-2 focus:ring-ink/10"
              />
              <span className="shrink-0 text-[11px] font-bold text-slate-400">kg</span>
            </div>
            {mostrarAplicarATodas && typeof combinacao.peso === 'number' && (
              <button
                type="button"
                onClick={() => onAplicarPesoATodas(combinacao.peso ?? null)}
                className="mt-1.5 text-[10px] font-bold text-ink underline decoration-slate-300 underline-offset-2 hover:decoration-ink"
              >
                Usar este peso em todas as variantes
              </button>
            )}
          </div>

          <div>
            <label className="mb-1 block text-[10px] font-black uppercase tracking-widest text-slate-400">
              Imagens desta variante — opcional
            </label>
            <button
              type="button"
              onClick={() => setImagePickerOpen(true)}
              className="flex w-full items-center justify-between rounded-xl bg-white px-3 py-2.5 shadow-sm active:scale-[0.99]"
            >
              <span className="flex items-center gap-1.5">
                {imagens.slice(0, 4).map((url, i) => (
                  <div key={url + i} className="relative h-6 w-6 overflow-hidden rounded-full ring-2 ring-white">
                    <Image src={url} alt="" fill className="object-cover" sizes="24px" />
                  </div>
                ))}
              </span>
              <span className="flex items-center gap-1 text-[11px] font-semibold text-slate-400">
                {imagens.length === 0 ? (
                  <>
                    <ImagePlus size={13} /> Escolher da galeria
                  </>
                ) : (
                  `${imagens.length} imagem${imagens.length > 1 ? 's' : ''}`
                )}
              </span>
            </button>
            <p className="mt-1.5 text-[10px] font-medium text-slate-400">
              Sem imagens escolhidas, a loja usa a galeria geral do produto.
            </p>
          </div>

          <button
            type="button"
            onClick={() => onChange({ ...combinacao, ativa: !ativa })}
            className="self-start text-[11px] font-bold text-slate-400 hover:text-red-500"
          >
            {ativa ? 'Esta variante não existe — remover' : 'Reativar variante'}
          </button>
        </div>
      )}

      {imagePickerOpen && (
        <VariantImagePicker
          open
          onClose={() => setImagePickerOpen(false)}
          label={combinacao.chave}
          lojaId={lojaId}
          fotosGerais={fotos}
          selecionadas={imagens}
          onAddToGaleria={onAddFoto}
          onSave={(urls) => onChange({ ...combinacao, imagens: urls })}
        />
      )}
    </div>
  );
}

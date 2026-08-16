'use client';

import { useState } from 'react';
import Image from 'next/image';
import { ChevronDown, ImagePlus, Images } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { Switch } from '@/components/ui/Switch';
import { VariantImagePicker } from '@/components/produtos/VariantImagePicker';
import { ColorDot } from '@/components/produtos/SuggestInput';
import { agruparPorRaiz, aplicarPesoATodas, totalEstoque } from '@/lib/variantes';
import { resolverHexCor } from '@/lib/cores';
import type { ProdutoOpcaoFilha, ProdutoOpcaoRaiz, ProdutoVersao } from '@/types/database';
import { cn } from '@/lib/cn';

export function StockSection({
  raiz,
  filha,
  versoes,
  onVersoesChange,
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
  raiz: ProdutoOpcaoRaiz | null;
  filha: ProdutoOpcaoFilha | null;
  versoes: ProdutoVersao[];
  onVersoesChange: (v: ProdutoVersao[]) => void;
  estoqueSimples: string;
  onEstoqueSimplesChange: (v: string) => void;
  controlarEstoque: boolean;
  onControlarEstoqueChange: (v: boolean) => void;
  precoBase: number;
  /** Peso padrão do produto (kg) — só é relevante quando o produto não tem versões. */
  pesoPadrao?: number | null;
  /** Galeria geral do produto — cada versão escolhe imagens daqui, nunca envia de novo. */
  fotos: string[];
  onAddFoto: (url: string) => void;
  lojaId: string;
}) {
  const hasVariants = !!raiz || !!filha;

  if (hasVariants) {
    const arvore = raiz && filha ? agruparPorRaiz(raiz, versoes) : null;

    return (
      <div>
        <div className="mb-2 flex items-center justify-between pl-1">
          <h3 className="text-[13px] font-black text-ink">Versões disponíveis</h3>
          <span className="text-[11px] font-bold text-slate-400">{totalEstoque(versoes)} unidades no total</span>
        </div>

        {arvore ? (
          <div className="flex flex-col gap-2">
            {arvore.map((grupo) => (
              <RaizGroup
                key={grupo.raizValor}
                raizValor={grupo.raizValor}
                raizNome={raiz!.nome}
                raizCores={raiz!.cores}
                filhaNome={filha!.nome}
                versoes={grupo.versoes}
                precoBase={precoBase}
                pesoPadrao={pesoPadrao}
                fotos={fotos}
                onAddFoto={onAddFoto}
                lojaId={lojaId}
                onChangeVersao={(chave, next) => onVersoesChange(versoes.map((v) => (v.chave === chave ? next : v)))}
                onAplicarPesoATodas={(peso) => onVersoesChange(aplicarPesoATodas(versoes, peso))}
                mostrarAplicarATodas={versoes.length > 1}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {versoes.length === 0 && (
              <p className="rounded-xl bg-slate-50 px-3.5 py-3 text-center text-[11px] font-semibold text-slate-400">
                Adiciona valores em "Opções do produto" acima para gerar as versões.
              </p>
            )}
            {versoes.map((v, i) => (
              <VersaoRow
                key={v.chave}
                label={v.chave}
                corHex={(raiz?.nome === 'Cor' || filha?.nome === 'Cor') ? resolverHexCor(v.chave, raiz?.cores ?? filha?.cores) : undefined}
                versao={v}
                precoBase={precoBase}
                pesoPadrao={pesoPadrao}
                fotos={fotos}
                onAddFoto={onAddFoto}
                lojaId={lojaId}
                onChange={(next) => {
                  const copy = [...versoes];
                  copy[i] = next;
                  onVersoesChange(copy);
                }}
                onAplicarPesoATodas={(peso) => onVersoesChange(aplicarPesoATodas(versoes, peso))}
                mostrarAplicarATodas={versoes.length > 1}
              />
            ))}
          </div>
        )}
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

function RaizGroup({
  raizValor,
  raizNome,
  raizCores,
  filhaNome,
  versoes,
  precoBase,
  pesoPadrao,
  fotos,
  onAddFoto,
  lojaId,
  onChangeVersao,
  onAplicarPesoATodas,
  mostrarAplicarATodas,
}: {
  raizValor: string;
  raizNome: string;
  raizCores?: Record<string, string>;
  filhaNome: string;
  versoes: ProdutoVersao[];
  precoBase: number;
  pesoPadrao?: number | null;
  fotos: string[];
  onAddFoto: (url: string) => void;
  lojaId: string;
  onChangeVersao: (chave: string, next: ProdutoVersao) => void;
  onAplicarPesoATodas: (peso: number | null) => void;
  mostrarAplicarATodas: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const ativos = versoes.filter((v) => v.ativa !== false).length;
  const ehCor = raizNome === 'Cor';

  return (
    <div className="rounded-2xl bg-slate-50/70 px-3.5 py-2.5">
      <button type="button" onClick={() => setExpanded((v) => !v)} className="flex w-full items-center justify-between gap-3">
        <span className="flex items-center gap-1.5">
          <ChevronDown size={13} className={cn('shrink-0 text-slate-400 transition-transform', expanded && 'rotate-180')} />
          {ehCor && <ColorDot hex={resolverHexCor(raizValor, raizCores)} />}
          <span className="text-[12px] font-bold text-ink">{raizValor}</span>
        </span>
        <span className="shrink-0 text-[11px] font-semibold text-slate-400">
          {versoes.length === 0
            ? `sem ${filhaNome.toLowerCase()}s ainda`
            : `${ativos} ${filhaNome.toLowerCase()}${ativos === 1 ? '' : 's'}`}
        </span>
      </button>

      {expanded && (
        <div className="mt-2.5 flex flex-col gap-2 border-t border-slate-200/70 pt-2.5">
          {versoes.length === 0 && (
            <p className="text-[11px] font-medium text-slate-400">
              Ainda sem {filhaNome.toLowerCase()}s para "{raizValor}" — adiciona em "Opções do produto" acima.
            </p>
          )}
          {versoes.map((v) => (
            <VersaoRow
              key={v.chave}
              label={v.valores[filhaNome] ?? v.chave}
              versao={v}
              precoBase={precoBase}
              pesoPadrao={pesoPadrao}
              fotos={fotos}
              onAddFoto={onAddFoto}
              lojaId={lojaId}
              onChange={(next) => onChangeVersao(v.chave, next)}
              onAplicarPesoATodas={onAplicarPesoATodas}
              mostrarAplicarATodas={mostrarAplicarATodas}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function VersaoRow({
  label,
  corHex,
  versao,
  precoBase,
  pesoPadrao,
  fotos,
  onAddFoto,
  lojaId,
  onChange,
  onAplicarPesoATodas,
  mostrarAplicarATodas,
}: {
  label: string;
  /** Bolinha de cor mostrada antes do nome — só quando a opção é "Cor". */
  corHex?: string;
  versao: ProdutoVersao;
  precoBase: number;
  pesoPadrao?: number | null;
  fotos: string[];
  onAddFoto: (url: string) => void;
  lojaId: string;
  onChange: (v: ProdutoVersao) => void;
  onAplicarPesoATodas: (peso: number | null) => void;
  mostrarAplicarATodas: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const [imagePickerOpen, setImagePickerOpen] = useState(false);

  const ativa = versao.ativa !== false;
  const imagens = versao.imagens ?? [];

  return (
    <div className={cn('rounded-xl bg-white px-3 py-2 shadow-sm transition-opacity', !ativa && 'opacity-50')}>
      <div className="flex items-center gap-2">
        <button type="button" onClick={() => setExpanded((v) => !v)} className="flex flex-1 items-center gap-1.5 text-left">
          <ChevronDown size={12} className={cn('shrink-0 text-slate-400 transition-transform', expanded && 'rotate-180')} />
          {corHex && <ColorDot hex={corHex} />}
          <span className="truncate text-[12px] font-bold text-ink">{label}</span>
          {!ativa && (
            <span className="shrink-0 rounded-full bg-slate-200 px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-slate-500">
              Indisponível
            </span>
          )}
          {versao.preco != null && <span className="shrink-0 text-[10px] font-semibold text-slate-400">{versao.preco} MT</span>}
        </button>

        {/* Ícone de imagem junto da seta — acesso imediato sem abrir os detalhes. */}
        <button
          type="button"
          onClick={() => setImagePickerOpen(true)}
          title={imagens.length === 0 ? 'Escolher imagens desta versão' : `${imagens.length} imagem(ns) escolhida(s)`}
          className={cn(
            'relative flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-lg transition-colors active:scale-[0.92]',
            imagens.length > 0 ? 'ring-1 ring-inset ring-slate-200' : 'bg-slate-50 text-slate-400 hover:text-ink'
          )}
        >
          {imagens[0] ? (
            <Image src={imagens[0]} alt="" fill className="object-cover" sizes="32px" />
          ) : (
            <Images size={15} />
          )}
          {imagens.length > 1 && (
            <span className="absolute bottom-0 right-0 flex h-3.5 min-w-[14px] items-center justify-center rounded-full bg-ink px-0.5 text-[8px] font-black text-white">
              {imagens.length}
            </span>
          )}
        </button>

        <input
          type="number"
          min={0}
          disabled={!ativa}
          value={versao.estoque ?? ''}
          onChange={(e) => onChange({ ...versao, estoque: e.target.value === '' ? null : Number(e.target.value) })}
          placeholder="0"
          className="h-8 w-16 shrink-0 rounded-lg border border-transparent bg-slate-50 px-2 text-right text-[12px] font-bold text-ink outline-none focus:border-ink focus:ring-2 focus:ring-ink/10 disabled:cursor-not-allowed"
        />
      </div>

      {expanded && (
        <div className="mt-2.5 flex flex-col gap-3 border-t border-slate-100 pt-2.5">
          <div>
            <label className="mb-1 block text-[10px] font-black uppercase tracking-widest text-slate-400">Preço</label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={0}
                value={versao.preco ?? ''}
                onChange={(e) => onChange({ ...versao, preco: e.target.value === '' ? null : Number(e.target.value) })}
                placeholder={String(precoBase || 0)}
                className="h-9 w-full rounded-xl border border-transparent bg-slate-50 px-3 text-[13px] font-bold text-ink outline-none focus:border-ink focus:ring-2 focus:ring-ink/10"
              />
              <span className="shrink-0 text-[11px] font-bold text-slate-400">MT</span>
            </div>
            <p className="mt-1.5 text-[10px] font-medium text-slate-400">
              Deixa em branco para usar o preço principal ({precoBase || 0} MT).
            </p>
          </div>

          <div>
            <label className="mb-1 block text-[10px] font-black uppercase tracking-widest text-slate-400">Peso</label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={0}
                step="0.01"
                value={versao.peso ?? ''}
                onChange={(e) => onChange({ ...versao, peso: e.target.value === '' ? null : Number(e.target.value) })}
                placeholder={typeof pesoPadrao === 'number' ? String(pesoPadrao) : '0'}
                className="h-9 w-full rounded-xl border border-transparent bg-slate-50 px-3 text-[13px] font-bold text-ink outline-none focus:border-ink focus:ring-2 focus:ring-ink/10"
              />
              <span className="shrink-0 text-[11px] font-bold text-slate-400">kg</span>
            </div>
            <p className="mt-1.5 text-[10px] font-medium text-slate-400">
              Opcional — deixa em branco para usar{' '}
              {typeof pesoPadrao === 'number' ? `o peso padrão do produto (${pesoPadrao} kg)` : 'o peso padrão do produto'}.
            </p>
            {mostrarAplicarATodas && typeof versao.peso === 'number' && (
              <button
                type="button"
                onClick={() => onAplicarPesoATodas(versao.peso ?? null)}
                className="mt-1.5 text-[10px] font-bold text-ink underline decoration-slate-300 underline-offset-2 hover:decoration-ink"
              >
                Usar este peso em todas as versões
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={() => setImagePickerOpen(true)}
            className="flex items-center gap-1.5 self-start text-[11px] font-bold text-slate-400 hover:text-ink"
          >
            <ImagePlus size={13} />
            {imagens.length === 0 ? 'Escolher imagens desta versão (opcional)' : `Editar imagens (${imagens.length})`}
          </button>

          <button
            type="button"
            onClick={() => onChange({ ...versao, ativa: !ativa })}
            className="self-start text-[11px] font-bold text-slate-400 hover:text-red-500"
          >
            {ativa ? 'Esta versão não existe — remover' : 'Reativar versão'}
          </button>
        </div>
      )}

      {imagePickerOpen && (
        <VariantImagePicker
          open
          onClose={() => setImagePickerOpen(false)}
          label={label}
          lojaId={lojaId}
          fotosGerais={fotos}
          selecionadas={imagens}
          onAddToGaleria={onAddFoto}
          onSave={(urls) => onChange({ ...versao, imagens: urls })}
        />
      )}
    </div>
  );
}

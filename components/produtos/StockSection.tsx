'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { ChevronDown, ImagePlus, Images, MoreVertical, Pencil, RotateCcw, Trash2 } from 'lucide-react';
import { VariantImagePicker } from '@/components/produtos/VariantImagePicker';
import { ColorDot } from '@/components/produtos/SuggestInput';
import { agruparPorFilha, agruparPorRaiz, aplicarPesoATodas, totalEstoque } from '@/lib/variantes';
import { resolverHexCor } from '@/lib/cores';
import { formatarPeso } from '@/lib/peso';
import type { ProdutoOpcaoFilha, ProdutoOpcaoNeta, ProdutoOpcaoRaiz, ProdutoVersao } from '@/types/database';
import { cn } from '@/lib/cn';

/**
 * "Versões disponíveis" — só é montado quando o produto tem opções (raiz
 * e/ou filha). O controlo geral de "Controlar estoque" vive no
 * ProductForm, antes de "Opções do produto"; aqui só decidimos se o
 * campo de estoque de cada combinação final aparece ou não — os valores
 * nunca são apagados quando o estoque está desativado, só escondidos.
 */
export function StockSection({
  raiz,
  filha,
  neta,
  versoes,
  onVersoesChange,
  controlarEstoque,
  precoBase,
  pesoPadrao,
  fotos,
  onAddFoto,
  lojaId,
}: {
  raiz: ProdutoOpcaoRaiz | null;
  filha: ProdutoOpcaoFilha | null;
  neta: ProdutoOpcaoNeta | null;
  versoes: ProdutoVersao[];
  onVersoesChange: (v: ProdutoVersao[]) => void;
  /** Controla só a visibilidade do campo de estoque de cada combinação — vem do topo do formulário. */
  controlarEstoque: boolean;
  precoBase: number;
  /** Peso padrão do produto (kg) — usado como placeholder quando a versão não tem peso próprio. */
  pesoPadrao?: number | null;
  /** Galeria geral do produto — cada versão escolhe imagens daqui, nunca envia de novo. */
  fotos: string[];
  onAddFoto: (url: string) => void;
  lojaId: string;
}) {
  const arvore = raiz && filha ? agruparPorRaiz(raiz, versoes) : null;

  return (
    <div>
      <div className="mb-2 flex items-center justify-between pl-1">
        <h3 className="text-[13px] font-black text-ink">Versões disponíveis</h3>
        {controlarEstoque && (
          <span className="text-[11px] font-bold text-slate-400">{totalEstoque(versoes)} unidades no total</span>
        )}
      </div>

      {arvore ? (
        <div className="flex flex-col gap-2">
          {arvore.map((grupo) => (
            <RaizGroup
              key={grupo.raizValor}
              raizValor={grupo.raizValor}
              raizNome={raiz!.nome}
              raizCores={raiz!.cores}
              filha={filha!}
              neta={neta}
              versoes={grupo.versoes}
              controlarEstoque={controlarEstoque}
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
              controlarEstoque={controlarEstoque}
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

function RaizGroup({
  raizValor,
  raizNome,
  raizCores,
  filha,
  neta,
  versoes,
  controlarEstoque,
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
  filha: ProdutoOpcaoFilha;
  neta: ProdutoOpcaoNeta | null;
  versoes: ProdutoVersao[];
  controlarEstoque: boolean;
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
            ? `sem ${filha.nome.toLowerCase()}s ainda`
            : `${ativos} ${filha.nome.toLowerCase()}${ativos === 1 ? '' : 's'}`}
        </span>
      </button>

      {expanded && (
        <div className="mt-2.5 flex flex-col gap-2 border-t border-slate-200/70 pt-2.5">
          {versoes.length === 0 && (
            <p className="text-[11px] font-medium text-slate-400">
              Ainda sem {filha.nome.toLowerCase()}s para "{raizValor}" — adiciona em "Opções do produto" acima.
            </p>
          )}

          {neta
            ? agruparPorFilha(filha, raizValor, versoes).map((grupo) => (
                <FilhaGroup
                  key={grupo.filhaValor}
                  filhaValor={grupo.filhaValor}
                  filhaEhCor={filha.nome === 'Cor'}
                  filhaCores={filha.cores}
                  netaNome={neta.nome}
                  versoes={grupo.versoes}
                  controlarEstoque={controlarEstoque}
                  precoBase={precoBase}
                  pesoPadrao={pesoPadrao}
                  fotos={fotos}
                  onAddFoto={onAddFoto}
                  lojaId={lojaId}
                  onChangeVersao={onChangeVersao}
                  onAplicarPesoATodas={onAplicarPesoATodas}
                  mostrarAplicarATodas={mostrarAplicarATodas}
                />
              ))
            : versoes.map((v) => (
                <VersaoRow
                  key={v.chave}
                  label={v.valores[filha.nome] ?? v.chave}
                  versao={v}
                  controlarEstoque={controlarEstoque}
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

/** Terceiro nível da árvore (só existe quando há "neta") — agrupador
 *  expansível igual ao RaizGroup, mas um nível mais fundo; só a folha
 *  (VersaoRow) recebe estoque. */
function FilhaGroup({
  filhaValor,
  filhaEhCor,
  filhaCores,
  netaNome,
  versoes,
  controlarEstoque,
  precoBase,
  pesoPadrao,
  fotos,
  onAddFoto,
  lojaId,
  onChangeVersao,
  onAplicarPesoATodas,
  mostrarAplicarATodas,
}: {
  filhaValor: string;
  filhaEhCor: boolean;
  filhaCores?: Record<string, string>;
  netaNome: string;
  versoes: ProdutoVersao[];
  controlarEstoque: boolean;
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

  return (
    <div className="ml-2 rounded-xl bg-white/70 px-3 py-2 ring-1 ring-inset ring-slate-200/70">
      <button type="button" onClick={() => setExpanded((v) => !v)} className="flex w-full items-center justify-between gap-3">
        <span className="flex items-center gap-1.5">
          <ChevronDown size={12} className={cn('shrink-0 text-slate-400 transition-transform', expanded && 'rotate-180')} />
          {filhaEhCor && <ColorDot hex={resolverHexCor(filhaValor, filhaCores)} />}
          <span className="text-[11.5px] font-bold text-ink">{filhaValor}</span>
        </span>
        <span className="shrink-0 text-[10.5px] font-semibold text-slate-400">
          {versoes.length === 0
            ? `sem ${netaNome.toLowerCase()}s ainda`
            : `${ativos} ${netaNome.toLowerCase()}${ativos === 1 ? '' : 's'}`}
        </span>
      </button>

      {expanded && (
        <div className="mt-2 flex flex-col gap-1.5 border-t border-slate-100 pt-2">
          {versoes.length === 0 && (
            <p className="text-[10.5px] font-medium text-slate-400">
              Ainda sem {netaNome.toLowerCase()}s para "{filhaValor}" — adiciona em "Opções do produto" acima.
            </p>
          )}
          {versoes.map((v) => (
            <VersaoRow
              key={v.chave}
              label={v.valores[netaNome] ?? v.chave}
              versao={v}
              controlarEstoque={controlarEstoque}
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
  controlarEstoque,
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
  /** Mostra/esconde o campo de estoque desta combinação — os dados nunca são apagados quando fica escondido. */
  controlarEstoque: boolean;
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
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const ativa = versao.ativa !== false;
  const imagens = versao.imagens ?? [];

  useEffect(() => {
    if (!menuOpen) return;
    function onClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    }
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, [menuOpen]);

  function handleRemover() {
    setMenuOpen(false);
    if (!confirm(`Remover a versão "${label}"? Fica escondida na loja — dá para reativar depois.`)) return;
    onChange({ ...versao, ativa: false });
  }

  function handleReativar() {
    setMenuOpen(false);
    onChange({ ...versao, ativa: true });
  }

  return (
    <div className={cn('rounded-xl bg-white px-3 py-2 shadow-sm transition-opacity', !ativa && 'opacity-50')}>
      {/* Linha compacta — só o essencial: nome/cor, preço, peso (quando
      definido), imagem, estoque (se ativo) e o menu "⋯" para ações menos
      frequentes. */}
      <div className="flex items-center gap-2">
        <button type="button" onClick={() => setExpanded((v) => !v)} className="flex min-w-0 flex-1 items-center gap-1.5 text-left">
          <ChevronDown size={12} className={cn('shrink-0 text-slate-400 transition-transform', expanded && 'rotate-180')} />
          {corHex && <ColorDot hex={corHex} />}
          <span className="truncate text-[12px] font-bold text-ink">{label}</span>
          {!ativa && (
            <span className="shrink-0 rounded-full bg-slate-200 px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-slate-500">
              Indisponível
            </span>
          )}
          <span className="flex shrink-0 items-center gap-1 text-[10px] font-semibold text-slate-400">
            {versao.preco != null && <span>{versao.preco} MT</span>}
            {typeof versao.peso === 'number' && (
              <span>{versao.preco != null ? '· ' : ''}{formatarPeso(versao.peso)}</span>
            )}
          </span>
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

        {/* Estoque — editável direto na linha, sem abrir a versão. Só
        aparece quando "Controlar estoque" está ligado; os dados guardados
        não desaparecem, só ficam escondidos enquanto estiver desligado. */}
        {controlarEstoque && (
          <input
            type="number"
            min={0}
            disabled={!ativa}
            value={versao.estoque ?? ''}
            onChange={(e) => onChange({ ...versao, estoque: e.target.value === '' ? null : Number(e.target.value) })}
            placeholder="0"
            aria-label={`Estoque de ${label}`}
            className="h-8 w-14 shrink-0 rounded-lg border border-transparent bg-slate-50 px-2 text-right text-[12px] font-bold text-ink outline-none focus:border-ink focus:ring-2 focus:ring-ink/10 disabled:cursor-not-allowed"
          />
        )}

        {/* "⋯" — ações menos frequentes (editar detalhes / remover versão).
        Fica ao lado das outras ações da linha; nunca um ícone de lixo
        sempre visível. */}
        <div ref={menuRef} className="relative shrink-0">
          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            aria-label="Ações da versão"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-ink"
          >
            <MoreVertical size={15} strokeWidth={2.3} />
          </button>

          {menuOpen && (
            <div className="absolute right-0 top-full z-20 mt-1.5 w-[168px] overflow-hidden rounded-2xl border border-slate-100 bg-white p-1.5 shadow-[0_16px_40px_-14px_rgba(15,23,42,0.22)]">
              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  setExpanded(true);
                }}
                className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-[12px] font-semibold text-ink transition-colors hover:bg-slate-50"
              >
                <Pencil size={14} strokeWidth={2.3} className="text-slate-500" />
                Editar detalhes
              </button>
              {ativa ? (
                <button
                  type="button"
                  onClick={handleRemover}
                  className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-[12px] font-semibold text-red-500 transition-colors hover:bg-red-50"
                >
                  <Trash2 size={14} strokeWidth={2.3} />
                  Remover versão
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleReativar}
                  className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-[12px] font-semibold text-ink transition-colors hover:bg-slate-50"
                >
                  <RotateCcw size={14} strokeWidth={2.3} className="text-slate-500" />
                  Reativar versão
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Detalhes menos frequentes — só aparecem ao expandir a versão. */}
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
              {typeof pesoPadrao === 'number' ? `o peso padrão do produto (${formatarPeso(pesoPadrao)})` : 'o peso padrão do produto'}.
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

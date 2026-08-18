'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { ChevronDown, ImagePlus, MoreVertical, Pencil, RotateCcw, Trash2 } from 'lucide-react';
import { VariantImagePicker } from '@/components/produtos/VariantImagePicker';
import { ColorDot } from '@/components/produtos/SuggestInput';
import { agruparPorFilha, agruparPorRaiz, aplicarPesoATodas, imagensParaVersao, totalEstoque } from '@/lib/variantes';
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
  imagensPorCaracteristica,
  onChangeImagensCaracteristica,
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
  /** Imagens por valor de característica (ex: foto de "Vermelho") — nível
   *  do meio da hierarquia de imagens, entre a galeria geral e a imagem
   *  própria de uma versão. Ver `imagensParaVersao()` em lib/variantes.ts. */
  imagensPorCaracteristica?: Record<string, Record<string, string[]>>;
  onChangeImagensCaracteristica: (nomeCaracteristica: string, valor: string, urls: string[]) => void;
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
              imagensPorCaracteristica={imagensPorCaracteristica}
              onChangeImagensCaracteristica={onChangeImagensCaracteristica}
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
              imagensPorCaracteristica={imagensPorCaracteristica}
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

/** Miniatura de imagem do grupo — vive sempre no cabeçalho (aberto ou
 *  fechado), ao lado do valor da característica, nunca escondida atrás de
 *  um "editar" dentro do conteúdo expandido: a seta serve só para abrir
 *  as combinações, a miniatura é o único ponto de entrada para imagens.
 *
 *  Três estados, nesta ordem de prioridade:
 *  1. Imagem própria definida para este valor → mostra-a.
 *  2. Sem imagem própria mas o produto tem galeria geral → mostra a 1ª
 *     foto da galeria como indicação visual (herança), NÃO como
 *     atribuição definitiva — continua a poder ser trocada por valor.
 *  3. Nem imagem própria nem galeria geral → ícone "+" discreto.
 *
 *  Clicar abre sempre o editor deste valor específico. */
function GroupThumbnail({ imagens, onClick }: { imagens: string[]; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className="relative flex h-6 w-6 shrink-0 items-center justify-center overflow-hidden rounded-md ring-1 ring-inset ring-slate-200 transition-transform active:scale-90"
    >
      {imagens[0] ? (
        <Image src={imagens[0]} alt="" fill className="object-cover" sizes="24px" />
      ) : (
        <ImagePlus size={12} className="text-slate-300" />
      )}
    </button>
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
  imagensPorCaracteristica,
  onChangeImagensCaracteristica,
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
  imagensPorCaracteristica?: Record<string, Record<string, string[]>>;
  onChangeImagensCaracteristica: (nomeCaracteristica: string, valor: string, urls: string[]) => void;
  onChangeVersao: (chave: string, next: ProdutoVersao) => void;
  onAplicarPesoATodas: (peso: number | null) => void;
  mostrarAplicarATodas: boolean;
}) {
  // Começa expandido — o utilizador abre a cor e vê imediatamente todas
  // as combinações finais, sem clique adicional. Pode fechar se quiser
  // compactar a vista quando há muitos grupos.
  const [expanded, setExpanded] = useState(true);
  const [imagePickerOpen, setImagePickerOpen] = useState(false);
  const ativos = versoes.filter((v) => v.ativa !== false).length;
  const ehCor = raizNome === 'Cor';
  // Só faz sentido dar imagem de grupo quando há uma segunda camada — com
  // uma única característica, o valor já É a versão e a imagem própria da
  // versão (mais abaixo) já resolve isso sem duplicar o conceito.
  const imagensDoGrupo = imagensPorCaracteristica?.[raizNome]?.[raizValor] ?? [];
  // O que mostrar na miniatura: imagem própria deste valor, senão a 1ª
  // foto da galeria geral (herança visual, não atribuição definitiva).
  const imagensExibidas = imagensDoGrupo.length > 0 ? imagensDoGrupo : fotos;

  return (
    <div className="rounded-2xl bg-slate-50/70 px-3.5 py-2.5">
      <div className="flex w-full items-center justify-between gap-2">
        <button type="button" onClick={() => setExpanded((v) => !v)} className="flex min-w-0 flex-1 items-center gap-1.5 text-left">
          <ChevronDown size={13} className={cn('shrink-0 text-slate-400 transition-transform', expanded && 'rotate-180')} />
          {ehCor && <ColorDot hex={resolverHexCor(raizValor, raizCores)} />}
          <span className="truncate text-[12px] font-bold text-ink">{raizValor}</span>
        </button>
        <span className="shrink-0 text-[11px] font-semibold text-slate-400">
          {versoes.length === 0
            ? `sem ${filha.nome.toLowerCase()}s ainda`
            : `${ativos} ${filha.nome.toLowerCase()}${ativos === 1 ? '' : 's'}`}
        </span>
        {/* Miniatura sempre visível no cabeçalho — é o único ponto de
        entrada para imagens deste valor. A seta ao lado serve só para
        abrir as combinações abaixo, nunca para revelar a imagem. */}
        <GroupThumbnail imagens={imagensExibidas} onClick={() => setImagePickerOpen(true)} />
      </div>

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
                  filhaNome={filha.nome}
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
                  imagensPorCaracteristica={imagensPorCaracteristica}
                  onChangeImagensCaracteristica={onChangeImagensCaracteristica}
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
                  imagensPorCaracteristica={imagensPorCaracteristica}
                  onChange={(next) => onChangeVersao(v.chave, next)}
                  onAplicarPesoATodas={onAplicarPesoATodas}
                  mostrarAplicarATodas={mostrarAplicarATodas}
                />
              ))}
        </div>
      )}

      {imagePickerOpen && (
        <VariantImagePicker
          open
          onClose={() => setImagePickerOpen(false)}
          label={raizValor}
          lojaId={lojaId}
          fotosGerais={fotos}
          selecionadas={imagensDoGrupo}
          onAddToGaleria={onAddFoto}
          onSave={(urls) => onChangeImagensCaracteristica(raizNome, raizValor, urls)}
        />
      )}
    </div>
  );
}

/** Terceiro nível da árvore (só existe quando há "neta") — agrupador
 *  expansível igual ao RaizGroup, mas um nível mais fundo; só a folha
 *  (VersaoRow) recebe estoque. */
function FilhaGroup({
  filhaValor,
  filhaNome,
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
  imagensPorCaracteristica,
  onChangeImagensCaracteristica,
  onChangeVersao,
  onAplicarPesoATodas,
  mostrarAplicarATodas,
}: {
  filhaValor: string;
  filhaNome: string;
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
  imagensPorCaracteristica?: Record<string, Record<string, string[]>>;
  onChangeImagensCaracteristica: (nomeCaracteristica: string, valor: string, urls: string[]) => void;
  onChangeVersao: (chave: string, next: ProdutoVersao) => void;
  onAplicarPesoATodas: (peso: number | null) => void;
  mostrarAplicarATodas: boolean;
}) {
  // Começa expandido — ao abrir o grupo raiz, o utilizador já vê todos os
  // sub-grupos de filha abertos, expondo as versões finais sem cliques extra.
  const [expanded, setExpanded] = useState(true);
  const [imagePickerOpen, setImagePickerOpen] = useState(false);
  const ativos = versoes.filter((v) => v.ativa !== false).length;
  const imagensDoGrupo = imagensPorCaracteristica?.[filhaNome]?.[filhaValor] ?? [];
  const imagensExibidas = imagensDoGrupo.length > 0 ? imagensDoGrupo : fotos;

  return (
    <div className="ml-2 rounded-xl bg-white/70 px-3 py-2 ring-1 ring-inset ring-slate-200/70">
      <div className="flex w-full items-center justify-between gap-2">
        <button type="button" onClick={() => setExpanded((v) => !v)} className="flex min-w-0 flex-1 items-center gap-1.5 text-left">
          <ChevronDown size={12} className={cn('shrink-0 text-slate-400 transition-transform', expanded && 'rotate-180')} />
          {filhaEhCor && <ColorDot hex={resolverHexCor(filhaValor, filhaCores)} />}
          <span className="truncate text-[11.5px] font-bold text-ink">{filhaValor}</span>
        </button>
        <span className="shrink-0 text-[10.5px] font-semibold text-slate-400">
          {versoes.length === 0
            ? `sem ${netaNome.toLowerCase()}s ainda`
            : `${ativos} ${netaNome.toLowerCase()}${ativos === 1 ? '' : 's'}`}
        </span>
        <GroupThumbnail imagens={imagensExibidas} onClick={() => setImagePickerOpen(true)} />
      </div>

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
              imagensPorCaracteristica={imagensPorCaracteristica}
              onChange={(next) => onChangeVersao(v.chave, next)}
              onAplicarPesoATodas={onAplicarPesoATodas}
              mostrarAplicarATodas={mostrarAplicarATodas}
            />
          ))}
        </div>
      )}

      {imagePickerOpen && (
        <VariantImagePicker
          open
          onClose={() => setImagePickerOpen(false)}
          label={filhaValor}
          lojaId={lojaId}
          fotosGerais={fotos}
          selecionadas={imagensDoGrupo}
          onAddToGaleria={onAddFoto}
          onSave={(urls) => onChangeImagensCaracteristica(filhaNome, filhaValor, urls)}
        />
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
  imagensPorCaracteristica,
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
  imagensPorCaracteristica?: Record<string, Record<string, string[]>>;
  onChange: (v: ProdutoVersao) => void;
  onAplicarPesoATodas: (peso: number | null) => void;
  mostrarAplicarATodas: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const [imagePickerOpen, setImagePickerOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const ativa = versao.ativa !== false;
  // Hierarquia completa: imagem própria da versão → imagem herdada da
  // característica (ex: "Vermelho") → galeria geral do produto. O botão
  // de imagem mostra sempre o que vai aparecer na loja, mesmo quando a
  // versão em si não tem imagem própria escolhida.
  const resolvido = imagensParaVersao(versao, imagensPorCaracteristica, fotos);
  const imagens = resolvido.imagens;
  const imagemPropria = resolvido.origem === 'versao';

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
          </span>
        </button>

        {/* Miniatura sempre visível — mostra o que vai aparecer na loja
        mesmo quando esta versão não tem imagem própria (própria →
        herdada da característica → galeria geral → ícone "+" se não
        houver nada). Clicar abre sempre o editor desta versão. */}
        <button
          type="button"
          onClick={() => setImagePickerOpen(true)}
          title={
            imagemPropria
              ? `${imagens.length} imagem(ns) própria(s) desta versão`
              : resolvido.origem === 'caracteristica'
                ? `A herdar imagem de "${resolvido.caracteristica ? versao.valores[resolvido.caracteristica] : ''}"`
                : imagens.length > 0
                  ? 'A herdar a galeria geral do produto'
                  : 'Definir imagem'
          }
          className="relative flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden rounded-lg ring-1 ring-inset ring-slate-200 transition-transform active:scale-90"
        >
          {imagens[0] ? (
            <>
              <Image src={imagens[0]} alt="" fill className="object-cover" sizes="28px" />
              {imagemPropria && imagens.length > 1 && (
                <span className="absolute bottom-0 right-0 flex h-3.5 min-w-[14px] items-center justify-center rounded-full bg-ink px-0.5 text-[8px] font-black text-white">
                  {imagens.length}
                </span>
              )}
            </>
          ) : (
            <ImagePlus size={13} className="text-slate-300" />
          )}
        </button>

        {/* Peso — editável direto na linha, sempre visível (não só quando
        "Controlar estoque" está ligado, porque pesagem serve para o cálculo
        de envio independentemente do estoque). Fica antes do estoque na
        ordem dos campos rápidos: peso primeiro, depois estoque. */}
        <input
          type="number"
          min={0}
          step="0.01"
          value={versao.peso ?? ''}
          onChange={(e) => onChange({ ...versao, peso: e.target.value === '' ? null : Number(e.target.value) })}
          placeholder={typeof pesoPadrao === 'number' ? String(pesoPadrao) : '0'}
          title={`Peso de ${label} (kg)`}
          aria-label={`Peso de ${label}`}
          className="h-8 w-14 shrink-0 rounded-lg border border-transparent bg-slate-50 px-2 text-right text-[12px] font-bold text-ink outline-none focus:border-ink focus:ring-2 focus:ring-ink/10"
        />

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
                  setImagePickerOpen(true);
                }}
                className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-[12px] font-semibold text-ink transition-colors hover:bg-slate-50"
              >
                <ImagePlus size={14} strokeWidth={2.3} className="text-slate-500" />
                Imagem desta versão
              </button>
              {imagemPropria && (
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    onChange({ ...versao, imagens: [] });
                  }}
                  className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-[12px] font-semibold text-ink transition-colors hover:bg-slate-50"
                >
                  <RotateCcw size={14} strokeWidth={2.3} className="text-slate-500" />
                  Usar imagem herdada
                </button>
              )}
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
            <p className="text-[10px] font-medium text-slate-400">
              Editável na linha acima (kg). Deixa em branco para usar{' '}
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

          <div className="flex flex-col items-start gap-1">
            <label className="mb-0.5 block text-[10px] font-black uppercase tracking-widest text-slate-400">Imagem</label>
            <p className="text-[10.5px] font-medium text-slate-400">
              {imagemPropria
                ? `${imagens.length} imagem(ns) própria(s) desta versão.`
                : `Sem imagem própria — a usar ${resolvido.origem === 'caracteristica' ? `a foto de "${resolvido.caracteristica ? versao.valores[resolvido.caracteristica] : ''}"` : 'a galeria geral do produto'}.`}
            </p>
            <button
              type="button"
              onClick={() => setImagePickerOpen(true)}
              className="flex items-center gap-1.5 self-start text-[11px] font-bold text-ink underline decoration-slate-300 underline-offset-2 hover:decoration-ink"
            >
              {imagemPropria ? 'Editar imagens' : 'Escolher imagem própria'}
            </button>
          </div>
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

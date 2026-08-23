'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { ChevronDown, ImagePlus, MoreVertical, RotateCcw, Trash2 } from 'lucide-react';
import { VariantImagePicker } from '@/components/produtos/VariantImagePicker';
import { ColorDot } from '@/components/produtos/SuggestInput';
import { agruparPorFilha, agruparPorRaiz, aplicarPesoATodas, imagensParaVersao, totalEstoque } from '@/lib/variantes';
import { resolverHexCor } from '@/lib/cores';
import { kgParaUnidade, pesoParaKg, type UnidadePeso } from '@/lib/peso';
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
  controlarPeso,
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
  /** Controla só a visibilidade do campo de peso de cada combinação — vem do topo do formulário. */
  controlarPeso: boolean;
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
          <span className="text-[11px] font-bold text-[#8A8681]">{totalEstoque(versoes)} unidades no total</span>
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
              controlarPeso={controlarPeso}
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
            <p className="rounded-md bg-[#F4F4F3] px-3.5 py-3 text-center text-[11px] font-semibold text-[#8A8681]">
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
              controlarPeso={controlarPeso}
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
      className="relative flex h-6 w-6 shrink-0 items-center justify-center overflow-hidden rounded-md ring-1 ring-inset ring-[#D4D2CF] transition-transform active:scale-90"
    >
      {imagens[0] ? (
        <Image src={imagens[0]} alt="" fill className="object-cover" sizes="24px" />
      ) : (
        <ImagePlus size={12} className="text-[#B8B5B1]" />
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
  controlarPeso,
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
  controlarPeso: boolean;
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
    <div className="rounded-md bg-[#F4F4F3]/70 px-3.5 py-2.5">
      <div className="flex w-full items-center justify-between gap-2">
        <button type="button" onClick={() => setExpanded((v) => !v)} className="flex min-w-0 flex-1 items-center gap-1.5 text-left">
          <ChevronDown size={13} className={cn('shrink-0 text-[#8A8681] transition-transform', expanded && 'rotate-180')} />
          {ehCor && <ColorDot hex={resolverHexCor(raizValor, raizCores)} />}
          <span className="truncate text-[12px] font-bold text-ink">{raizValor}</span>
        </button>
        <span className="shrink-0 text-[11px] font-semibold text-[#8A8681]">
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
        <div className="mt-2.5 flex flex-col gap-2 border-t border-[#D4D2CF]/70 pt-2.5">
          {versoes.length === 0 && (
            <p className="text-[11px] font-medium text-[#8A8681]">
              Ainda sem {filha.nome.toLowerCase()}s para "{raizValor}" — adiciona em "Opções do produto" acima.
            </p>
          )}

          {neta
            ? agruparPorFilha(filha, raizValor, versoes).map((grupo) => (
                // Com 3 características, o nível do meio (filha) funciona como
                // separador visual — não é um accordion clicável. O utilizador
                // abre a cor e vê imediatamente todas as versões finais agrupadas
                // visualmente por tamanho/filha, sem clique extra.
                <div key={grupo.filhaValor} className="flex flex-col gap-1">
                  <div className="flex items-center gap-1.5 px-0.5 pb-0.5 pt-1">
                    {filha.nome === 'Cor' && (
                      <ColorDot hex={resolverHexCor(grupo.filhaValor, filha.cores)} />
                    )}
                    <span className="text-[10px] font-black uppercase tracking-widest text-[#8A8681]">
                      {grupo.filhaValor}
                    </span>
                  </div>
                  {grupo.versoes.length === 0 ? (
                    <p className="text-[10.5px] font-medium text-[#8A8681] px-1">
                      Ainda sem {neta.nome.toLowerCase()}s — adiciona em "Opções do produto" acima.
                    </p>
                  ) : (
                    grupo.versoes.map((v) => (
                      <VersaoRow
                        key={v.chave}
                        label={v.valores[neta.nome] ?? v.chave}
                        versao={v}
                        controlarEstoque={controlarEstoque}
                        controlarPeso={controlarPeso}
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
                    ))
                  )}
                </div>
              ))
            : versoes.map((v) => (
                <VersaoRow
                  key={v.chave}
                  label={v.valores[filha.nome] ?? v.chave}
                  versao={v}
                  controlarEstoque={controlarEstoque}
                  controlarPeso={controlarPeso}
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


function VersaoRow({
  label,
  corHex,
  versao,
  controlarEstoque,
  controlarPeso,
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
  /** Mostra/esconde o campo de peso desta combinação — os dados nunca são apagados quando fica escondido. */
  controlarPeso: boolean;
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
  const [imagePickerOpen, setImagePickerOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Unidade de exibição do campo de peso — só afeta o que aparece no
  // input; o valor continua sempre guardado em kg (versao.peso). Cada
  // versão lembra a sua própria unidade escolhida, tal como o peso padrão.
  const [pesoUnidade, setPesoUnidade] = useState<UnidadePeso>('kg');
  const [unidadePickerOpen, setUnidadePickerOpen] = useState(false);
  const unidadeRef = useRef<HTMLDivElement>(null);

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

  useEffect(() => {
    if (!unidadePickerOpen) return;
    function onClickOutside(e: MouseEvent) {
      if (unidadeRef.current && !unidadeRef.current.contains(e.target as Node)) setUnidadePickerOpen(false);
    }
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, [unidadePickerOpen]);

  function trocarUnidadePeso(u: UnidadePeso) {
    setUnidadePickerOpen(false);
    setPesoUnidade(u);
  }

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
    <div className={cn('rounded-md bg-white px-4 py-3 shadow-sm transition-opacity', !ativa && 'opacity-50')}>
      {/* Linha 1 — identidade da versão: nome com largura total (nunca
      corta), miniatura de imagem e menu de ações. */}
      <div className="flex items-center gap-2">
        <div className="flex min-w-0 flex-1 items-center gap-1.5">
          {corHex && <ColorDot hex={corHex} />}
          <span className="truncate text-[13px] font-bold text-ink">{label}</span>
          {!ativa && (
            <span className="shrink-0 rounded-full bg-[#E5E3E0] px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-[#52525B]">
              Indisponível
            </span>
          )}
        </div>

        {/* Miniatura de imagem — sempre visível, clicar abre o editor */}
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
          className="relative flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden rounded-md ring-1 ring-inset ring-[#D4D2CF] transition-transform active:scale-90"
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
            <ImagePlus size={13} className="text-[#B8B5B1]" />
          )}
        </button>

        {/* "⋯" — ações menos frequentes (imagem própria / remover versão). */}
        <div ref={menuRef} className="relative shrink-0">
          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            aria-label="Ações da versão"
            className="flex h-7 w-7 items-center justify-center rounded-md text-[#8A8681] transition-colors hover:bg-[#F4F4F3] hover:text-ink"
          >
            <MoreVertical size={15} strokeWidth={2.3} />
          </button>

          {menuOpen && (
            <div className="absolute right-0 top-full z-20 mt-1.5 w-[168px] overflow-hidden rounded-md border border-[#E5E3E0] bg-white p-1.5 shadow-[0_16px_40px_-14px_rgba(28,25,23,0.22)]">
              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  setImagePickerOpen(true);
                }}
                className="flex w-full items-center gap-2.5 rounded-md px-3 py-2.5 text-left text-[12px] font-semibold text-ink transition-colors hover:bg-[#F4F4F3]"
              >
                <ImagePlus size={14} strokeWidth={2.3} className="text-[#71717A]" />
                Imagem desta versão
              </button>
              {imagemPropria && (
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    onChange({ ...versao, imagens: [] });
                  }}
                  className="flex w-full items-center gap-2.5 rounded-md px-3 py-2.5 text-left text-[12px] font-semibold text-ink transition-colors hover:bg-[#F4F4F3]"
                >
                  <RotateCcw size={14} strokeWidth={2.3} className="text-[#71717A]" />
                  Usar imagem herdada
                </button>
              )}

              {controlarPeso && mostrarAplicarATodas && typeof versao.peso === 'number' && (
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    onAplicarPesoATodas(versao.peso ?? null);
                  }}
                  className="flex w-full items-center gap-2.5 rounded-md px-3 py-2.5 text-left text-[12px] font-semibold text-ink transition-colors hover:bg-[#F4F4F3]"
                >
                  <RotateCcw size={14} strokeWidth={2.3} className="text-[#71717A]" />
                  Usar este peso em todas
                </button>
              )}

              {ativa ? (
                <button
                  type="button"
                  onClick={handleRemover}
                  className="flex w-full items-center gap-2.5 rounded-md px-3 py-2.5 text-left text-[12px] font-semibold text-red-500 transition-colors hover:bg-red-50"
                >
                  <Trash2 size={14} strokeWidth={2.3} />
                  Remover versão
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleReativar}
                  className="flex w-full items-center gap-2.5 rounded-md px-3 py-2.5 text-left text-[12px] font-semibold text-ink transition-colors hover:bg-[#F4F4F3]"
                >
                  <RotateCcw size={14} strokeWidth={2.3} className="text-[#71717A]" />
                  Reativar versão
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Linha 2 — preço, peso e estoque, editáveis direto, sem disputar
      espaço com o nome. */}
      <div className="mt-2 flex items-center gap-2 border-t border-[#E5E3E0] pt-2">
        {/* Preço */}
        <div className="flex flex-1 items-center gap-1.5">
          <span className="shrink-0 text-[9px] font-black uppercase tracking-widest text-[#8A8681]">MT</span>
          <input
            type="number"
            min={0}
            value={versao.preco ?? ''}
            onChange={(e) => onChange({ ...versao, preco: e.target.value === '' ? null : Number(e.target.value) })}
            placeholder={String(precoBase || 0)}
            title={`Preço de ${label} (MT)`}
            aria-label={`Preço de ${label}`}
            className="h-7 w-full min-w-0 rounded-md border border-transparent bg-[#F4F4F3] px-2 text-[12px] font-bold text-ink outline-none focus:border-ink focus:ring-2 focus:ring-ink/10"
          />
        </div>

        {/* Peso — visível quando "Controlar peso" está ligado. A unidade
        ("kg", "g", "lb", "oz") é clicável e abre um seletor; o valor
        continua sempre guardado em kg, só a exibição muda de unidade. */}
        {controlarPeso && (
          <div className="flex flex-1 items-center gap-1">
            <div ref={unidadeRef} className="relative shrink-0">
              <button
                type="button"
                onClick={() => setUnidadePickerOpen((v) => !v)}
                aria-label={`Escolher unidade de peso de ${label}`}
                className="rounded px-1 text-[9px] font-black uppercase tracking-widest text-[#8A8681] transition-colors hover:bg-[#F4F4F3] hover:text-ink"
              >
                {pesoUnidade}
              </button>
              {unidadePickerOpen && (
                <div className="absolute left-0 top-full z-20 mt-1.5 w-14 overflow-hidden rounded-md border border-[#E5E3E0] bg-white p-1.5 shadow-[0_16px_40px_-14px_rgba(28,25,23,0.22)]">
                  {(['g', 'kg', 'lb', 'oz'] as const).map((u) => (
                    <button
                      key={u}
                      type="button"
                      onClick={() => trocarUnidadePeso(u)}
                      className={cn(
                        'flex w-full items-center justify-center rounded-md px-2 py-1.5 text-[11px] font-bold transition-colors',
                        pesoUnidade === u ? 'bg-ink text-white' : 'text-ink hover:bg-[#F4F4F3]'
                      )}
                    >
                      {u}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <input
              type="number"
              min={0}
              step="0.01"
              value={typeof versao.peso === 'number' ? kgParaUnidade(versao.peso, pesoUnidade) : ''}
              onChange={(e) =>
                onChange({
                  ...versao,
                  peso: e.target.value === '' ? null : pesoParaKg(Number(e.target.value), pesoUnidade),
                })
              }
              placeholder={typeof pesoPadrao === 'number' ? String(kgParaUnidade(pesoPadrao, pesoUnidade)) : '0'}
              title={`Peso de ${label} (${pesoUnidade})`}
              aria-label={`Peso de ${label}`}
              className="h-7 w-full min-w-0 rounded-md border border-transparent bg-[#F4F4F3] px-2 text-[12px] font-bold text-ink outline-none focus:border-ink focus:ring-2 focus:ring-ink/10"
            />
          </div>
        )}

        {/* Estoque — visível quando "Controlar estoque" está ligado */}
        {controlarEstoque && (
          <div className="flex flex-1 items-center gap-1.5">
            <span className="shrink-0 text-[9px] font-black uppercase tracking-widest text-[#8A8681]">un.</span>
            <input
              type="number"
              min={0}
              disabled={!ativa}
              value={versao.estoque ?? ''}
              onChange={(e) => onChange({ ...versao, estoque: e.target.value === '' ? null : Number(e.target.value) })}
              placeholder="0"
              aria-label={`Estoque de ${label}`}
              className="h-7 w-full min-w-0 rounded-md border border-transparent bg-[#F4F4F3] px-2 text-[12px] font-bold text-ink outline-none focus:border-ink focus:ring-2 focus:ring-ink/10 disabled:cursor-not-allowed"
            />
          </div>
        )}
      </div>

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

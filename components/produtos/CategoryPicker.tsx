'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronRight, ChevronLeft, Check, Search } from 'lucide-react';
import { Sheet } from '@/components/ui/Sheet';
import { cn } from '@/lib/cn';
import {
  CATEGORIAS_TOPO,
  SEPARADOR_CATEGORIA,
  buscarCategorias,
  itensDe,
  segmentosCategoria,
  subcategoriasDe,
  type CategoriaFolha,
} from '@/lib/categorias';

/**
 * Seletor de categoria — segue as `ui_rules` da taxonomia
 * (Shopyump_Taxonomia_Categorias_e_Regras.json):
 *
 *   - pesquisa em primeiro lugar, com foco automático ao abrir a folha;
 *   - pesquisa em todos os níveis (categoria, subcategoria, item final) e
 *     reconhece sinónimos comuns, mostrando sempre o caminho completo em
 *     cada resultado, com o nome encontrado em destaque e o caminho como
 *     informação secundária;
 *   - sem pesquisa: navega por caminho — Categoria > Subcategoria >
 *     Subcategoria final — com todas as categorias sempre visíveis
 *     (sem paginação nem "ver mais"), como uma lista nativa, não cartões;
 *   - taxonomia oficial fechada — sem opção de categoria personalizada,
 *     para manter os dados consistentes na pesquisa, filtros e Marketplace;
 *   - sem ícones decorativos por categoria — a hierarquia e o texto bastam.
 *
 * O valor gravado continua a ser uma string só, ex: "Moda › Calçados ›
 * Ténis" (mesmo formato que `caracteristicasPorCategoria.ts` já espera),
 * por isso não é preciso nenhuma alteração à base de dados.
 */
export function CategoryPicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false);
  const [termo, setTermo] = useState('');
  const [caminho, setCaminho] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  // Reabrir sempre limpo (sem pesquisa nem navegação pendente de uma
  // sessão anterior) — mas a começar já dentro do caminho atualmente
  // escolhido, para o vendedor ver logo onde está em vez de partir do
  // zero sempre que reabre para afinar a escolha.
  useEffect(() => {
    if (!open) return;
    setTermo('');
    const segmentos = segmentosCategoria(value);
    setCaminho(CATEGORIAS_TOPO.includes(segmentos[0]) ? segmentos.slice(0, -1) : []);
    // Foco automático na pesquisa — "autofocus": true nas ui_rules.
    // Pequeno atraso para o campo já existir no DOM depois da folha abrir.
    const t = setTimeout(() => inputRef.current?.focus(), 150);
    return () => clearTimeout(t);
  }, [open, value]);

  function selecionar(texto: string) {
    onChange(texto);
    setOpen(false);
  }

  const resultados: CategoriaFolha[] = useMemo(() => buscarCategorias(termo), [termo]);

  // Nível atual da navegação por caminho (só usado sem pesquisa ativa).
  const nivel = caminho.length;
  const topo = caminho[0];
  const sub = caminho[1];
  const opcoesNivel = nivel === 0 ? CATEGORIAS_TOPO : nivel === 1 ? subcategoriasDe(topo) : itensDe(topo, sub);
  // Algumas categorias de topo não têm subcategoria (ex: "Outros" vai
  // direto a itens) — nesse caso o "nível 1" já é a lista de itens finais.
  const nivelSaoItensFinal = nivel === 2 || (nivel === 1 && subcategoriasDe(topo).length === 0);

  function tocarOpcao(nomeOpcao: string) {
    if (nivelSaoItensFinal) {
      selecionar([...caminho, nomeOpcao].join(SEPARADOR_CATEGORIA));
      return;
    }
    setCaminho((c) => [...c, nomeOpcao]);
  }

  function voltar() {
    setCaminho((c) => c.slice(0, -1));
  }

  const segmentosValor = segmentosCategoria(value);

  return (
    <div>
      <label className="mb-1.5 block pl-1 text-[11px] font-black uppercase tracking-widest text-slate-500">
        Categoria
      </label>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex w-full items-center justify-between gap-3 rounded-2xl border border-transparent bg-slate-50 px-4 py-3.5 text-left shadow-sm transition-colors hover:border-slate-200"
      >
        {segmentosValor.length > 0 ? (
          <span className="flex min-w-0 flex-1 flex-col">
            {segmentosValor.length > 1 && (
              <span className="truncate text-[11px] font-semibold text-slate-400">
                {segmentosValor.slice(0, -1).join(SEPARADOR_CATEGORIA)}
              </span>
            )}
            <span className="truncate text-[13px] font-bold text-ink">
              {segmentosValor[segmentosValor.length - 1]}
            </span>
          </span>
        ) : (
          <span className="text-[13px] font-semibold text-slate-400">Escolher categoria</span>
        )}
        <ChevronRight size={16} className="shrink-0 text-slate-400" />
      </button>

      <Sheet open={open} onClose={() => setOpen(false)} title="Categoria" heightVh={72} closeButton>
        {/* Pesquisa — sempre visível e em primeiro lugar (search_first),
        fixa no topo da folha para continuar acessível ao fazer scroll na
        lista de resultados ou de navegação por caminho. */}
        <div className="sticky top-0 z-10 -mx-6 bg-white px-6 pb-3 pt-1">
          <div className="flex items-center gap-2.5 border-b border-slate-200 pb-2.5 transition-colors focus-within:border-ink">
            <Search size={16} strokeWidth={2.3} className="shrink-0 text-slate-400" />
            <input
              ref={inputRef}
              value={termo}
              onChange={(e) => setTermo(e.target.value)}
              placeholder="Pesquisar categoria ou subcategoria…"
              className="h-full w-full min-w-0 bg-transparent text-[13px] font-semibold text-ink outline-none placeholder:text-slate-400"
            />
          </div>
        </div>

        {termo.trim() ? (
          // Modo pesquisa: todos os níveis, caminho completo em cada
          // resultado — nome encontrado em destaque, caminho como
          // informação secundária abaixo.
          <div className="flex flex-col pb-3">
            {resultados.length === 0 && (
              <p className="px-1 py-6 text-[13px] font-medium text-slate-400">
                Nenhuma categoria encontrada para &ldquo;{termo.trim()}&rdquo;.
              </p>
            )}
            {resultados.map((r, i) => (
              <button
                key={r.texto}
                type="button"
                onClick={() => selecionar(r.texto)}
                className={cn(
                  'flex items-center justify-between gap-3 px-1 py-3 text-left transition-colors active:bg-slate-50',
                  i !== 0 && 'border-t border-slate-100'
                )}
              >
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[13px] font-bold text-ink">
                    {r.caminho[r.caminho.length - 1]}
                  </span>
                  {r.caminho.length > 1 && (
                    <span className="mt-0.5 block truncate text-[11.5px] font-medium text-slate-400">
                      {r.caminho.slice(0, -1).join(SEPARADOR_CATEGORIA)}
                    </span>
                  )}
                </span>
                {value === r.texto ? (
                  <Check size={16} className="shrink-0 text-ink" />
                ) : (
                  <ChevronRight size={15} className="shrink-0 text-slate-400" />
                )}
              </button>
            ))}
          </div>
        ) : (
          // Sem pesquisa: navegação Categoria > Subcategoria > Subcategoria
          // final. O botão de voltar mostra só o nível imediatamente acima
          // (não o caminho todo repetido), para não desperdiçar espaço.
          <div className="flex flex-col pb-3">
            {nivel > 0 && (
              <button
                type="button"
                onClick={voltar}
                className="mb-1 flex items-center gap-1 self-start py-2 text-[12px] font-bold text-slate-500 transition-colors active:text-ink"
              >
                <ChevronLeft size={14} />
                {caminho[caminho.length - 1]}
              </button>
            )}

            <div className="flex flex-col">
              {opcoesNivel.map((nome, i) => {
                const caminhoOpcao = [...caminho, nome];
                const textoOpcao = caminhoOpcao.join(SEPARADOR_CATEGORIA);
                const selecionavel = nivelSaoItensFinal;
                return (
                  <button
                    key={nome}
                    type="button"
                    onClick={() => tocarOpcao(nome)}
                    className={cn(
                      'flex items-center justify-between gap-3 px-1 py-3 text-left transition-colors active:bg-slate-50',
                      i !== 0 && 'border-t border-slate-100'
                    )}
                  >
                    <span className="truncate text-[13px] font-bold text-ink">{nome}</span>
                    {selecionavel ? (
                      value === textoOpcao && <Check size={16} className="shrink-0 text-ink" />
                    ) : (
                      <ChevronRight size={15} className="shrink-0 text-slate-500" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </Sheet>
    </div>
  );
}

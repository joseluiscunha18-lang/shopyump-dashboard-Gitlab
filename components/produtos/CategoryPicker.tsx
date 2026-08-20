'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronRight, ChevronLeft, Check, Search, Tag } from 'lucide-react';
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
 *   - pesquisa em todos os níveis (categoria, subcategoria, item final),
 *     mostrando sempre o caminho completo em cada resultado;
 *   - sem pesquisa: navega por caminho — Categoria > Subcategoria >
 *     Subcategoria final — com todas as categorias sempre visíveis
 *     (sem paginação nem "ver mais");
 *   - sem ícones por categoria — a hierarquia e o texto bastam.
 *
 * O valor gravado continua a ser uma string só, ex: "Moda › Calçados ›
 * Ténis" (mesmo formato que `caracteristicasPorCategoria.ts` já espera),
 * por isso não é preciso nenhuma alteração à base de dados.
 */
export function CategoryPicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false);
  const [termo, setTermo] = useState('');
  const [caminho, setCaminho] = useState<string[]>([]);
  const [custom, setCustom] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  // Reabrir sempre limpo (sem pesquisa nem navegação pendente de uma
  // sessão anterior) — mas a começar já dentro do caminho atualmente
  // escolhido, para o vendedor ver logo onde está em vez de partir do
  // zero sempre que reabre para afinar a escolha.
  useEffect(() => {
    if (!open) return;
    setTermo('');
    setCustom('');
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

  function confirmCustom() {
    const v = custom.trim();
    if (!v) return;
    selecionar(v);
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

  const valorAtual = value || 'Escolher categoria…';

  return (
    <div>
      <h3 className="mb-2 pl-1 text-[13px] font-black text-ink">Categoria</h3>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex w-full items-center justify-between rounded-2xl border border-transparent bg-slate-50 px-4 py-3.5 text-left shadow-sm transition-all hover:border-slate-200 active:scale-[0.99]"
      >
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-slate-500 shadow-sm">
            <Tag size={16} />
          </div>
          <span className={cn('truncate text-[13px] font-bold', value ? 'text-ink' : 'text-slate-400')}>
            {valorAtual}
          </span>
        </div>
        <ChevronRight size={16} className="shrink-0 text-slate-400" />
      </button>

      <Sheet open={open} onClose={() => setOpen(false)} title="Categoria">
        {/* Pesquisa — sempre visível e em primeiro lugar (search_first),
        fixa no topo da folha para continuar acessível ao fazer scroll na
        lista de resultados ou de navegação por caminho. */}
        <div className="sticky top-0 z-10 -mx-6 bg-white px-6 pb-3 pt-1">
          <div className="relative">
            <Search size={15} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              ref={inputRef}
              value={termo}
              onChange={(e) => setTermo(e.target.value)}
              placeholder="Pesquisar categoria ou subcategoria…"
              className="w-full rounded-2xl border border-transparent bg-slate-50 py-3 pl-10 pr-4 text-[13px] font-semibold text-ink outline-none focus:border-ink focus:bg-white focus:ring-4 focus:ring-ink/5"
            />
          </div>
        </div>

        {termo.trim() ? (
          // Modo pesquisa: todos os níveis, caminho completo em cada resultado.
          <div className="flex flex-col gap-0.5 pb-3">
            {resultados.length === 0 && (
              <p className="px-1 py-4 text-[12px] font-medium text-slate-400">
                Nenhuma categoria encontrada para &ldquo;{termo.trim()}&rdquo;.
              </p>
            )}
            {resultados.map((r) => (
              <button
                key={r.texto}
                type="button"
                onClick={() => selecionar(r.texto)}
                className="flex items-center justify-between gap-3 rounded-2xl px-3 py-3 text-left transition-colors active:bg-slate-50"
              >
                <span className="min-w-0 flex-1 text-[13px] font-bold text-ink">
                  <CaminhoDestacado caminho={r.caminho} />
                </span>
                {value === r.texto && <Check size={16} className="shrink-0 text-ink" />}
              </button>
            ))}
          </div>
        ) : (
          // Sem pesquisa: navegação Categoria > Subcategoria > Subcategoria final.
          <div className="flex flex-col pb-3">
            {nivel > 0 && (
              <button
                type="button"
                onClick={voltar}
                className="mb-1 flex items-center gap-1.5 self-start rounded-xl px-2 py-2 text-[12px] font-bold text-slate-400 transition-colors active:bg-slate-50"
              >
                <ChevronLeft size={14} />
                {caminho.join(' › ')}
              </button>
            )}

            <div className="flex flex-col gap-0.5">
              {opcoesNivel.map((nome) => {
                const caminhoOpcao = [...caminho, nome];
                const textoOpcao = caminhoOpcao.join(SEPARADOR_CATEGORIA);
                const selecionavel = nivelSaoItensFinal;
                return (
                  <button
                    key={nome}
                    type="button"
                    onClick={() => tocarOpcao(nome)}
                    className="flex items-center justify-between rounded-2xl px-3 py-3 text-left transition-colors active:bg-slate-50"
                  >
                    <span className="text-[13px] font-bold text-ink">{nome}</span>
                    {selecionavel ? (
                      value === textoOpcao && <Check size={16} className="text-ink" />
                    ) : (
                      <ChevronRight size={15} className="text-slate-300" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <div className="border-t border-slate-100 pb-4 pt-4">
          <label className="mb-2 block pl-1 text-[11px] font-black uppercase tracking-widest text-slate-400">
            Outra categoria
          </label>
          <div className="flex gap-2">
            <input
              value={custom}
              onChange={(e) => setCustom(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && confirmCustom()}
              placeholder="Escreve o nome…"
              className="w-full rounded-2xl border border-transparent bg-slate-50 px-4 py-3 text-[13px] font-semibold text-ink outline-none focus:border-ink focus:bg-white focus:ring-4 focus:ring-ink/5"
            />
            <button
              type="button"
              onClick={confirmCustom}
              className="flex h-[46px] w-[46px] shrink-0 items-center justify-center rounded-2xl bg-ink text-white shadow-sm active:scale-95"
            >
              <Check size={16} />
            </button>
          </div>
        </div>
      </Sheet>
    </div>
  );
}

/** Caminho completo de um resultado de pesquisa, ex: "Moda › Calçados ›
 *  Ténis" — o último segmento (o item concreto que fez match) fica em
 *  destaque, os segmentos acima ficam mais claros, como contexto. */
function CaminhoDestacado({ caminho }: { caminho: string[] }) {
  return (
    <>
      {caminho.slice(0, -1).map((seg, i) => (
        <span key={i} className="text-slate-400">
          {seg}
          <span className="mx-1 text-slate-300">›</span>
        </span>
      ))}
      <span>{caminho[caminho.length - 1]}</span>
    </>
  );
}

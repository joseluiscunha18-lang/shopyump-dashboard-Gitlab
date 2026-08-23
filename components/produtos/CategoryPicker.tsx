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

export function CategoryPicker({
  value,
  onChange,
  error,
}: {
  value: string;
  onChange: (v: string) => void;
  /** Estado de erro (ex: publicar sem categoria escolhida). */
  error?: boolean;
}) {
  const [open, setOpen]   = useState(false);
  const [termo, setTermo] = useState('');
  const [caminho, setCaminho] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    setTermo('');
    const segmentos = segmentosCategoria(value);
    setCaminho(CATEGORIAS_TOPO.includes(segmentos[0]) ? segmentos.slice(0, -1) : []);
  }, [open, value]);

  function selecionar(texto: string) {
    onChange(texto);
    setOpen(false);
  }

  const resultados: CategoriaFolha[] = useMemo(() => buscarCategorias(termo), [termo]);

  const nivel = caminho.length;
  const topo  = caminho[0];
  const sub   = caminho[1];
  const opcoesNivel       = nivel === 0 ? CATEGORIAS_TOPO : nivel === 1 ? subcategoriasDe(topo) : itensDe(topo, sub);
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
    <div className="flex flex-col gap-1.5">
      <label className="pl-0.5 text-[11px] font-black tracking-[0.02em] text-[#27272A]">
        Categoria
      </label>

      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn(
          'flex w-full items-center justify-between gap-3 rounded-md border bg-white px-4 py-3.5 text-left transition-all duration-150 focus:outline-none',
          error
            ? 'border-red-400 focus:ring-3 focus:ring-red-100'
            : 'border-[#D4D2CF] hover:border-[rgba(28,25,23,0.2)] focus:ring-3 focus:ring-[rgba(28,25,23,0.06)]'
        )}
      >
        {segmentosValor.length > 0 ? (
          <span className="flex min-w-0 flex-1 flex-col gap-0.5">
            {segmentosValor.length > 1 && (
              <span className="truncate text-[11px] font-semibold text-[#71717A]">
                {segmentosValor.slice(0, -1).join(' › ')}
              </span>
            )}
            <span className="truncate text-[15px] font-bold text-[#111110]">
              {segmentosValor[segmentosValor.length - 1]}
            </span>
          </span>
        ) : (
          <span className={cn('text-[15px] font-medium', error ? 'text-red-400' : 'text-[#71717A]')}>
            Escolher categoria
          </span>
        )}
        <ChevronRight size={18} strokeWidth={2} className="shrink-0 text-[#52525B]" />
      </button>
      {error && (
        <p className="pl-0.5 text-[11.5px] font-bold text-red-500">Campo obrigatório</p>
      )}

      <Sheet
        open={open}
        onClose={() => setOpen(false)}
        title="Categoria"
        heightVh={66}
        closeButton
        headerExtra={
          <div className="relative">
            <Search
              size={15}
              className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#71717A]"
            />
            <input
              ref={inputRef}
              value={termo}
              onChange={(e) => setTermo(e.target.value)}
              onPointerDown={(e) => e.stopPropagation()}
              placeholder="Pesquisar categoria…"
              className="w-full touch-auto rounded-md border border-[#D4D2CF] bg-white py-3 pl-10 pr-4 font-[Manrope,sans-serif] text-[13px] font-semibold text-[#111110] outline-none placeholder:font-medium placeholder:text-[#71717A] focus:border-[#1C1917]"
            />
          </div>
        }
      >
        {termo.trim() ? (
          <div className="flex flex-col pb-3">
            {resultados.length === 0 && (
              <p className="px-1 py-6 text-[13px] font-medium text-[#71717A]">
                Nenhuma categoria encontrada para &ldquo;{termo.trim()}&rdquo;.
              </p>
            )}
            {resultados.map((r) => (
              <button
                key={r.texto}
                type="button"
                onClick={() => selecionar(r.texto)}
                className="flex items-center justify-between gap-3 rounded-md px-2 py-3 text-left transition-colors active:bg-[#F4F4F3]"
              >
                <span className="flex min-w-0 flex-1 items-baseline gap-2">
                  <span className="truncate text-[14px] font-bold text-[#111110]">
                    {r.caminho[r.caminho.length - 1]}
                  </span>
                  {r.caminho.length > 1 && (
                    <span className="shrink-0 text-[11.5px] font-semibold text-[#71717A]">
                      {r.topo}
                    </span>
                  )}
                </span>
                {value === r.texto ? (
                  <Check size={17} className="shrink-0 text-[#111110]" />
                ) : (
                  <ChevronRight size={17} strokeWidth={2} className="shrink-0 text-[#71717A]" />
                )}
              </button>
            ))}
          </div>
        ) : (
          <div className="flex flex-col pb-3">
            {nivel > 0 && (
              <button
                type="button"
                onClick={voltar}
                className="mb-2 flex items-center gap-1 self-start rounded-md px-1 py-2 text-[12px] font-bold text-[#52525B] transition-colors active:text-[#111110]"
              >
                <ChevronLeft size={14} strokeWidth={2.5} />
                {caminho[caminho.length - 1]}
              </button>
            )}
            <div className="flex flex-col">
              {opcoesNivel.map((nome) => {
                const caminhoOpcao = [...caminho, nome];
                const textoOpcao  = caminhoOpcao.join(SEPARADOR_CATEGORIA);
                const selecionavel = nivelSaoItensFinal;
                return (
                  <button
                    key={nome}
                    type="button"
                    onClick={() => tocarOpcao(nome)}
                    className="flex items-center justify-between gap-3 rounded-md px-2 py-3 text-left transition-colors active:bg-[#F4F4F3]"
                  >
                    <span className="truncate text-[14px] font-bold text-[#111110]">{nome}</span>
                    {selecionavel ? (
                      value === textoOpcao && <Check size={17} className="shrink-0 text-[#111110]" />
                    ) : (
                      <ChevronRight size={17} strokeWidth={2} className="shrink-0 text-[#71717A]" />
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

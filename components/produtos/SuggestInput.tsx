'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Plus, X } from 'lucide-react';
import { cn } from '@/lib/cn';
import { CORES_SUGERIDAS, resolverHexCor } from '@/lib/cores';

/**
 * Campo de valores de opção (ex: cores, tamanhos) com um painel de
 * sugestões flutuante — aparece já ao tocar no campo vazio, e filtra em
 * tempo real enquanto o vendedor digita, como uma pesquisa rápida sem
 * abrir página separada. Em modo cor, cada sugestão e cada chip mostra
 * uma bolinha da cor real; cores fora da biblioteca sugerida podem ser
 * criadas com um seletor de cor nativo.
 */
export function SuggestInput({
  valores,
  onChange,
  placeholder,
  colorMode = false,
  coresPersonalizadas,
  onSetCorPersonalizada,
}: {
  valores: string[];
  onChange: (v: string[]) => void;
  placeholder: string;
  colorMode?: boolean;
  coresPersonalizadas?: Record<string, string>;
  onSetCorPersonalizada?: (nome: string, hex: string) => void;
}) {
  const [draft, setDraft] = useState('');
  const [open, setOpen] = useState(false);
  const [novaCorHex, setNovaCorHex] = useState('#3B82F6');
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onOutside(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onOutside);
    return () => document.removeEventListener('mousedown', onOutside);
  }, []);

  const biblioteca = useMemo(
    () => (colorMode ? CORES_SUGERIDAS.map((c) => c.nome) : []),
    [colorMode]
  );

  const sugestoes = useMemo(() => {
    const termo = draft.trim().toLowerCase();
    return biblioteca.filter((nome) => !valores.includes(nome) && (!termo || nome.toLowerCase().includes(termo)));
  }, [biblioteca, draft, valores]);

  const correspondeExata = draft.trim() && biblioteca.some((n) => n.toLowerCase() === draft.trim().toLowerCase());

  function adicionar(nome: string, hex?: string) {
    const v = nome.trim();
    if (!v || valores.includes(v)) return;
    onChange([...valores, v]);
    if (colorMode && hex && onSetCorPersonalizada) onSetCorPersonalizada(v, hex);
    setDraft('');
    setNovaCorHex('#3B82F6');
  }

  function remover(v: string) {
    onChange(valores.filter((x) => x !== v));
  }

  return (
    <div ref={wrapRef} className="relative flex flex-col gap-1.5">
      <div className="flex flex-wrap gap-1.5">
        {valores.map((v) => (
          <span
            key={v}
            className="inline-flex h-9 items-center gap-1.5 rounded-full bg-white pl-2.5 pr-2 text-[12px] font-bold text-ink shadow-sm"
          >
            {colorMode && <ColorDot hex={resolverHexCor(v, coresPersonalizadas)} />}
            {v}
            <button type="button" onClick={() => remover(v)} className="text-slate-400 hover:text-slate-700">
              <X size={12} />
            </button>
          </span>
        ))}
        <input
          value={draft}
          onFocus={() => setOpen(true)}
          onChange={(e) => {
            setDraft(e.target.value);
            setOpen(true);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ',') {
              e.preventDefault();
              if (sugestoes[0] && draft.trim() && sugestoes[0].toLowerCase().startsWith(draft.trim().toLowerCase())) {
                adicionar(sugestoes[0], colorMode ? resolverHexCor(sugestoes[0]) : undefined);
              } else if (draft.trim()) {
                adicionar(draft, colorMode ? novaCorHex : undefined);
              }
            }
            if (e.key === 'Escape') setOpen(false);
          }}
          placeholder={placeholder}
          className="h-9 w-28 rounded-full bg-white px-3.5 text-[12px] font-semibold text-ink shadow-sm outline-none placeholder:text-slate-400 focus:ring-2 focus:ring-ink/10"
        />
      </div>

      {open && (
        <div className="absolute left-0 top-[calc(100%+4px)] z-20 max-h-60 w-64 overflow-y-auto rounded-2xl border border-slate-100 bg-white p-1.5 shadow-[0_12px_30px_rgba(15,23,42,0.14)]">
          {sugestoes.length === 0 && !draft.trim() && (
            <p className="px-3 py-2 text-[11px] font-medium text-slate-400">Começa a escrever para pesquisar.</p>
          )}
          {sugestoes.map((nome) => (
            <button
              key={nome}
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => adicionar(nome, colorMode ? resolverHexCor(nome) : undefined)}
              className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-[13px] font-semibold text-ink transition-colors hover:bg-slate-50 active:bg-slate-100"
            >
              {colorMode && <ColorDot hex={resolverHexCor(nome)} />}
              {nome}
            </button>
          ))}

          {draft.trim() && !correspondeExata && (
            <div className="mt-0.5 flex items-center gap-1.5 border-t border-slate-100 px-1.5 pt-1.5">
              {colorMode && (
                <input
                  type="color"
                  value={novaCorHex}
                  onMouseDown={(e) => e.stopPropagation()}
                  onChange={(e) => setNovaCorHex(e.target.value)}
                  className="h-9 w-9 shrink-0 cursor-pointer rounded-lg border border-slate-200 bg-transparent p-0.5"
                  title="Escolher cor"
                />
              )}
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => adicionar(draft, colorMode ? novaCorHex : undefined)}
                className="flex flex-1 items-center gap-1.5 rounded-xl px-3 py-2.5 text-left text-[13px] font-bold text-ink transition-colors hover:bg-slate-50 active:bg-slate-100"
              >
                <Plus size={14} className="shrink-0 text-slate-400" />
                Usar &ldquo;{draft.trim()}&rdquo;
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function ColorDot({ hex }: { hex: string }) {
  return (
    <span
      className={cn('h-4 w-4 shrink-0 rounded-full ring-1 ring-inset ring-black/10')}
      style={{ backgroundColor: hex }}
    />
  );
}

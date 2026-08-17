'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Plus, X } from 'lucide-react';
import { cn } from '@/lib/cn';
import { Checkbox } from '@/components/ui/Checkbox';
import { CORES_SUGERIDAS, resolverHexCor } from '@/lib/cores';

/** Garante que só um painel de sugestões fica aberto de cada vez — sem
 *  isto, dois campos (ex: "Cor" e "Tamanho") podem abrir os painéis um
 *  por cima do outro e o toque do vendedor acerta no campo errado. */
let idAtivo = 0;
const OPEN_EVENT = 'shopyump:suggest-input-open';

/**
 * Campo de valores de opção (ex: cores, tamanhos) com um painel de
 * sugestões flutuante — aparece já ao tocar no campo vazio, e filtra em
 * tempo real enquanto o vendedor digita, como uma pesquisa rápida sem
 * abrir página separada. Abre para cima quando não há espaço por baixo
 * (ecrã pequeno / teclado aberto). Em modo cor mostra sugestões como
 * quadradinhos coloridos; cores fora da biblioteca sugerida podem ser
 * criadas com um seletor de cor nativo.
 */
export function SuggestInput({
  valores,
  onChange,
  placeholder,
  colorMode = false,
  coresPersonalizadas,
  onSetCorPersonalizada,
  sugestoesExtras,
}: {
  valores: string[];
  onChange: (v: string[]) => void;
  placeholder: string;
  colorMode?: boolean;
  coresPersonalizadas?: Record<string, string>;
  onSetCorPersonalizada?: (nome: string, hex: string) => void;
  /** Sugestões prontas para características que não são "Cor" (ex: Tamanho: PP, P, M...). */
  sugestoesExtras?: string[];
}) {
  const [draft, setDraft] = useState('');
  const [open, setOpen] = useState(false);
  const [abrirParaCima, setAbrirParaCima] = useState(false);
  const [novaCorHex, setNovaCorHex] = useState('#3B82F6');
  const wrapRef = useRef<HTMLDivElement>(null);
  const myId = useRef(0);

  useEffect(() => {
    function onOutside(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    }
    function onOtherOpen(e: Event) {
      const detail = (e as CustomEvent<number>).detail;
      if (detail !== myId.current) setOpen(false);
    }
    document.addEventListener('mousedown', onOutside);
    window.addEventListener(OPEN_EVENT, onOtherOpen);
    return () => {
      document.removeEventListener('mousedown', onOutside);
      window.removeEventListener(OPEN_EVENT, onOtherOpen);
    };
  }, []);

  function abrirPainel() {
    idAtivo += 1;
    myId.current = idAtivo;
    window.dispatchEvent(new CustomEvent(OPEN_EVENT, { detail: myId.current }));

    const rect = wrapRef.current?.getBoundingClientRect();
    // Abrir para cima é a prioridade — é o que evita o teclado virtual
    // cortar o painel. Só cai para baixo se o campo estiver mesmo colado
    // ao topo do ecrã, sem espaço nenhum para o painel abrir para cima.
    setAbrirParaCima(!rect || rect.top > 180);
    setOpen(true);
  }

  const biblioteca = useMemo(() => (colorMode ? CORES_SUGERIDAS.map((c) => c.nome) : sugestoesExtras ?? []), [colorMode, sugestoesExtras]);

  // Em modo cor a grelha funciona como uma lista de marcação: mostra a
  // biblioteca inteira (mais cores personalizadas já usadas) e cada
  // quadradinho tem o seu próprio checkbox — marcar adiciona a cor (e já
  // gera as respetivas variantes), desmarcar remove. Fora do modo cor
  // mantém-se uma lista simples que fecha a sugestão ao escolher.
  const opcoesCor = useMemo(() => {
    if (!colorMode) return [];
    const termo = draft.trim().toLowerCase();
    const extras = valores.filter((v) => !biblioteca.includes(v));
    return [...biblioteca, ...extras].filter((nome) => !termo || nome.toLowerCase().includes(termo));
  }, [colorMode, biblioteca, valores, draft]);

  const sugestoes = useMemo(() => {
    if (colorMode) return [];
    const termo = draft.trim().toLowerCase();
    return biblioteca.filter((nome) => !valores.includes(nome) && (!termo || nome.toLowerCase().includes(termo)));
  }, [colorMode, biblioteca, draft, valores]);

  const correspondeExata = draft.trim() && biblioteca.some((n) => n.toLowerCase() === draft.trim().toLowerCase());

  function adicionar(nome: string, hex?: string) {
    const v = nome.trim();
    if (!v || valores.includes(v)) return;
    onChange([...valores, v]);
    if (colorMode && hex && onSetCorPersonalizada) onSetCorPersonalizada(v, hex);
    setDraft('');
    setNovaCorHex('#3B82F6');
  }

  function alternar(nome: string, hex?: string) {
    if (valores.includes(nome)) {
      onChange(valores.filter((x) => x !== nome));
    } else {
      onChange([...valores, nome]);
      if (hex && onSetCorPersonalizada) onSetCorPersonalizada(nome, hex);
    }
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
          onFocus={abrirPainel}
          onChange={(e) => {
            setDraft(e.target.value);
            if (!open) abrirPainel();
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
        <div
          onMouseDown={(e) => e.stopPropagation()}
          className={cn(
            'absolute left-0 z-30 max-h-60 w-72 overflow-y-auto rounded-2xl border border-slate-100 bg-white p-2 shadow-[0_12px_30px_rgba(15,23,42,0.16)]',
            abrirParaCima ? 'bottom-[calc(100%+6px)]' : 'top-[calc(100%+6px)]'
          )}
        >
          {!colorMode && sugestoes.length === 0 && !draft.trim() && biblioteca.length === 0 && (
            <p className="px-2 py-2 text-[11px] font-medium text-slate-400">Começa a escrever para criar um valor.</p>
          )}

          {colorMode ? (
            <div className="flex flex-col gap-0.5">
              {opcoesCor.map((nome) => {
                const marcada = valores.includes(nome);
                return (
                  <div
                    key={nome}
                    role="button"
                    tabIndex={0}
                    onClick={() => alternar(nome, resolverHexCor(nome, coresPersonalizadas))}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        alternar(nome, resolverHexCor(nome, coresPersonalizadas));
                      }
                    }}
                    className={cn(
                      'flex w-full cursor-pointer items-center gap-2.5 rounded-xl px-2.5 py-2.5 text-left transition-colors hover:bg-slate-50 active:bg-slate-100',
                      marcada && 'bg-slate-50'
                    )}
                  >
                    <ColorSquare hex={resolverHexCor(nome, coresPersonalizadas)} size={20} />
                    <span className="flex-1 truncate text-[13px] font-semibold text-ink">{nome}</span>
                    <Checkbox checked={marcada} onChange={() => alternar(nome, resolverHexCor(nome, coresPersonalizadas))} ariaLabel={nome} />
                  </div>
                );
              })}
            </div>
          ) : (
            sugestoes.length > 0 && (
              <div className="flex flex-col gap-0.5">
                {sugestoes.map((nome) => (
                  <button
                    key={nome}
                    type="button"
                    onClick={() => adicionar(nome)}
                    className="flex w-full items-center rounded-xl px-3 py-2.5 text-left text-[13px] font-semibold text-ink transition-colors hover:bg-slate-50 active:bg-slate-100"
                  >
                    {nome}
                  </button>
                ))}
              </div>
            )
          )}

          {draft.trim() && !correspondeExata && (
            <div className="mt-0.5 flex items-center gap-1.5 border-t border-slate-100 p-1.5 pt-1.5">
              {colorMode && (
                <input
                  type="color"
                  value={novaCorHex}
                  onChange={(e) => setNovaCorHex(e.target.value)}
                  className="h-9 w-9 shrink-0 cursor-pointer rounded-lg border border-slate-200 bg-transparent p-0.5"
                  title="Escolher cor"
                />
              )}
              <button
                type="button"
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

/** Quadradinho de cor — mesmo estilo usado nas listagens de produtos, em
 *  vez de texto puro, para selecionar/identificar a cor de um relance. */
export function ColorSquare({ hex, size = 16 }: { hex: string; size?: number }) {
  return (
    <span
      className="shrink-0 rounded-md ring-1 ring-inset ring-black/10"
      style={{ backgroundColor: hex, width: size, height: size }}
    />
  );
}

/** Alias compacto do quadradinho, usado inline junto a texto (chips, linhas de versão). */
export function ColorDot({ hex }: { hex: string }) {
  return <ColorSquare hex={hex} size={16} />;
}

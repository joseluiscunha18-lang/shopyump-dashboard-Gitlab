'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';
import { Sheet } from '@/components/ui/Sheet';
import { SuggestInput, ColorDot } from '@/components/produtos/SuggestInput';
import { gerarVersoes } from '@/lib/variantes';
import { resolverHexCor } from '@/lib/cores';
import { sugestoesParaCaracteristica } from '@/lib/sugestoesOpcao';
import { CARACTERISTICAS_SUGERIDAS } from '@/types/database';
import type { ProdutoOpcaoFilha, ProdutoOpcaoRaiz, ProdutoVersao } from '@/types/database';

export interface VariantesState {
  raiz: ProdutoOpcaoRaiz | null;
  filha: ProdutoOpcaoFilha | null;
  versoes: ProdutoVersao[];
}

/**
 * "Opções do produto" — o vendedor nunca vê a palavra "variante". Define
 * no máximo 2 características (raiz + filha, ex: Cor → Tamanho); os
 * valores da filha podem ser diferentes por valor da raiz, para nunca
 * criar uma versão que o vendedor não disse que existe. As versões
 * resultantes (preço/estoque/peso/imagens) são editadas mais abaixo, em
 * "Versões disponíveis" (StockSection).
 */
export function VariantEditor({
  state,
  onChange,
}: {
  state: VariantesState;
  onChange: (next: VariantesState) => void;
}) {
  const [pickerAlvo, setPickerAlvo] = useState<'raiz' | 'filha' | null>(null);

  function aplicar(raiz: ProdutoOpcaoRaiz | null, filha: ProdutoOpcaoFilha | null) {
    onChange({ raiz, filha, versoes: gerarVersoes(raiz, filha, state.versoes) });
  }

  function escolherCaracteristica(nome: string) {
    if (pickerAlvo === 'raiz') {
      aplicar({ nome, valores: [] }, state.filha);
    } else if (pickerAlvo === 'filha') {
      aplicar(state.raiz, { nome, mesmosValoresParaTodas: true, valoresComuns: [] });
    }
    setPickerAlvo(null);
  }

  function removerRaiz() {
    aplicar(null, state.filha);
  }

  function removerFilha() {
    aplicar(state.raiz, null);
  }

  function setRaizValores(valores: string[]) {
    if (!state.raiz) return;
    aplicar({ ...state.raiz, valores }, state.filha);
  }

  // Marcar/desmarcar uma cor tem de mexer em valores e em cores na mesma
  // atualização — se fossem duas chamadas a aplicar() separadas, a segunda
  // partiria sempre do state.raiz de antes do clique e anulava a primeira.
  function toggleRaizCor(nome: string, hex?: string) {
    if (!state.raiz) return;
    const jaTem = state.raiz.valores.includes(nome);
    const valores = jaTem ? state.raiz.valores.filter((v) => v !== nome) : [...state.raiz.valores, nome];
    const cores = !jaTem && hex ? { ...(state.raiz.cores ?? {}), [nome]: hex } : state.raiz.cores;
    aplicar({ ...state.raiz, valores, cores }, state.filha);
  }

  function setFilhaComum(mesmosValoresParaTodas: boolean) {
    if (!state.filha) return;
    if (mesmosValoresParaTodas) {
      const uniao = Array.from(new Set(Object.values(state.filha.valoresPorRaiz ?? {}).flat()));
      aplicar(state.raiz, { ...state.filha, mesmosValoresParaTodas: true, valoresComuns: uniao });
    } else {
      const valoresPorRaiz = Object.fromEntries(
        (state.raiz?.valores ?? []).map((v) => [v, [...(state.filha!.valoresComuns ?? [])]])
      );
      aplicar(state.raiz, { ...state.filha, mesmosValoresParaTodas: false, valoresPorRaiz });
    }
  }

  function setFilhaComuns(valores: string[]) {
    if (!state.filha) return;
    aplicar(state.raiz, { ...state.filha, valoresComuns: valores });
  }

  function setFilhaPorRaiz(raizValor: string, valores: string[]) {
    if (!state.filha) return;
    aplicar(state.raiz, {
      ...state.filha,
      valoresPorRaiz: { ...(state.filha.valoresPorRaiz ?? {}), [raizValor]: valores },
    });
  }

  function toggleFilhaComumCor(nome: string, hex?: string) {
    if (!state.filha) return;
    const atuais = state.filha.valoresComuns ?? [];
    const jaTem = atuais.includes(nome);
    const valoresComuns = jaTem ? atuais.filter((v) => v !== nome) : [...atuais, nome];
    const cores = !jaTem && hex ? { ...(state.filha.cores ?? {}), [nome]: hex } : state.filha.cores;
    aplicar(state.raiz, { ...state.filha, valoresComuns, cores });
  }

  function toggleFilhaPorRaizCor(raizValor: string, nome: string, hex?: string) {
    if (!state.filha) return;
    const atuais = state.filha.valoresPorRaiz?.[raizValor] ?? [];
    const jaTem = atuais.includes(nome);
    const valores = jaTem ? atuais.filter((v) => v !== nome) : [...atuais, nome];
    const cores = !jaTem && hex ? { ...(state.filha.cores ?? {}), [nome]: hex } : state.filha.cores;
    aplicar(state.raiz, {
      ...state.filha,
      valoresPorRaiz: { ...(state.filha.valoresPorRaiz ?? {}), [raizValor]: valores },
      cores,
    });
  }

  const podeMostrarToggle = (state.raiz?.valores.length ?? 0) >= 2;
  const raizECor = state.raiz?.nome === 'Cor';
  const filhaECor = state.filha?.nome === 'Cor';

  return (
    <div>
      <div className="mb-1 pl-1">
        <h3 className="text-[13px] font-black text-ink">Opções do produto</h3>
        <p className="text-[11px] font-medium text-slate-400">
          Diz quais versões deste produto vendes — nenhuma opção é obrigatória.
        </p>
      </div>

      <div className="mt-3 flex flex-col gap-3">
        {!state.raiz && (
          <button
            type="button"
            onClick={() => setPickerAlvo('raiz')}
            className="flex items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-slate-200 py-3.5 text-[12px] font-bold text-slate-500 transition-colors hover:border-slate-300 hover:text-ink active:scale-[0.99]"
          >
            <Plus size={15} /> Adicionar opção
          </button>
        )}

        {state.raiz && (
          <div className="rounded-2xl border border-slate-100 bg-slate-50/60 p-3.5">
            <div className="mb-2.5 flex items-center justify-between">
              <span className="text-[11px] font-black uppercase tracking-widest text-slate-500">{state.raiz.nome}</span>
              <button type="button" onClick={removerRaiz} className="text-[11px] font-bold text-slate-400 hover:text-red-500">
                Remover
              </button>
            </div>
            <SuggestInput
              key={`raiz-${state.raiz.nome}`}
              valores={state.raiz.valores}
              onChange={setRaizValores}
              placeholder={`+ ${state.raiz.nome}`}
              colorMode={raizECor}
              coresPersonalizadas={state.raiz.cores}
              onToggleCor={toggleRaizCor}
              sugestoesExtras={raizECor ? undefined : sugestoesParaCaracteristica(state.raiz.nome)}
            />
          </div>
        )}

        {state.raiz && !state.filha && (
          <button
            type="button"
            onClick={() => setPickerAlvo('filha')}
            className="flex items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-slate-200 py-3.5 text-[12px] font-bold text-slate-500 transition-colors hover:border-slate-300 hover:text-ink active:scale-[0.99]"
          >
            <Plus size={15} /> Adicionar outra característica (opcional)
          </button>
        )}

        {state.filha && (
          <div className="rounded-2xl border border-slate-100 bg-slate-50/60 p-3.5">
            <div className="mb-2.5 flex items-center justify-between">
              <span className="text-[11px] font-black uppercase tracking-widest text-slate-500">{state.filha.nome}</span>
              <button type="button" onClick={removerFilha} className="text-[11px] font-bold text-slate-400 hover:text-red-500">
                Remover
              </button>
            </div>

            {state.filha.nome === 'Género' && (
              <p className="mb-2.5 text-[10px] font-medium text-amber-600">
                Normalmente o género é definido em "Para quem é este produto?" acima e não cria versões — só usa
                isto se este produto tiver mesmo versões diferentes por género.
              </p>
            )}

            {podeMostrarToggle && (
              <div className="mb-3">
                <p className="mb-1.5 text-[11px] font-semibold text-slate-500">
                  Os valores de {state.filha.nome} são iguais para todas as {state.raiz?.nome}?
                </p>
                <div className="flex gap-1.5">
                  <button
                    type="button"
                    onClick={() => setFilhaComum(true)}
                    className={pillClass(state.filha.mesmosValoresParaTodas)}
                  >
                    Sim
                  </button>
                  <button
                    type="button"
                    onClick={() => setFilhaComum(false)}
                    className={pillClass(!state.filha.mesmosValoresParaTodas)}
                  >
                    Não, cada {state.raiz?.nome.toLowerCase()} tem os seus
                  </button>
                </div>
              </div>
            )}

            {state.filha.mesmosValoresParaTodas || !podeMostrarToggle ? (
              <SuggestInput
                key={`filha-${state.filha.nome}`}
                valores={state.filha.valoresComuns ?? []}
                onChange={setFilhaComuns}
                placeholder={`+ ${state.filha.nome}`}
                colorMode={filhaECor}
                coresPersonalizadas={state.filha.cores}
                onToggleCor={toggleFilhaComumCor}
                sugestoesExtras={filhaECor ? undefined : sugestoesParaCaracteristica(state.filha.nome)}
              />
            ) : (
              <div className="flex flex-col gap-2.5">
                {(state.raiz?.valores ?? []).map((raizValor) => (
                  <div key={raizValor}>
                    <p className="mb-1 flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-slate-400">
                      {raizECor && <ColorDot hex={resolverHexCor(raizValor, state.raiz?.cores)} />}
                      {raizValor}
                    </p>
                    <SuggestInput
                      key={`filha-${state.filha!.nome}-${raizValor}`}
                      valores={state.filha!.valoresPorRaiz?.[raizValor] ?? []}
                      onChange={(v) => setFilhaPorRaiz(raizValor, v)}
                      placeholder={`+ ${state.filha!.nome}`}
                      colorMode={filhaECor}
                      coresPersonalizadas={state.filha!.cores}
                      onToggleCor={(nome, hex) => toggleFilhaPorRaizCor(raizValor, nome, hex)}
                      sugestoesExtras={filhaECor ? undefined : sugestoesParaCaracteristica(state.filha!.nome)}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <Sheet open={pickerAlvo !== null} onClose={() => setPickerAlvo(null)} title="Qual característica diferencia o produto?">
        <CaracteristicaPicker
          excluir={pickerAlvo === 'filha' && state.raiz ? state.raiz.nome : undefined}
          onPick={escolherCaracteristica}
        />
      </Sheet>
    </div>
  );
}

function pillClass(active: boolean) {
  return [
    'rounded-full px-3.5 py-2 text-[11px] font-bold transition-colors',
    active ? 'bg-ink text-white' : 'bg-white text-slate-500 shadow-sm',
  ].join(' ');
}

function CaracteristicaPicker({ excluir, onPick }: { excluir?: string; onPick: (nome: string) => void }) {
  const [outraAberta, setOutraAberta] = useState(false);
  const [outraTexto, setOutraTexto] = useState('');

  const opcoes = CARACTERISTICAS_SUGERIDAS.filter((n) => n !== excluir);

  return (
    <div className="flex flex-col gap-1.5 pb-4">
      {opcoes.map((nome) => (
        <button
          key={nome}
          type="button"
          onClick={() => onPick(nome)}
          className="rounded-2xl px-3 py-3.5 text-left text-[13px] font-bold text-ink transition-colors active:bg-slate-50"
        >
          {nome}
        </button>
      ))}

      {!outraAberta ? (
        <button
          type="button"
          onClick={() => setOutraAberta(true)}
          className="rounded-2xl px-3 py-3.5 text-left text-[13px] font-bold text-slate-500 transition-colors active:bg-slate-50"
        >
          Outra…
        </button>
      ) : (
        <div className="flex items-center gap-2 px-3 py-2">
          <input
            autoFocus
            value={outraTexto}
            onChange={(e) => setOutraTexto(e.target.value)}
            placeholder="Ex: Sabor"
            className="h-10 flex-1 rounded-xl bg-slate-50 px-3 text-[13px] font-semibold text-ink outline-none focus:ring-2 focus:ring-ink/10"
          />
          <button
            type="button"
            disabled={!outraTexto.trim()}
            onClick={() => onPick(outraTexto.trim())}
            className="h-10 shrink-0 rounded-xl bg-ink px-3.5 text-[12px] font-bold text-white disabled:opacity-40"
          >
            Adicionar
          </button>
        </div>
      )}
    </div>
  );
}



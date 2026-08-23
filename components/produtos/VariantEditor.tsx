'use client';

import { useEffect, useState } from 'react';
import { Plus, Sparkles } from 'lucide-react';
import { Sheet } from '@/components/ui/Sheet';
import { SuggestInput, ColorDot } from '@/components/produtos/SuggestInput';
import { combinacoesRaizFilha, fundirVersoesPorValor, gerarVersoes } from '@/lib/variantes';
import { resolverHexCor } from '@/lib/cores';
import { sugestoesParaCaracteristica } from '@/lib/sugestoesOpcao';
import { aplicarFusaoGenero, avaliarValoresGenero, ehCaracteristicaGenero } from '@/lib/genero';
import { CARACTERISTICAS_SUGERIDAS } from '@/types/database';
import type { ProdutoOpcaoFilha, ProdutoOpcaoNeta, ProdutoOpcaoRaiz, ProdutoVersao } from '@/types/database';

export interface VariantesState {
  raiz: ProdutoOpcaoRaiz | null;
  filha: ProdutoOpcaoFilha | null;
  neta: ProdutoOpcaoNeta | null;
  versoes: ProdutoVersao[];
  /** Imagens por valor de característica (ex: foto de "Vermelho" herdada
   *  por todas as versões vermelhas) — editadas em StockSection, não
   *  aqui, mas o estado vive junto do resto das "Opções do produto"
   *  porque uma fusão de género também tem de fundir estas imagens. Ver
   *  `imagensParaVersao()` em lib/variantes.ts. */
  imagensPorCaracteristica?: Record<string, Record<string, string[]>>;
}

/**
 * "Opções do produto" — o vendedor nunca vê a palavra "variante". Define
 * no máximo 3 características (raiz → filha → neta, ex: Cor → Material →
 * Tamanho); os valores de cada nível podem ser diferentes por combinação
 * do(s) nível(eis) acima, para nunca criar uma versão que o vendedor não
 * disse que existe. As versões resultantes (preço/estoque/peso/imagens)
 * são editadas mais abaixo, em "Versões disponíveis" (StockSection).
 */
export function VariantEditor({
  state,
  onChange,
}: {
  state: VariantesState;
  onChange: (next: VariantesState) => void;
}) {
  const [pickerAlvo, setPickerAlvo] = useState<'raiz' | 'filha' | 'neta' | null>(null);

  function aplicar(raiz: ProdutoOpcaoRaiz | null, filha: ProdutoOpcaoFilha | null, neta: ProdutoOpcaoNeta | null) {
    onChange({
      raiz,
      filha,
      neta,
      versoes: gerarVersoes(raiz, filha, neta, state.versoes),
      imagensPorCaracteristica: state.imagensPorCaracteristica,
    });
  }

  function escolherCaracteristica(nome: string) {
    if (pickerAlvo === 'raiz') {
      aplicar({ nome, valores: [] }, state.filha, state.neta);
    } else if (pickerAlvo === 'filha') {
      aplicar(state.raiz, { nome, mesmosValoresParaTodas: true, valoresComuns: [] }, state.neta);
    } else if (pickerAlvo === 'neta') {
      aplicar(state.raiz, state.filha, { nome, mesmosValoresParaTodas: true, valoresComuns: [] });
    }
    setPickerAlvo(null);
  }

  // Remover um nível arrasta consigo os níveis abaixo — os valores destes
  // dependem sempre da combinação dos níveis acima, por isso deixam de
  // fazer sentido sozinhos.
  function removerRaiz() {
    aplicar(null, state.filha, null);
  }

  function removerFilha() {
    aplicar(state.raiz, null, null);
  }

  function removerNeta() {
    aplicar(state.raiz, state.filha, null);
  }

  function setRaizValores(valores: string[]) {
    if (!state.raiz) return;
    aplicar({ ...state.raiz, valores }, state.filha, state.neta);
  }

  // Marcar/desmarcar uma cor tem de mexer em valores e em cores na mesma
  // atualização — se fossem duas chamadas a aplicar() separadas, a segunda
  // partiria sempre do state.raiz de antes do clique e anulava a primeira.
  function toggleRaizCor(nome: string, hex?: string) {
    if (!state.raiz) return;
    const jaTem = state.raiz.valores.includes(nome);
    const valores = jaTem ? state.raiz.valores.filter((v) => v !== nome) : [...state.raiz.valores, nome];
    const cores = !jaTem && hex ? { ...(state.raiz.cores ?? {}), [nome]: hex } : state.raiz.cores;
    aplicar({ ...state.raiz, valores, cores }, state.filha, state.neta);
  }

  function setFilhaComum(mesmosValoresParaTodas: boolean) {
    if (!state.filha) return;
    if (mesmosValoresParaTodas) {
      const uniao = Array.from(new Set(Object.values(state.filha.valoresPorRaiz ?? {}).flat()));
      aplicar(state.raiz, { ...state.filha, mesmosValoresParaTodas: true, valoresComuns: uniao }, state.neta);
    } else {
      const valoresPorRaiz = Object.fromEntries(
        (state.raiz?.valores ?? []).map((v) => [v, [...(state.filha!.valoresComuns ?? [])]])
      );
      aplicar(state.raiz, { ...state.filha, mesmosValoresParaTodas: false, valoresPorRaiz }, state.neta);
    }
  }

  function setFilhaComuns(valores: string[]) {
    if (!state.filha) return;
    aplicar(state.raiz, { ...state.filha, valoresComuns: valores }, state.neta);
  }

  function setFilhaPorRaiz(raizValor: string, valores: string[]) {
    if (!state.filha) return;
    aplicar(
      state.raiz,
      { ...state.filha, valoresPorRaiz: { ...(state.filha.valoresPorRaiz ?? {}), [raizValor]: valores } },
      state.neta
    );
  }

  function toggleFilhaComumCor(nome: string, hex?: string) {
    if (!state.filha) return;
    const atuais = state.filha.valoresComuns ?? [];
    const jaTem = atuais.includes(nome);
    const valoresComuns = jaTem ? atuais.filter((v) => v !== nome) : [...atuais, nome];
    const cores = !jaTem && hex ? { ...(state.filha.cores ?? {}), [nome]: hex } : state.filha.cores;
    aplicar(state.raiz, { ...state.filha, valoresComuns, cores }, state.neta);
  }

  function toggleFilhaPorRaizCor(raizValor: string, nome: string, hex?: string) {
    if (!state.filha) return;
    const atuais = state.filha.valoresPorRaiz?.[raizValor] ?? [];
    const jaTem = atuais.includes(nome);
    const valores = jaTem ? atuais.filter((v) => v !== nome) : [...atuais, nome];
    const cores = !jaTem && hex ? { ...(state.filha.cores ?? {}), [nome]: hex } : state.filha.cores;
    aplicar(
      state.raiz,
      { ...state.filha, valoresPorRaiz: { ...(state.filha.valoresPorRaiz ?? {}), [raizValor]: valores }, cores },
      state.neta
    );
  }

  // --- Neta (3ª característica) — mesmo padrão da filha, mas os valores
  // "por combinação" usam a chave "raizValor / filhaValor" em vez de só
  // o valor da raiz, porque dependem dos dois níveis acima.
  function setNetaComum(mesmosValoresParaTodas: boolean) {
    if (!state.neta) return;
    if (mesmosValoresParaTodas) {
      const uniao = Array.from(new Set(Object.values(state.neta.valoresPorCombinacao ?? {}).flat()));
      aplicar(state.raiz, state.filha, { ...state.neta, mesmosValoresParaTodas: true, valoresComuns: uniao });
    } else {
      const combos = combinacoesRaizFilha(state.raiz, state.filha);
      const valoresPorCombinacao = Object.fromEntries(
        combos.map((c) => [c.chave, [...(state.neta!.valoresComuns ?? [])]])
      );
      aplicar(state.raiz, state.filha, { ...state.neta, mesmosValoresParaTodas: false, valoresPorCombinacao });
    }
  }

  function setNetaComuns(valores: string[]) {
    if (!state.neta) return;
    aplicar(state.raiz, state.filha, { ...state.neta, valoresComuns: valores });
  }

  function setNetaPorCombinacao(chave: string, valores: string[]) {
    if (!state.neta) return;
    aplicar(state.raiz, state.filha, {
      ...state.neta,
      valoresPorCombinacao: { ...(state.neta.valoresPorCombinacao ?? {}), [chave]: valores },
    });
  }

  function toggleNetaComumCor(nome: string, hex?: string) {
    if (!state.neta) return;
    const atuais = state.neta.valoresComuns ?? [];
    const jaTem = atuais.includes(nome);
    const valoresComuns = jaTem ? atuais.filter((v) => v !== nome) : [...atuais, nome];
    const cores = !jaTem && hex ? { ...(state.neta.cores ?? {}), [nome]: hex } : state.neta.cores;
    aplicar(state.raiz, state.filha, { ...state.neta, valoresComuns, cores });
  }

  function toggleNetaPorCombinacaoCor(chave: string, nome: string, hex?: string) {
    if (!state.neta) return;
    const atuais = state.neta.valoresPorCombinacao?.[chave] ?? [];
    const jaTem = atuais.includes(nome);
    const valores = jaTem ? atuais.filter((v) => v !== nome) : [...atuais, nome];
    const cores = !jaTem && hex ? { ...(state.neta.cores ?? {}), [nome]: hex } : state.neta.cores;
    aplicar(state.raiz, state.filha, {
      ...state.neta,
      valoresPorCombinacao: { ...(state.neta.valoresPorCombinacao ?? {}), [chave]: valores },
      cores,
    });
  }

  const podeMostrarToggleFilha = (state.raiz?.valores.length ?? 0) >= 2;
  const combosRaizFilha = combinacoesRaizFilha(state.raiz, state.filha);
  const podeMostrarToggleNeta = combosRaizFilha.length >= 2;
  const raizECor = state.raiz?.nome === 'Cor';
  const filhaECor = state.filha?.nome === 'Cor';
  const netaECor = state.neta?.nome === 'Cor';

  // --- Fusão de Género (Masculino + Feminino → Unissexo) -------------
  //
  // "Género" pode viver na raiz, na filha ou na neta, e dentro da filha/
  // neta os valores podem ser globais (`mesmosValoresParaTodas`) ou
  // diferentes por combinação acima (`valoresPorRaiz` / `valoresPorCombinacao`).
  // `gruposGenero` normaliza tudo isso numa lista plana de "grupos" — cada
  // grupo é uma lista de valores independente que pode precisar de fusão —
  // para o resto da lógica não ter de saber em que nível o género está.
  type GrupoGenero = { chave: string; label: string; valores: string[] };

  function gruposGenero(): GrupoGenero[] {
    if (state.raiz && ehCaracteristicaGenero(state.raiz.nome)) {
      return [{ chave: 'raiz', label: state.raiz.nome, valores: state.raiz.valores }];
    }
    if (state.filha && ehCaracteristicaGenero(state.filha.nome)) {
      if (state.filha.mesmosValoresParaTodas || !podeMostrarToggleFilha) {
        return [{ chave: 'filha', label: state.filha.nome, valores: state.filha.valoresComuns ?? [] }];
      }
      return (state.raiz?.valores ?? []).map((raizValor) => ({
        chave: `filha:${raizValor}`,
        label: `${state.filha!.nome} · ${raizValor}`,
        valores: state.filha!.valoresPorRaiz?.[raizValor] ?? [],
      }));
    }
    if (state.neta && ehCaracteristicaGenero(state.neta.nome)) {
      if (state.neta.mesmosValoresParaTodas || !podeMostrarToggleNeta) {
        return [{ chave: 'neta', label: state.neta.nome, valores: state.neta.valoresComuns ?? [] }];
      }
      return combosRaizFilha.map((combo) => ({
        chave: `neta:${combo.chave}`,
        label: `${state.neta!.nome} · ${combo.raizValor} · ${combo.filhaValor}`,
        valores: state.neta!.valoresPorCombinacao?.[combo.chave] ?? [],
      }));
    }
    return [];
  }

  const grupos = gruposGenero();
  const gruposParaColapsar = grupos.filter((g) => avaliarValoresGenero(g.valores) === 'colapsar');
  const gruposParaFundir = grupos.filter((g) => avaliarValoresGenero(g.valores) === 'fundir');
  const assinaturaFundir = gruposParaFundir.map((g) => `${g.chave}:${[...g.valores].sort().join(',')}`).join('|');

  const [fusaoDispensada, setFusaoDispensada] = useState<string | null>(null);

  // Aplica "Unissexo" aos grupos indicados: funde as versões existentes
  // (soma estoque, une imagens) e só depois regenera a árvore, para nunca
  // apagar dados só porque a chave da combinação mudou.
  function aplicarUnissexoAosGrupos(alvo: GrupoGenero[]) {
    const nomeCaracteristica = state.raiz && ehCaracteristicaGenero(state.raiz.nome)
      ? state.raiz.nome
      : state.filha && ehCaracteristicaGenero(state.filha.nome)
        ? state.filha.nome
        : state.neta?.nome;
    if (!nomeCaracteristica) return;

    const versoesFundidas = fundirVersoesPorValor(
      nomeCaracteristica,
      ['Masculino', 'Feminino', 'Unissexo'],
      'Unissexo',
      state.versoes
    );

    const chavesAlvo = new Set(alvo.map((g) => g.chave));
    let novoRaiz = state.raiz;
    let novoFilha = state.filha;
    let novoNeta = state.neta;

    if (state.raiz && ehCaracteristicaGenero(state.raiz.nome) && chavesAlvo.has('raiz')) {
      novoRaiz = { ...state.raiz, valores: aplicarFusaoGenero(state.raiz.valores) };
    } else if (state.filha && ehCaracteristicaGenero(state.filha.nome)) {
      if (chavesAlvo.has('filha')) {
        novoFilha = { ...state.filha, valoresComuns: aplicarFusaoGenero(state.filha.valoresComuns ?? []) };
      } else {
        const valoresPorRaiz = { ...(state.filha.valoresPorRaiz ?? {}) };
        for (const raizValor of Object.keys(valoresPorRaiz)) {
          if (chavesAlvo.has(`filha:${raizValor}`)) {
            valoresPorRaiz[raizValor] = aplicarFusaoGenero(valoresPorRaiz[raizValor]);
          }
        }
        novoFilha = { ...state.filha, valoresPorRaiz };
      }
    } else if (state.neta && ehCaracteristicaGenero(state.neta.nome)) {
      if (chavesAlvo.has('neta')) {
        novoNeta = { ...state.neta, valoresComuns: aplicarFusaoGenero(state.neta.valoresComuns ?? []) };
      } else {
        const valoresPorCombinacao = { ...(state.neta.valoresPorCombinacao ?? {}) };
        for (const chave of Object.keys(valoresPorCombinacao)) {
          if (chavesAlvo.has(`neta:${chave}`)) {
            valoresPorCombinacao[chave] = aplicarFusaoGenero(valoresPorCombinacao[chave]);
          }
        }
        novoNeta = { ...state.neta, valoresPorCombinacao };
      }
    }

    // Se a característica de género também tiver imagens por valor
    // definidas (ex: uma foto genérica para "Masculino"), funde-as da
    // mesma forma que as versões — Unissexo herda a primeira que existir.
    const imagensDoNivel = state.imagensPorCaracteristica?.[nomeCaracteristica];
    const imagensPorCaracteristica = imagensDoNivel
      ? {
          ...state.imagensPorCaracteristica,
          [nomeCaracteristica]: {
            ...Object.fromEntries(
              Object.entries(imagensDoNivel).filter(([v]) => !['Masculino', 'Feminino', 'Unissexo'].includes(v))
            ),
            Unissexo: imagensDoNivel.Unissexo ?? imagensDoNivel.Masculino ?? imagensDoNivel.Feminino ?? [],
          },
        }
      : state.imagensPorCaracteristica;

    onChange({
      raiz: novoRaiz,
      filha: novoFilha,
      neta: novoNeta,
      versoes: gerarVersoes(novoRaiz, novoFilha, novoNeta, versoesFundidas),
      imagensPorCaracteristica,
    });
  }

  // Masculino + Feminino + Unissexo em simultâneo nunca é ambíguo — corta
  // direto, sem interromper o lojista com uma pergunta cuja resposta só
  // pode ser "sim".
  useEffect(() => {
    if (gruposParaColapsar.length > 0) {
      aplicarUnissexoAosGrupos(gruposParaColapsar);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gruposParaColapsar.length > 0]);

  return (
    <div>
      <p className="mb-3 pl-1 text-[12px] font-medium text-[#8A8681]">
        Diz quais versões deste produto vendes — nenhuma opção é obrigatória.
      </p>

      <div className="flex flex-col gap-3">
        {gruposParaFundir.length > 0 && assinaturaFundir !== fusaoDispensada && (
          <div className="rounded-md border border-amber-200 bg-amber-50 p-3.5">
            <div className="mb-2.5 flex items-start gap-2">
              <Sparkles size={15} className="mt-0.5 shrink-0 text-amber-500" />
              <p className="text-[12px] font-semibold leading-snug text-amber-800">
                Este produto está disponível para masculino e feminino. Podemos tratar como Unissexo para
                simplificar as versões — o estoque de cada uma é somado, nada se perde.
              </p>
            </div>
            <div className="flex gap-1.5">
              <button
                type="button"
                onClick={() => {
                  aplicarUnissexoAosGrupos(gruposParaFundir);
                  setFusaoDispensada(null);
                }}
                className="rounded-full bg-ink px-3.5 py-2 text-[11px] font-bold text-white transition-colors active:scale-[0.98]"
              >
                Usar Unissexo
              </button>
              <button
                type="button"
                onClick={() => setFusaoDispensada(assinaturaFundir)}
                className="rounded-full bg-white px-3.5 py-2 text-[11px] font-bold text-amber-700 shadow-sm transition-colors active:scale-[0.98]"
              >
                Manter separados
              </button>
            </div>
          </div>
        )}

        {!state.raiz && (
          <button
            type="button"
            onClick={() => setPickerAlvo('raiz')}
            className="flex items-center justify-center gap-2 rounded-md border-2 border-dashed border-[#D4D2CF] py-3.5 text-[12px] font-bold text-[#71717A] transition-colors hover:border-[#B8B5B1] hover:text-ink active:scale-[0.99]"
          >
            <Plus size={15} /> Adicionar opção
          </button>
        )}

        {state.raiz && (
          <div className="rounded-md border border-[#E5E3E0] bg-[#F4F4F3]/70 p-3.5">
            <div className="mb-2.5 flex items-center justify-between">
              <span className="text-[11px] font-black uppercase tracking-widest text-[#71717A]">{state.raiz.nome}</span>
              <button type="button" onClick={removerRaiz} className="text-[11px] font-bold text-[#8A8681] hover:text-red-500">
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
            className="flex items-center justify-center gap-2 rounded-md border-2 border-dashed border-[#D4D2CF] py-3.5 text-[12px] font-bold text-[#71717A] transition-colors hover:border-[#B8B5B1] hover:text-ink active:scale-[0.99]"
          >
            <Plus size={15} /> Adicionar outra característica (opcional)
          </button>
        )}

        {state.filha && (
          <div className="rounded-md border border-[#E5E3E0] bg-[#F4F4F3]/70 p-3.5">
            <div className="mb-2.5 flex items-center justify-between">
              <span className="text-[11px] font-black uppercase tracking-widest text-[#71717A]">{state.filha.nome}</span>
              <button type="button" onClick={removerFilha} className="text-[11px] font-bold text-[#8A8681] hover:text-red-500">
                Remover
              </button>
            </div>

            {state.filha.nome === 'Género' && (
              <p className="mb-2.5 text-[10px] font-medium text-amber-600">
                Normalmente o género é definido em "Para quem é este produto?" acima e não cria versões — só usa
                isto se este produto tiver mesmo versões diferentes por género.
              </p>
            )}

            {podeMostrarToggleFilha && (
              <div className="mb-3">
                <p className="mb-1.5 text-[11px] font-semibold text-[#71717A]">
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

            {state.filha.mesmosValoresParaTodas || !podeMostrarToggleFilha ? (
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
                    <p className="mb-1 flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-[#8A8681]">
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

        {state.raiz && state.filha && !state.neta && (
          <button
            type="button"
            onClick={() => setPickerAlvo('neta')}
            className="flex items-center justify-center gap-2 rounded-md border-2 border-dashed border-[#D4D2CF] py-3.5 text-[12px] font-bold text-[#71717A] transition-colors hover:border-[#B8B5B1] hover:text-ink active:scale-[0.99]"
          >
            <Plus size={15} /> Adicionar mais uma característica (opcional)
          </button>
        )}

        {state.neta && (
          <div className="rounded-md border border-[#E5E3E0] bg-[#F4F4F3]/70 p-3.5">
            <div className="mb-2.5 flex items-center justify-between">
              <span className="text-[11px] font-black uppercase tracking-widest text-[#71717A]">{state.neta.nome}</span>
              <button type="button" onClick={removerNeta} className="text-[11px] font-bold text-[#8A8681] hover:text-red-500">
                Remover
              </button>
            </div>

            {podeMostrarToggleNeta && (
              <div className="mb-3">
                <p className="mb-1.5 text-[11px] font-semibold text-[#71717A]">
                  Os valores de {state.neta.nome} são iguais para todas as combinações de {state.raiz?.nome} +{' '}
                  {state.filha?.nome}?
                </p>
                <div className="flex gap-1.5">
                  <button type="button" onClick={() => setNetaComum(true)} className={pillClass(state.neta.mesmosValoresParaTodas)}>
                    Sim
                  </button>
                  <button
                    type="button"
                    onClick={() => setNetaComum(false)}
                    className={pillClass(!state.neta.mesmosValoresParaTodas)}
                  >
                    Não, cada combinação tem os seus
                  </button>
                </div>
              </div>
            )}

            {state.neta.mesmosValoresParaTodas || !podeMostrarToggleNeta ? (
              <SuggestInput
                key={`neta-${state.neta.nome}`}
                valores={state.neta.valoresComuns ?? []}
                onChange={setNetaComuns}
                placeholder={`+ ${state.neta.nome}`}
                colorMode={netaECor}
                coresPersonalizadas={state.neta.cores}
                onToggleCor={toggleNetaComumCor}
                sugestoesExtras={netaECor ? undefined : sugestoesParaCaracteristica(state.neta.nome)}
              />
            ) : (
              <div className="flex flex-col gap-2.5">
                {combosRaizFilha.map((combo) => (
                  <div key={combo.chave}>
                    <p className="mb-1 flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-[#8A8681]">
                      {raizECor && <ColorDot hex={resolverHexCor(combo.raizValor, state.raiz?.cores)} />}
                      {filhaECor && <ColorDot hex={resolverHexCor(combo.filhaValor, state.filha?.cores)} />}
                      {combo.raizValor} · {combo.filhaValor}
                    </p>
                    <SuggestInput
                      key={`neta-${state.neta!.nome}-${combo.chave}`}
                      valores={state.neta!.valoresPorCombinacao?.[combo.chave] ?? []}
                      onChange={(v) => setNetaPorCombinacao(combo.chave, v)}
                      placeholder={`+ ${state.neta!.nome}`}
                      colorMode={netaECor}
                      coresPersonalizadas={state.neta!.cores}
                      onToggleCor={(nome, hex) => toggleNetaPorCombinacaoCor(combo.chave, nome, hex)}
                      sugestoesExtras={netaECor ? undefined : sugestoesParaCaracteristica(state.neta!.nome)}
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
          excluir={
            pickerAlvo === 'filha' && state.raiz
              ? [state.raiz.nome]
              : pickerAlvo === 'neta'
                ? [state.raiz?.nome, state.filha?.nome].filter((n): n is string => !!n)
                : []
          }
          onPick={escolherCaracteristica}
        />
      </Sheet>
    </div>
  );
}

function pillClass(active: boolean) {
  return [
    'rounded-full px-3.5 py-2 text-[11px] font-bold transition-colors',
    active ? 'bg-ink text-white' : 'bg-white text-[#71717A] shadow-sm',
  ].join(' ');
}

function CaracteristicaPicker({ excluir, onPick }: { excluir?: string[]; onPick: (nome: string) => void }) {
  const [outraAberta, setOutraAberta] = useState(false);
  const [outraTexto, setOutraTexto] = useState('');

  const opcoes = CARACTERISTICAS_SUGERIDAS.filter((n) => !excluir?.includes(n));

  return (
    <div className="flex flex-col gap-1.5 pb-4">
      {opcoes.map((nome) => (
        <button
          key={nome}
          type="button"
          onClick={() => onPick(nome)}
          className="rounded-md px-3 py-3.5 text-left text-[13px] font-bold text-ink transition-colors active:bg-[#F4F4F3]"
        >
          {nome}
        </button>
      ))}

      {!outraAberta ? (
        <button
          type="button"
          onClick={() => setOutraAberta(true)}
          className="rounded-md px-3 py-3.5 text-left text-[13px] font-bold text-[#71717A] transition-colors active:bg-[#F4F4F3]"
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
            className="h-10 flex-1 rounded-md bg-[#F4F4F3] px-3 text-[13px] font-semibold text-ink outline-none focus:ring-2 focus:ring-ink/10"
          />
          <button
            type="button"
            disabled={!outraTexto.trim()}
            onClick={() => onPick(outraTexto.trim())}
            className="h-10 shrink-0 rounded-md bg-ink px-3.5 text-[12px] font-bold text-white disabled:opacity-40"
          >
            Adicionar
          </button>
        </div>
      )}
    </div>
  );
}

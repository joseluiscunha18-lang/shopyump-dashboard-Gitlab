'use client';

import { useState } from 'react';
import { Plus, X } from 'lucide-react';
import { Sheet } from '@/components/ui/Sheet';
import { gerarCombinacoes } from '@/lib/variantes';
import { OPCOES_VARIANTE_DISPONIVEIS } from '@/types/database';
import type { NomeOpcaoVariante, ProdutoCombinacao, ProdutoOpcao } from '@/types/database';

const PLACEHOLDERS: Record<NomeOpcaoVariante, string> = {
  Cor: 'Ex: Preto',
  Tamanho: 'Ex: M',
  Género: 'Ex: Unissexo',
};

export interface VariantesState {
  opcoes: ProdutoOpcao[];
  combinacoes: ProdutoCombinacao[];
}

/**
 * Só define as opções (Cor, Tamanho, Género) e os seus valores — o que
 * gera as combinações. Nenhuma opção é obrigatória: um produto pode ter
 * só Cor, só Tamanho, ou nenhuma opção (fica sem variantes). Preço, peso,
 * estoque e imagens pertencem à combinação final, não a um valor
 * isolado — ver StockSection.
 */
export function VariantEditor({
  state,
  onChange,
}: {
  state: VariantesState;
  onChange: (next: VariantesState) => void;
}) {
  const [pickerOpen, setPickerOpen] = useState(false);

  const disponiveis = OPCOES_VARIANTE_DISPONIVEIS.filter((n) => !state.opcoes.some((o) => o.nome === n));

  function addOpcao(nome: NomeOpcaoVariante) {
    const opcoes = [...state.opcoes, { nome, valores: [] }];
    onChange({ ...state, opcoes });
    setPickerOpen(false);
  }

  function removeOpcao(nome: string) {
    const opcoes = state.opcoes.filter((o) => o.nome !== nome);
    const combinacoes = gerarCombinacoes(opcoes, state.combinacoes);
    onChange({ opcoes, combinacoes });
  }

  function setValores(nome: string, valores: string[]) {
    const opcoes = state.opcoes.map((o) => (o.nome === nome ? { ...o, valores } : o));
    const combinacoes = gerarCombinacoes(opcoes, state.combinacoes);
    onChange({ ...state, opcoes, combinacoes });
  }

  const combinacoesCount = state.combinacoes.length;

  return (
    <div>
      <div className="mb-1 pl-1">
        <h3 className="text-[13px] font-black text-ink">Variantes</h3>
        <p className="text-[11px] font-medium text-slate-400">
          Escolhe as características que diferenciam este produto — nenhuma é obrigatória.
        </p>
      </div>

      <div className="mt-3 flex flex-col gap-4">
        {state.opcoes.map((opcao) => (
          <OpcaoSection
            key={opcao.nome}
            opcao={opcao}
            onValoresChange={(v) => setValores(opcao.nome, v)}
            onRemove={() => removeOpcao(opcao.nome)}
          />
        ))}

        {disponiveis.length > 0 && (
          <button
            type="button"
            onClick={() => setPickerOpen(true)}
            className="flex items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-slate-200 py-3.5 text-[12px] font-bold text-slate-500 transition-colors hover:border-slate-300 hover:text-ink active:scale-[0.99]"
          >
            <Plus size={15} /> Adicionar opção
          </button>
        )}

        {combinacoesCount > 1 && (
          <p className="rounded-xl bg-slate-50 px-3.5 py-2.5 text-center text-[11px] font-semibold text-slate-500">
            {combinacoesCount} variantes geradas a partir destas opções. Preenche cada uma mais abaixo — e podes
            desativar as que não existem.
          </p>
        )}
      </div>

      <Sheet open={pickerOpen} onClose={() => setPickerOpen(false)} title="Adicionar opção">
        <div className="flex flex-col gap-1.5 pb-4">
          {disponiveis.map((nome) => (
            <button
              key={nome}
              type="button"
              onClick={() => addOpcao(nome)}
              className="rounded-2xl px-3 py-3.5 text-left text-[13px] font-bold text-ink transition-colors active:bg-slate-50"
            >
              {nome}
            </button>
          ))}
        </div>
      </Sheet>
    </div>
  );
}

function OpcaoSection({
  opcao,
  onValoresChange,
  onRemove,
}: {
  opcao: ProdutoOpcao;
  onValoresChange: (v: string[]) => void;
  onRemove: () => void;
}) {
  const [draft, setDraft] = useState('');

  function commit() {
    const v = draft.trim();
    if (v && !opcao.valores.includes(v)) onValoresChange([...opcao.valores, v]);
    setDraft('');
  }

  return (
    <div className="rounded-2xl border border-slate-100 bg-slate-50/60 p-3.5">
      <div className="mb-2.5 flex items-center justify-between">
        <span className="text-[11px] font-black uppercase tracking-widest text-slate-500">{opcao.nome}</span>
        <button type="button" onClick={onRemove} className="text-[11px] font-bold text-slate-400 hover:text-red-500">
          Remover
        </button>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {opcao.valores.map((v) => (
          <span
            key={v}
            className="inline-flex h-9 items-center gap-1.5 rounded-full bg-white pl-3.5 pr-2 text-[12px] font-bold text-ink shadow-sm"
          >
            {v}
            <button
              type="button"
              onClick={() => onValoresChange(opcao.valores.filter((x) => x !== v))}
              className="text-slate-400 hover:text-slate-700"
            >
              <X size={12} />
            </button>
          </span>
        ))}
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ',') {
              e.preventDefault();
              commit();
            }
          }}
          onBlur={commit}
          placeholder={`+ ${PLACEHOLDERS[opcao.nome]}`}
          className="h-9 w-28 rounded-full bg-white px-3.5 text-[12px] font-semibold text-ink shadow-sm outline-none placeholder:text-slate-400 focus:ring-2 focus:ring-ink/10"
        />
      </div>
    </div>
  );
}

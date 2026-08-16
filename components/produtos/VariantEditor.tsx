'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Plus, X, ImagePlus, ChevronDown } from 'lucide-react';
import { Sheet } from '@/components/ui/Sheet';
import { VariantImagePicker } from '@/components/produtos/VariantImagePicker';
import { chaveValor, gerarCombinacoes } from '@/lib/variantes';
import { OPCOES_VARIANTE_DISPONIVEIS } from '@/types/database';
import type { NomeOpcaoVariante, ProdutoCombinacao, ProdutoOpcao } from '@/types/database';
import { cn } from '@/lib/cn';

const PLACEHOLDERS: Record<NomeOpcaoVariante, string> = {
  Cor: 'Ex: Preto',
  Tamanho: 'Ex: M',
  Género: 'Ex: Unissexo',
};

export interface VariantesState {
  opcoes: ProdutoOpcao[];
  combinacoes: ProdutoCombinacao[];
  imagensPorValor: Record<string, string[]>;
}

export function VariantEditor({
  state,
  onChange,
  fotosGerais,
  onAddFotoGeral,
  lojaId,
}: {
  state: VariantesState;
  onChange: (next: VariantesState) => void;
  fotosGerais: string[];
  onAddFotoGeral: (url: string) => void;
  lojaId: string;
}) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const [imagePickerFor, setImagePickerFor] = useState<{ opcao: string; valor: string } | null>(null);

  const disponiveis = OPCOES_VARIANTE_DISPONIVEIS.filter((n) => !state.opcoes.some((o) => o.nome === n));

  function addOpcao(nome: NomeOpcaoVariante) {
    const opcoes = [...state.opcoes, { nome, valores: [] }];
    onChange({ ...state, opcoes });
    setPickerOpen(false);
  }

  function removeOpcao(nome: string) {
    const opcoes = state.opcoes.filter((o) => o.nome !== nome);
    const combinacoes = gerarCombinacoes(opcoes, state.combinacoes);
    const imagensPorValor = { ...state.imagensPorValor };
    Object.keys(imagensPorValor).forEach((k) => {
      if (k.startsWith(`${nome}:`)) delete imagensPorValor[k];
    });
    onChange({ opcoes, combinacoes, imagensPorValor });
  }

  function setValores(nome: string, valores: string[]) {
    const opcoes = state.opcoes.map((o) => (o.nome === nome ? { ...o, valores } : o));
    const combinacoes = gerarCombinacoes(opcoes, state.combinacoes);
    onChange({ ...state, opcoes, combinacoes });
  }

  function saveImagens(opcaoNome: string, valor: string, urls: string[]) {
    onChange({
      ...state,
      imagensPorValor: { ...state.imagensPorValor, [chaveValor(opcaoNome, valor)]: urls },
    });
  }

  const combinacoesCount = state.combinacoes.length;

  return (
    <div>
      <div className="mb-1 pl-1">
        <h3 className="text-[13px] font-black text-ink">Variantes</h3>
        <p className="text-[11px] font-medium text-slate-400">Adiciona opções como cor, tamanho ou género.</p>
      </div>

      <div className="mt-3 flex flex-col gap-4">
        {state.opcoes.map((opcao) => (
          <OpcaoSection
            key={opcao.nome}
            opcao={opcao}
            onValoresChange={(v) => setValores(opcao.nome, v)}
            onRemove={() => removeOpcao(opcao.nome)}
            imagensPorValor={state.imagensPorValor}
            onEditImagens={(valor) => setImagePickerFor({ opcao: opcao.nome, valor })}
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
            {combinacoesCount} combinações serão criadas automaticamente. Preenche o estoque de cada uma mais abaixo.
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

      {imagePickerFor && (
        <VariantImagePicker
          open
          onClose={() => setImagePickerFor(null)}
          label={imagePickerFor.valor}
          lojaId={lojaId}
          fotosGerais={fotosGerais}
          selecionadas={state.imagensPorValor[chaveValor(imagePickerFor.opcao, imagePickerFor.valor)] ?? []}
          onAddToGaleria={onAddFotoGeral}
          onSave={(urls) => saveImagens(imagePickerFor.opcao, imagePickerFor.valor, urls)}
        />
      )}
    </div>
  );
}

function OpcaoSection({
  opcao,
  onValoresChange,
  onRemove,
  imagensPorValor,
  onEditImagens,
}: {
  opcao: ProdutoOpcao;
  onValoresChange: (v: string[]) => void;
  onRemove: () => void;
  imagensPorValor: Record<string, string[]>;
  onEditImagens: (valor: string) => void;
}) {
  const [draft, setDraft] = useState('');
  const [expanded, setExpanded] = useState(false);

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

      {opcao.valores.length > 0 && (
        <div className="mt-3 border-t border-slate-100 pt-2.5">
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="flex items-center gap-1 text-[11px] font-bold text-slate-400 hover:text-ink"
          >
            <ChevronDown size={13} className={cn('transition-transform', expanded && 'rotate-180')} />
            Associar imagens por {opcao.nome.toLowerCase()} (opcional)
          </button>

          {expanded && (
            <div className="mt-2.5 flex flex-col gap-2">
              {opcao.valores.map((v) => {
                const imgs = imagensPorValor[chaveValor(opcao.nome, v)] ?? [];
                return (
                  <button
                    key={v}
                    type="button"
                    onClick={() => onEditImagens(v)}
                    className="flex items-center justify-between rounded-xl bg-white px-3 py-2.5 shadow-sm active:scale-[0.99]"
                  >
                    <span className="text-[12px] font-bold text-ink">{v}</span>
                    <div className="flex items-center gap-1.5">
                      {imgs.slice(0, 3).map((url, i) => (
                        <div key={url + i} className="relative h-6 w-6 overflow-hidden rounded-full ring-2 ring-white">
                          <Image src={url} alt="" fill className="object-cover" sizes="24px" />
                        </div>
                      ))}
                      <span className="flex items-center gap-1 text-[11px] font-semibold text-slate-400">
                        {imgs.length === 0 ? (
                          <>
                            <ImagePlus size={13} /> Adicionar
                          </>
                        ) : (
                          `${imgs.length} imagem${imgs.length > 1 ? 's' : ''}`
                        )}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

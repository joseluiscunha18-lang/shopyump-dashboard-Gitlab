'use client';

import { kgParaUnidade } from '@/lib/peso';
import type { UnidadePeso } from '@/lib/peso';

/**
 * Peso padrão do produto — vive antes de "Opções do produto" porque é
 * usado automaticamente por todas as variantes (cada uma só precisa de um
 * valor próprio quando pesa mesmo diferente do padrão; ver o campo "Peso"
 * dentro de cada versão em StockSection).
 */
export function PesoPadraoInput({
  valor,
  unidade,
  onChangeValor,
  onChangeUnidade,
}: {
  /** Valor em texto, na unidade atual (não em kg) — mais simples para o input controlado. */
  valor: string;
  unidade: UnidadePeso;
  onChangeValor: (v: string) => void;
  onChangeUnidade: (u: UnidadePeso) => void;
}) {
  function trocarUnidade(u: UnidadePeso) {
    if (u === unidade) return;
    // Converte o valor já digitado para a nova unidade, para o vendedor
    // não perder o número ao trocar entre g e kg.
    if (valor.trim() !== '' && !Number.isNaN(Number(valor))) {
      const kg = unidade === 'g' ? Number(valor) / 1000 : Number(valor);
      onChangeValor(String(kgParaUnidade(kg, u)));
    }
    onChangeUnidade(u);
  }

  return (
    <div>
      <label className="mb-1.5 block pl-1 text-[11px] font-black uppercase tracking-widest text-slate-400">
        Peso padrão <span className="font-medium normal-case text-slate-300">— opcional</span>
      </label>
      <div className="flex items-center gap-2">
        <input
          type="number"
          min={0}
          step="0.01"
          inputMode="decimal"
          value={valor}
          onChange={(e) => onChangeValor(e.target.value)}
          placeholder="0"
          className="h-11 w-full min-w-0 flex-1 rounded-xl bg-slate-100 px-3.5 text-[13px] font-bold text-ink outline-none focus:ring-2 focus:ring-ink/10"
        />
        <div className="flex shrink-0 gap-1 rounded-full bg-slate-100 p-1">
          {(['g', 'kg'] as const).map((u) => (
            <button
              key={u}
              type="button"
              onClick={() => trocarUnidade(u)}
              className={[
                'rounded-full px-3 py-1.5 text-[11px] font-bold transition-colors',
                unidade === u ? 'bg-ink text-white' : 'text-slate-500',
              ].join(' ')}
            >
              {u}
            </button>
          ))}
        </div>
      </div>
      <p className="mt-1.5 pl-1 text-[10px] font-medium text-slate-400">
        Usado por todas as versões — dentro de uma versão dá para pôr um peso próprio só quando for diferente.
      </p>
    </div>
  );
}

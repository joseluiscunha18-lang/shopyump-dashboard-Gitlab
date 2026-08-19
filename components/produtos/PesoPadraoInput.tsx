'use client';

import { kgParaUnidade, pesoParaKg } from '@/lib/peso';
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
    // não perder o número ao trocar de unidade.
    if (valor.trim() !== '' && !Number.isNaN(Number(valor))) {
      const kg = pesoParaKg(Number(valor), unidade);
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
        <select
          value={unidade}
          onChange={(e) => trocarUnidade(e.target.value as UnidadePeso)}
          aria-label="Unidade do peso padrão"
          className="h-11 shrink-0 rounded-xl bg-slate-100 pl-3 pr-7 text-[12px] font-bold text-ink outline-none focus:ring-2 focus:ring-ink/10 appearance-none bg-[url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 20 20%22 fill=%22%2394a3b8%22><path d=%22M5.5 7.5l4.5 4.5 4.5-4.5%22 stroke=%22%2394a3b8%22 stroke-width=%221.6%22 fill=%22none%22 stroke-linecap=%22round%22 stroke-linejoin=%22round%22/></svg>')] bg-no-repeat bg-[right_0.5rem_center]"
        >
          {(['g', 'kg', 'lb', 'oz'] as const).map((u) => (
            <option key={u} value={u}>
              {u}
            </option>
          ))}
        </select>
      </div>
      <p className="mt-1.5 pl-1 text-[10px] font-medium text-slate-400">
        Usado por todas as versões — dentro de uma versão dá para pôr um peso próprio só quando for diferente.
      </p>
    </div>
  );
}

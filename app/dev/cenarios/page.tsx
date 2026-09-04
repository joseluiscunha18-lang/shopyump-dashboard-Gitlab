import type { Metadata } from 'next';
import { HOME_MOCK_SCENARIOS, HOME_MOCK_SCENARIO_IDS } from '@/lib/mocks/homeScenarios';
import { getActiveScenario } from '@/lib/mocks/getActiveScenario';
import { setScenarioAction } from '@/lib/mocks/setScenarioAction';
import { ResumoCard } from '@/components/dashboard/ResumoCard';
import { MarketplaceCard } from '@/components/dashboard/MarketplaceCard';
import { PagamentosCard, resolvePagamentosCard } from '@/components/dashboard/PagamentosCard';

export const metadata: Metadata = { title: 'Cenários (dev) | Shopyump' };

/**
 * Página só de desenvolvimento — não faz parte do produto, não tem link
 * nenhum a apontar para aqui. Serve só para provar que a camada de mocks
 * (lib/mocks/*) funciona e para trocar de cenário facilmente enquanto
 * construímos os módulos financeiros/Marketplace da Home em cima disto.
 *
 * Fica FORA do grupo (dashboard) de propósito — não precisa de loja real
 * nem de sessão para ser aberta.
 */
export default async function CenariosDevPage() {
  const ativo = await getActiveScenario();
  const pagamentos = resolvePagamentosCard(ativo.storePayment, ativo.marketplace);

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-8 px-4 py-10">
      <div>
        <h1 className="font-display text-2xl font-extrabold text-ink">Cenários (dev)</h1>
        <p className="mt-1 text-sm font-medium text-slate-500">
          Camada de mocks da Home (§19 da spec) — troca de cenário aqui, sem tocar em nada real.
        </p>
      </div>

      {/*
        Pré-visualização "ao vivo" dos cards do Home (§13 do pedido original
        + "NOVA LÓGICA DO CARD FINANCEIRO DA HOME": abrir o frontend e
        comparar os cenários lado a lado, trocando abaixo). Só usa os
        componentes visuais puros (ResumoCard + módulos financeiros)
        alimentados pelo cenário mock ativo — nada aqui toca no Home real
        nem em dados do Supabase.

        Moldura de largura fixa (~ um telemóvel) porque o pedido é
        explicitamente mobile-first.

        "Resumo" (Pedidos + Visitas) é SEMPRE seguro de mostrar,
        independentemente de plano ou canal financeiro — nunca duplica
        nada do card Pagamentos, que agora é o único lugar onde
        "dinheiro" aparece.

        `resolvePagamentosCard` decide TUDO sobre o card Pagamentos numa
        função só (ver PagamentosCard.tsx): o número principal, se ele é
        "Vendas este mês" (gateway externo, sem saldo Shopyump) ou
        "Disponível para saque" (gateway Shopyump e/ou Marketplace já
        liberado — nunca "Em proteção"), e a quebra Hoje/Ontem/Este mês
        combinando todos os canais que a Shopyump consegue registar.
        `null` quando não há nenhum canal financeiro confirmado (Free,
        ou pago sem gateway e sem Marketplace) — nesse caso nem
        renderizamos o card.
      */}
      <div>
        <h2 className="mb-3 text-[13px] font-bold uppercase tracking-[0.08em] text-slate-400">Pré-visualização do Home</h2>
        <div className="mx-auto flex w-full max-w-[380px] flex-col gap-6 rounded-[32px] bg-[#F6F7F9] p-4 ring-1 ring-black/[0.06]">
          <ResumoCard ordersCount={ativo.store.ordersCount} visits={ativo.store.visits} />

          {ativo.marketplace.status === 'active' && (
            <MarketplaceCard
              salesAmount={ativo.marketplace.salesAmount}
              protectedAmount={ativo.marketplace.protectedAmount}
              availableAmount={ativo.marketplace.availableAmount}
            />
          )}

          {pagamentos && (
            <PagamentosCard amount={pagamentos.amount} amountLabel={pagamentos.amountLabel} breakdown={pagamentos.breakdown} />
          )}
        </div>
      </div>

      <div>
        <h2 className="mb-3 text-[13px] font-bold uppercase tracking-[0.08em] text-slate-400">Cenário ativo</h2>
        <div className="rounded-[20px] bg-white p-4 ring-1 ring-black/[0.06]">
          <p className="text-[15px] font-bold text-ink">{ativo.label}</p>
          <p className="mt-0.5 font-mono text-[12px] text-slate-400">{ativo.id}</p>
        </div>
      </div>

      <div>
        <h2 className="mb-3 text-[13px] font-bold uppercase tracking-[0.08em] text-slate-400">Trocar cenário</h2>
        <div className="flex flex-col gap-2">
          {HOME_MOCK_SCENARIO_IDS.map((id) => {
            const cenario = HOME_MOCK_SCENARIOS[id];
            const selecionado = id === ativo.id;
            return (
              <form key={id} action={setScenarioAction}>
                <input type="hidden" name="cenario" value={id} />
                <button
                  type="submit"
                  className={`w-full rounded-[14px] px-4 py-3 text-left text-[13px] font-semibold transition-colors ${
                    selecionado ? 'bg-ink text-white' : 'bg-white text-slate-600 ring-1 ring-black/[0.06] hover:bg-slate-50'
                  }`}
                >
                  {cenario.label}
                  <span className={`ml-2 font-mono text-[11px] ${selecionado ? 'text-white/60' : 'text-slate-400'}`}>{id}</span>
                </button>
              </form>
            );
          })}
        </div>
      </div>

      <div>
        <h2 className="mb-3 text-[13px] font-bold uppercase tracking-[0.08em] text-slate-400">Estado completo (JSON)</h2>
        <pre className="overflow-x-auto rounded-[20px] bg-ink p-4 text-[11px] leading-relaxed text-white/80">
          {JSON.stringify(ativo, null, 2)}
        </pre>
      </div>
    </div>
  );
}

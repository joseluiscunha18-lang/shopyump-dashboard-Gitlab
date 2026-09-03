import type { Metadata } from 'next';
import { HOME_MOCK_SCENARIOS, HOME_MOCK_SCENARIO_IDS } from '@/lib/mocks/homeScenarios';
import { getActiveScenario } from '@/lib/mocks/getActiveScenario';
import { setScenarioAction } from '@/lib/mocks/setScenarioAction';
import { VisaoGeral } from '@/components/dashboard/VisaoGeral';
import { MarketplaceCard } from '@/components/dashboard/MarketplaceCard';
import { PaymentsCard } from '@/components/dashboard/PaymentsCard';
import { FinanceiroCard } from '@/components/dashboard/FinanceiroCard';

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
  // Gateway (próprio ou externo) de facto ligado — só aí "Vendas" pode
  // aparecer na Visão geral (ver comentário mais abaixo).
  const temGatewayConfirmado = ativo.storePayment.provider !== 'none' && ativo.storePayment.connected;

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-8 px-4 py-10">
      <div>
        <h1 className="font-display text-2xl font-extrabold text-ink">Cenários (dev)</h1>
        <p className="mt-1 text-sm font-medium text-slate-500">
          Camada de mocks da Home (§19 da spec) — troca de cenário aqui, sem tocar em nada real.
        </p>
      </div>

      {/*
        Pré-visualização "ao vivo" dos cards do Home (§13 do pedido: abrir
        o frontend e comparar os estados A-F lado a lado, um de cada vez,
        trocando o cenário abaixo). Só usa os componentes visuais puros
        (VisaoGeral + módulos financeiros) alimentados pelo cenário mock
        ativo — nada aqui toca no Home real nem em dados do Supabase.

        Moldura de largura fixa (~ um telemóvel) porque o pedido é
        explicitamente mobile-first — ver isto empilhado e compacto aqui
        é mais representativo do produto do que a largura cheia do ecrã.

        `temGatewayConfirmado`: "Vendas" na Visão geral só existe quando
        há um gateway (próprio ou externo) de facto ligado — Free e
        pago-sem-gateway ficam só com os 3 indicadores. Marketplace
        sozinho NÃO liga isto: as vendas do Marketplace têm o seu
        próprio módulo (MarketplaceCard) e não aparecem na Vendas da
        loja — nos mocks isso já é natural porque `store.salesAmount`
        fica em 0 nesses cenários (ver comentário no FREE_MARKETPLACE_ACTIVE
        em homeScenarios.ts).

        `paymentsCount` do PaymentsCard usa `store.ordersCount` como
        aproximação: o tipo de mock ainda não tem uma contagem dedicada
        de pagamentos (só o valor confirmado) — troca-se por um campo
        real quando essa contagem existir de facto.
      */}
      <div>
        <h2 className="mb-3 text-[13px] font-bold uppercase tracking-[0.08em] text-slate-400">Pré-visualização do Home</h2>
        <div className="mx-auto flex w-full max-w-[380px] flex-col gap-6 rounded-[32px] bg-[#F6F7F9] p-4 ring-1 ring-black/[0.06]">
          <VisaoGeral
            salesAmount={temGatewayConfirmado ? ativo.store.salesAmount : undefined}
            growthPercent={temGatewayConfirmado ? ativo.store.growthPercent : undefined}
            productsCount={ativo.store.productsCount}
            visits={ativo.store.visits}
            ordersCount={ativo.store.ordersCount}
          />

          {ativo.marketplace.status === 'active' && (
            <MarketplaceCard
              salesAmount={ativo.marketplace.salesAmount}
              protectedAmount={ativo.marketplace.protectedAmount}
              availableAmount={ativo.marketplace.availableAmount}
            />
          )}

          {ativo.storePayment.provider === 'external' && ativo.storePayment.connected && (
            <PaymentsCard confirmedAmount={ativo.storePayment.confirmedPayments} paymentsCount={ativo.store.ordersCount} />
          )}

          {ativo.storePayment.provider === 'shopyump' && ativo.storePayment.connected && (
            <FinanceiroCard
              availableAmount={ativo.storePayment.availableAmount}
              processingAmount={ativo.storePayment.processingAmount}
            />
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

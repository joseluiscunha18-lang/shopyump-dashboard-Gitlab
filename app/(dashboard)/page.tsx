import type { Metadata } from 'next';
import { getUserContext } from '@/lib/auth/getUserContext';
import { getDashboardStats } from '@/lib/queries/stats';
import { getLojaMarcos } from '@/lib/queries/lojaMarcos';
import { getPedidosByLoja } from '@/lib/queries/pedidos';
import { NewOrderAlert } from '@/components/dashboard/NewOrderAlert';
import { DashboardGreeting } from '@/components/dashboard/DashboardGreeting';
import { OnboardingSteps } from '@/components/dashboard/OnboardingSteps';
import { GenericGrowthTips } from '@/components/dashboard/GenericGrowthTips';
import { PagamentosCard } from '@/components/dashboard/PagamentosCard';
import { resolvePagamentosCard } from '@/components/dashboard/resolvePagamentosCard';
import { MarketplaceCard } from '@/components/dashboard/MarketplaceCard';
import { ResumoLojaSecao } from '@/components/dashboard/ResumoLojaSecao';
import { HomeCardCarousel } from '@/components/dashboard/HomeCardCarousel';
import { getActiveScenario } from '@/lib/mocks/getActiveScenario';
import { ORDEM_MARCOS_ONBOARDING } from '@/types/database';
import { getStoreUrl } from '@/lib/storeUrl';

export const metadata: Metadata = { title: 'Painel | Shopyump' };

export default async function DashboardHomePage() {
  const ctx = await getUserContext();
  if (!ctx.loja) {
    return <p className="pt-10 text-sm font-medium text-slate-500">Sem loja associada a esta conta.</p>;
  }

  const [stats, marcos] = await Promise.all([
    getDashboardStats(ctx.loja.id),
    getLojaMarcos(ctx.loja.id),
  ]);

  const pedidosPendentesLista = stats.pedidosPendentes > 0
    ? await getPedidosByLoja(ctx.loja.id, 'pendente')
    : [];

  const storeUrl = ctx.loja.slug ? getStoreUrl(ctx.loja.slug) : null;

  const marcosRestantes = ORDEM_MARCOS_ONBOARDING.filter((m) => {
    const registo = marcos[m];
    return !registo?.concluido_em && !registo?.dispensado;
  });

  const nenhumFeitoAinda = marcosRestantes.length === ORDEM_MARCOS_ONBOARDING.length;
  const heading = nenhumFeitoAinda
    ? 'Comece sua loja'
    : marcosRestantes.length >= 2
      ? 'Próximos passos'
      : 'Dicas para crescer';

  const ativo = await getActiveScenario();
  const pagamentos = resolvePagamentosCard(ativo.storePayment, ativo.marketplace);
  const marketplaceAtivo = ativo.marketplace.status === 'active';
  const mostrarResumoLoja = ativo.storePayment.provider === 'none';
  const primeiroProdutoPublicado = !marcosRestantes.includes('primeiro_produto');

  const faseGreeting = !primeiroProdutoPublicado
    ? 'inicio'
    : marcosRestantes.length > 0
      ? 'em_progresso'
      : 'completo';

  return (
    <div className="flex flex-col gap-8 pt-2">
      <DashboardGreeting name={ctx.loja.nome} fase={faseGreeting} />

      {pedidosPendentesLista.length > 0 && (
        <NewOrderAlert pedidoRecente={pedidosPendentesLista[0]} pedidosPendentes={stats.pedidosPendentes} />
      )}

      {primeiroProdutoPublicado && (
        <div className="flex flex-col gap-6">
          <HomeCardCarousel>
            <PagamentosCard
              amount={pagamentos.amount}
              amountLabel={pagamentos.amountLabel}
              breakdown={pagamentos.breakdown}
              hint={pagamentos.hint}
            />

            {marketplaceAtivo && (
              <MarketplaceCard
                protectedAmount={ativo.marketplace.protectedAmount}
                disputedAmount={ativo.marketplace.disputedAmount}
                refundedAmount={ativo.marketplace.refundedAmount}
              />
            )}
          </HomeCardCarousel>

          {mostrarResumoLoja && (
            <ResumoLojaSecao ordersCount={stats.pedidosTotal} visits={stats.visitasTotal} />
          )}
        </div>
      )}

      {marcosRestantes.length >= 1 && (
        <OnboardingSteps
          lojaId={ctx.loja.id}
          storeUrl={storeUrl}
          storeName={ctx.loja.nome}
          marcos={marcosRestantes}
          heading={heading}
        />
      )}

      {marcosRestantes.length === 0 && <GenericGrowthTips />}
    </div>
  );
}

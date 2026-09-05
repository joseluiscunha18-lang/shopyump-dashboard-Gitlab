import type { Metadata } from 'next';
import { getUserContext } from '@/lib/auth/getUserContext';
import { getDashboardStats } from '@/lib/queries/stats';
import { getLojaMarcos } from '@/lib/queries/lojaMarcos';
import { getPedidosByLoja } from '@/lib/queries/pedidos';
import { NewOrderAlert } from '@/components/dashboard/NewOrderAlert';
import { OnboardingSteps } from '@/components/dashboard/OnboardingSteps';
import { GenericGrowthTips } from '@/components/dashboard/GenericGrowthTips';
import { PagamentosCard, resolvePagamentosCard } from '@/components/dashboard/PagamentosCard';
import { MarketplaceCard } from '@/components/dashboard/MarketplaceCard';
import { ResumoLojaSecao } from '@/components/dashboard/ResumoLojaSecao';
import { HomeCardCarousel } from '@/components/dashboard/HomeCardCarousel';
import { ORDEM_MARCOS_ONBOARDING } from '@/types/database';

export const metadata: Metadata = { title: 'Painel | Shopyump' };

export default async function DashboardHomePage() {
  const ctx = await getUserContext();
  if (!ctx.loja) {
    // Platform admin with no store of their own — nothing to show here in Phase 1.
    return <p className="pt-10 text-sm font-medium text-slate-500">Sem loja associada a esta conta.</p>;
  }

  const [stats, marcos] = await Promise.all([
    getDashboardStats(ctx.loja.id),
    getLojaMarcos(ctx.loja.id),
  ]);

  // Só busca a lista de pedidos pendentes quando `stats` já indicou que
  // há pelo menos 1 — evita uma query extra em toda visita normal, onde
  // não há nada por confirmar.
  const pedidosPendentesLista = stats.pedidosPendentes > 0 ? await getPedidosByLoja(ctx.loja.id, 'pendente') : [];

  const storeUrl = ctx.loja.slug ? `${process.env.NEXT_PUBLIC_WEB_URL ?? 'https://shopyump.vercel.app'}/loja/${ctx.loja.slug}` : null;

  // Marcos de onboarding ainda por fazer, na ordem fixa definida em
  // ORDEM_MARCOS_ONBOARDING — é este array (e só ele) que decide a
  // hierarquia da página (ver OnboardingSteps e a régua de heading
  // abaixo): 3/2 restantes → lista em destaque; 1 restante → vira
  // recomendação discreta; 0 restantes → dicas genéricas no lugar.
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

  // A base de dados ainda não tem gateway (próprio/externo) nem
  // Marketplace implementados de facto — ver lib/mocks/types.ts, que
  // documenta isto explicitamente como "um domínio ainda NÃO real".
  // Por isso toda loja real está hoje, por definição, no estado "sem
  // nenhum canal financeiro confirmado" — o mesmo que o cenário
  // FREE_NEW em /dev/cenarios. `resolvePagamentosCard` já sabe desenhar
  // esse estado (0 MT + hint pedindo para configurar pagamentos) em vez
  // de esconder o card. Assim que gateway/Marketplace reais existirem
  // na base de dados, troca-se SÓ estes dois objetos fixos por uma
  // leitura real da loja (ctx.loja) — nenhum componente aqui muda.
  const marketplace: { status: 'inactive' | 'active'; availableAmount: number; salesAmount: number; protectedAmount: number; disputedAmount: number; refundedAmount: number } = {
    status: 'inactive',
    availableAmount: 0,
    salesAmount: 0,
    protectedAmount: 0,
    disputedAmount: 0,
    refundedAmount: 0,
  };
  const pagamentos = resolvePagamentosCard({ provider: 'none', connected: false, availableAmount: 0 }, marketplace);
  const marketplaceAtivo = marketplace.status === 'active';

  return (
    <div className="flex flex-col gap-8 pt-2">
      {/* Quebra a hierarquia normal — um pedido por confirmar é uma
          tarefa pendente, não uma métrica, por isso fica sempre no topo
          quando existe, acima até dos próprios cards de onboarding. */}
      {pedidosPendentesLista.length > 0 && (
        <NewOrderAlert pedidoRecente={pedidosPendentesLista[0]} pedidosPendentes={stats.pedidosPendentes} />
      )}

      {marcosRestantes.length >= 2 && (
        <OnboardingSteps
          lojaId={ctx.loja.id}
          storeUrl={storeUrl}
          storeName={ctx.loja.nome}
          marcos={marcosRestantes}
          heading={heading}
        />
      )}

      {/* Pagamentos é sempre o card principal agora (ver
          resolvePagamentosCard em PagamentosCard.tsx), mesmo sem
          nenhum canal financeiro confirmado — mostra "Disponível para
          saque" a 0 MT com uma indicação discreta para configurar
          pagamentos, em vez do antigo "Resumo" isolado. Já entra
          dentro do HomeCardCarousel, tal como em /dev/cenarios: hoje
          só tem este filho (Marketplace ainda não existe de facto na
          base de dados, por isso `marketplaceAtivo` é sempre `false`
          aqui), e o carrossel devolve-o tal e qual, sem nenhum chrome
          — ver HomeCardCarousel.tsx. Assim que o Marketplace real
          existir, basta acrescentar aqui o mesmo `{marketplaceAtivo &&
          <MarketplaceCard ... />}` já usado em /dev/cenarios, sem mexer
          em mais nada. "Resumo da loja" (Pedidos/Visitas, ver
          ResumoLojaSecao) fica logo abaixo, como secção complementar. */}
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
              protectedAmount={marketplace.protectedAmount}
              disputedAmount={marketplace.disputedAmount}
              refundedAmount={marketplace.refundedAmount}
            />
          )}
        </HomeCardCarousel>

        <ResumoLojaSecao ordersCount={stats.pedidosTotal} visits={stats.visitasTotal} />
      </div>

      {marcosRestantes.length === 1 && (
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

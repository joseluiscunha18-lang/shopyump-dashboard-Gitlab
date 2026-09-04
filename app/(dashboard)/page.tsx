import type { Metadata } from 'next';
import { getUserContext } from '@/lib/auth/getUserContext';
import { getDashboardStats } from '@/lib/queries/stats';
import { getLojaMarcos } from '@/lib/queries/lojaMarcos';
import { getPedidosByLoja } from '@/lib/queries/pedidos';
import { NewOrderAlert } from '@/components/dashboard/NewOrderAlert';
import { OnboardingSteps } from '@/components/dashboard/OnboardingSteps';
import { GenericGrowthTips } from '@/components/dashboard/GenericGrowthTips';
import { PagamentosCard } from '@/components/dashboard/PagamentosCard';
import { MarketplaceCard } from '@/components/dashboard/MarketplaceCard';
import { HomeCardCarousel } from '@/components/dashboard/HomeCardCarousel';
import { ResumoLojaSecao } from '@/components/dashboard/ResumoLojaSecao';
import { resolveHomeFinanceCards } from '@/lib/dashboard/homeFinanceCards';
import { getStorePaymentStatus, getMarketplaceStatus } from '@/lib/queries/paymentStatus';
import { ORDEM_MARCOS_ONBOARDING } from '@/types/database';

export const metadata: Metadata = { title: 'Painel | Shopyump' };

export default async function DashboardHomePage() {
  const ctx = await getUserContext();
  if (!ctx.loja) {
    // Platform admin with no store of their own — nothing to show here in Phase 1.
    return <p className="pt-10 text-sm font-medium text-slate-500">Sem loja associada a esta conta.</p>;
  }

  const [stats, marcos, storePayment, marketplace] = await Promise.all([
    getDashboardStats(ctx.loja.id),
    getLojaMarcos(ctx.loja.id),
    getStorePaymentStatus(ctx.loja.id),
    getMarketplaceStatus(ctx.loja.id),
  ]);

  // Os dois cards financeiros ("Disponível para saque" / "Em proteção")
  // são SEMPRE calculados e mostrados — mesmo a 0 MT — como demonstração
  // da capacidade da plataforma (ver "NOVA LÓGICA DO CARD FINANCEIRO DA
  // HOME", ponto 2). Ao contrário de `resolvePagamentosCard` (usado só em
  // /dev/cenarios), este resolvedor nunca devolve `null`.
  const financeCards = resolveHomeFinanceCards(storePayment, marketplace);

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

      {/* "Resumo" (destaque principal, ponto 2 da "NOVA LÓGICA DO CARD
          FINANCEIRO DA HOME") — os dois cards financeiros ficam sempre no
          topo, mesmo a 0 MT: mostram a capacidade da plataforma e
          convidam a ativar Gateway/Marketplace, nunca dinheiro real
          quando não há nenhum. `PagamentosCard` traz o aviso discreto de
          configuração quando não há Gateway ligado (`financeCards.
          pagamentos.hint`); `MarketplaceCard` mostra o selo "Prévia"
          quando o Marketplace ainda não está ativo
          (`financeCards.marketplace.preview`) — nenhum dos dois afirma
          que o vendedor já usa o recurso. Quando Gateway/Marketplace
          forem ativados, `resolveHomeFinanceCards` passa a devolver os
          valores reais vindos do backend automaticamente, sem precisar
          de mudar nada aqui (ver lib/queries/paymentStatus.ts e
          lib/dashboard/homeFinanceCards.ts). */}
      <HomeCardCarousel>
        <PagamentosCard
          amount={financeCards.pagamentos.amount}
          amountLabel={financeCards.pagamentos.amountLabel}
          breakdown={financeCards.pagamentos.breakdown}
          hint={financeCards.pagamentos.hint}
        />
        <MarketplaceCard
          protectedAmount={financeCards.marketplace.protectedAmount}
          disputedAmount={financeCards.marketplace.disputedAmount}
          refundedAmount={financeCards.marketplace.refundedAmount}
          preview={financeCards.marketplace.preview}
        />
      </HomeCardCarousel>

      {/* "Resumo da loja" — rebaixado para posição secundária, logo
          abaixo dos cards financeiros (ponto 3). Continua sempre visível
          (nunca removido), com os valores reais de pedidos/visitas assim
          que existirem. */}
      <ResumoLojaSecao ordersCount={stats.pedidosTotal} visits={stats.visitasTotal} />

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

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
import { getActiveScenario } from '@/lib/mocks/getActiveScenario';
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

  // Plano/gateway/Marketplace ainda não existem de facto no Supabase —
  // `getActiveScenario()` é o "único ponto de acesso" a esse estado
  // (ver lib/mocks/getActiveScenario.ts): hoje lê do MESMO cookie que
  // `/dev/cenarios` escreve, por isso trocar de cenário lá already
  // reflete aqui na Home real também — nada de estado hardcoded/parado
  // em "sem canal nenhum". Quando gateway/Marketplace reais existirem,
  // troca-se só essa função por uma leitura do Supabase — nenhum
  // componente abaixo muda, porque o tipo devolvido é o mesmo.
  const ativo = await getActiveScenario();
  const pagamentos = resolvePagamentosCard(ativo.storePayment, ativo.marketplace);
  const marketplaceAtivo = ativo.marketplace.status === 'active';
  // Mesma regra do /dev/cenarios: aparece sempre que a loja própria não
  // tem nenhum gateway ligado (nem externo, nem Shopyump) — com ou sem
  // Marketplace ativo.
  const mostrarResumoLoja = ativo.storePayment.provider === 'none';
  // Antes do primeiro produto publicado a loja ainda não tem nada para
  // vender — nenhum card financeiro (Pagamentos/Marketplace/Resumo da
  // loja) faz sentido nesse momento. Usa o marco REAL (`marcos`,
  // vindo do Supabase), não o `user.firstProductPublished` do cenário
  // mock — o produto publicado é dado real, mesmo enquanto
  // gateway/Marketplace ainda vêm do cenário simulado.
  const primeiroProdutoPublicado = !marcosRestantes.includes('primeiro_produto');

  return (
    <div className="flex flex-col gap-8 pt-2">
      {/* Quebra a hierarquia normal — um pedido por confirmar é uma
          tarefa pendente, não uma métrica, por isso fica sempre no topo
          quando existe, acima de tudo o resto. */}
      {pedidosPendentesLista.length > 0 && (
        <NewOrderAlert pedidoRecente={pedidosPendentesLista[0]} pedidosPendentes={stats.pedidosPendentes} />
      )}

      {/* Pagamentos é sempre o card principal (ver resolvePagamentosCard
          em PagamentosCard.tsx) — o número/label muda conforme o
          cenário ativo (ver getActiveScenario acima), incluindo "0 MT +
          hint" quando não há nenhum canal ainda. Dentro do
          HomeCardCarousel junto com o MarketplaceCard quando o cenário
          tem Marketplace ativo — igual a /dev/cenarios. "Resumo da
          loja" (Pedidos/Visitas reais, ver ResumoLojaSecao) só aparece
          quando a loja própria não tem gateway ligado (ver
          mostrarResumoLoja acima). Fica sempre no topo da página,
          logo abaixo do alerta de pedido pendente — os cards-guia de
          onboarding (Próximos passos/Dicas) vêm depois, por baixo.
          Bloco inteiro escondido antes do primeiro produto publicado
          (ver primeiroProdutoPublicado acima) — sem produto, não há
          nada para vender ainda, então nenhum indicador financeiro
          aparece em lugar nenhum da página. */}
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

      {/* Cards-guia de onboarding — agora sempre por baixo dos cards
          financeiros, independentemente de quantos marcos faltam (a
          diferença entre "Próximos passos" com >=2 e "Dicas para
          crescer" com 1 restante continua a existir, só que os dois
          casos ficam na mesma posição na página em vez de um antes e
          outro depois do bloco financeiro). */}
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

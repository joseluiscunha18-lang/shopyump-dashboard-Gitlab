import type { Metadata } from 'next';
import { getUserContext } from '@/lib/auth/getUserContext';
import { getDashboardStats } from '@/lib/queries/stats';
import { getLojaMarcos } from '@/lib/queries/lojaMarcos';
import { getPedidosByLoja } from '@/lib/queries/pedidos';
import { NewOrderAlert } from '@/components/dashboard/NewOrderAlert';
import { OnboardingSteps } from '@/components/dashboard/OnboardingSteps';
import { GenericGrowthTips } from '@/components/dashboard/GenericGrowthTips';
import { VisaoGeral } from '@/components/dashboard/VisaoGeral';
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

      {/* Sempre visível, mesmo a zeros — ver VisaoGeral sobre o porquê.
          Sem `salesAmount`: hoje não existe nenhum canal financeiro
          confirmado (Marketplace/gateway ainda não estão implementados
          de facto), então "Vendas" fica escondida — mostrar um valor
          não confirmável seria enganoso. Passar esse prop assim que
          houver um gateway/Marketplace real ligado à loja. Ver
          lib/mocks/* e /dev/cenarios para a pré-visualização desses
          estados com dados mockados, conforme combinado nesta etapa
          (só UI dos cards, sem construir o restante do sistema). */}
      <VisaoGeral
        productsCount={stats.produtosCount}
        visits={stats.visitasTotal}
        ordersCount={stats.pedidosTotal}
      />

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

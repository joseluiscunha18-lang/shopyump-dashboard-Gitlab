import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { getUserContext } from '@/lib/auth/getUserContext';
import { countPedidosPendentes } from '@/lib/queries/pedidos';
import { Sidebar } from '@/components/nav/Sidebar';
import { BottomNav } from '@/components/nav/BottomNav';
import { DashboardContentFrame } from '@/components/nav/DashboardContentFrame';
import { TopBar } from '@/components/nav/TopBar';
import { MobileNavProvider } from '@/components/nav/MobileNavContext';
import { ProductFormGuardProvider } from '@/components/produtos/ProductFormGuardContext';
import { PublishingProvider } from '@/components/produtos/PublishingContext';
import { getStoreUrl } from '@/lib/storeUrl';

/**
 * Componente async isolado para o BottomNav — resolve o countPedidosPendentes
 * de forma independente, sem bloquear o streaming da page.tsx.
 */
async function BottomNavAsync({ lojaId }: { lojaId: string }) {
  const pedidosPendentes = await countPedidosPendentes(lojaId);
  return <BottomNav lojaId={lojaId} initialPedidosPendentes={pedidosPendentes} />;
}

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const ctx = await getUserContext();

  // Belt-and-braces alongside middleware: Server Components can be hit
  // directly (e.g. prefetch), so the redirect logic is duplicated here
  // cheaply since getUserContext() is request-cached.
  if (!ctx.userId) redirect('/login');
  if (!ctx.loja && !ctx.isAdmin) redirect('/onboarding');

  const storeUrl = ctx.loja ? getStoreUrl(ctx.loja.slug) : null;

  return (
    <MobileNavProvider>
      <ProductFormGuardProvider>
        {/* Acima de tudo o que navega entre /produtos e /produtos/novo, para
        que uma publicação otimista iniciada no formulário sobreviva à
        troca de página e possa reportar aqui o resultado quando terminar
        em segundo plano. */}
        <PublishingProvider>
          <div className="min-h-screen bg-[#F6F7F9] flex">
            <Sidebar storeUrl={storeUrl} />
            <DashboardContentFrame>
              <TopBar
                storeName={ctx.loja?.nome ?? 'Painel Admin'}
                storeUrl={storeUrl}
                hasUnreadNotifications={false}
              />
              <main className="flex-1 px-4 sm:px-6 pt-6 pb-10">
                <Suspense fallback={null}>
                  {children}
                </Suspense>
              </main>
            </DashboardContentFrame>
            {/* BottomNavAsync resolve a query de pendentes de forma independente
                para não bloquear o streaming da página principal. */}
            {ctx.loja ? (
              <Suspense fallback={<BottomNav lojaId={ctx.loja.id} initialPedidosPendentes={0} />}>
                <BottomNavAsync lojaId={ctx.loja.id} />
              </Suspense>
            ) : (
              <BottomNav lojaId={undefined} initialPedidosPendentes={0} />
            )}
          </div>
        </PublishingProvider>
      </ProductFormGuardProvider>
    </MobileNavProvider>
  );
}

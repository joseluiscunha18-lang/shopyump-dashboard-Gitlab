import { redirect } from 'next/navigation';
import { getUserContext } from '@/lib/auth/getUserContext';
import { countPedidosPendentes } from '@/lib/queries/pedidos';
import { Sidebar } from '@/components/nav/Sidebar';
import { BottomNav } from '@/components/nav/BottomNav';
import { TopBar } from '@/components/nav/TopBar';
import { MobileNavProvider } from '@/components/nav/MobileNavContext';
import { ProductFormGuardProvider } from '@/components/produtos/ProductFormGuardContext';
import { PublishingProvider } from '@/components/produtos/PublishingContext';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const ctx = await getUserContext();

  // Belt-and-braces alongside middleware: Server Components can be hit
  // directly (e.g. prefetch), so the redirect logic is duplicated here
  // cheaply since getUserContext() is request-cached.
  if (!ctx.userId) redirect('/login');
  if (!ctx.loja && !ctx.isAdmin) redirect('/onboarding');

  const storeUrl = ctx.loja ? `${process.env.NEXT_PUBLIC_WEB_URL ?? 'https://shopyump.vercel.app'}/loja/${ctx.loja.slug}` : null;
  // Mesmo sinal usado no badge da barra inferior e no alerta da Início —
  // aqui só precisa do número, não da lista. Uma query leve (count, sem
  // trazer linhas), corre em paralelo ao resto do layout.
  const pedidosPendentes = ctx.loja ? await countPedidosPendentes(ctx.loja.id) : 0;

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
            <div className="flex-1 flex flex-col pb-28 sm:pb-0 min-w-0">
              <TopBar
                storeName={ctx.loja?.nome ?? 'Painel Admin'}
                storeUrl={storeUrl}
                hasUnreadNotifications={pedidosPendentes > 0}
              />
              <main className="flex-1 px-4 sm:px-6 pt-6 pb-10">{children}</main>
            </div>
            <BottomNav lojaId={ctx.loja?.id} initialPedidosPendentes={pedidosPendentes} />
          </div>
        </PublishingProvider>
      </ProductFormGuardProvider>
    </MobileNavProvider>
  );
}

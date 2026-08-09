import { redirect } from 'next/navigation';
import { getUserContext } from '@/lib/auth/getUserContext';
import { Sidebar } from '@/components/nav/Sidebar';
import { BottomNav } from '@/components/nav/BottomNav';
import { TopBar } from '@/components/nav/TopBar';
import { MobileNavProvider } from '@/components/nav/MobileNavContext';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const ctx = await getUserContext();

  // Belt-and-braces alongside middleware: Server Components can be hit
  // directly (e.g. prefetch), so the redirect logic is duplicated here
  // cheaply since getUserContext() is request-cached.
  if (!ctx.userId) redirect('/login');
  if (!ctx.loja && !ctx.isAdmin) redirect('/onboarding');

  const storeUrl = ctx.loja ? `${process.env.NEXT_PUBLIC_WEB_URL ?? ''}/loja/${ctx.loja.slug}` : null;

  return (
    <MobileNavProvider>
      <div className="min-h-screen bg-[#FAFAFA] flex">
        <Sidebar storeUrl={storeUrl} />
        <div className="flex-1 flex flex-col pb-28 sm:pb-0 min-w-0">
          <TopBar storeName={ctx.loja?.nome ?? 'Painel Admin'} storeUrl={storeUrl} />
          <main className="flex-1 px-4 sm:px-6 pt-6 pb-10">{children}</main>
        </div>
        <BottomNav />
      </div>
    </MobileNavProvider>
  );
}

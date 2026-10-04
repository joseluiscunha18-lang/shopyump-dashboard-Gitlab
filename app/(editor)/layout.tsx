import { redirect } from 'next/navigation';
import { getUserContext } from '@/lib/auth/getUserContext';

/**
 * Editor da loja em ecrã inteiro: fica FORA da moldura do painel (sem
 * Sidebar/TopBar/BottomNav), mas com a mesma proteção de sessão.
 */
export default async function EditorLayout({ children }: { children: React.ReactNode }) {
  const ctx = await getUserContext();
  if (!ctx.userId) redirect('/login');
  if (!ctx.loja && !ctx.isAdmin) redirect('/onboarding');
  return <>{children}</>;
}

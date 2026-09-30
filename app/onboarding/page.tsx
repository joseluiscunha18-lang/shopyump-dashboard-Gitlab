import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { cleanRedirect } from '@/lib/auth/cleanRedirect';
import { OnboardingWizard } from '@/components/onboarding/OnboardingWizard';
import { getUserContext } from '@/lib/auth/getUserContext';

export const metadata: Metadata = { title: 'Criar a tua loja | Shopyump' };

export default async function OnboardingPage() {
  // O middleware não corre quando o URL é o /onboarding limpo (fica fora do
  // prefixo /dashboard), por isso a proteção é feita aqui.
  const ctx = await getUserContext();
  if (!ctx.userId) return cleanRedirect('/login');
  if (ctx.loja || ctx.isAdmin) redirect('/');
  return <OnboardingWizard />;
}

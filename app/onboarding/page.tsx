import type { Metadata } from 'next';
import { OnboardingWizard } from '@/components/onboarding/OnboardingWizard';

export const metadata: Metadata = { title: 'Criar a tua loja | Shopyump' };

export default function OnboardingPage() {
  return <OnboardingWizard />;
}

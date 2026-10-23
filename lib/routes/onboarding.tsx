import { createFileRoute } from '@/lib/route-compat';
import { AuthShell } from '@/components/auth/AuthShell';
import { OnboardingWizard } from '@/components/onboarding/OnboardingWizard';

export const Route = createFileRoute('/onboarding')({
  ssr: false,
  head: () => ({ meta: [
    { title: 'Criar a tua loja | Shopyump' },
    { name: 'description', content: 'Criar a tua loja na tua conta Shopyump.' },
    { property: 'og:title', content: 'Criar a tua loja | Shopyump' },
    { property: 'og:description', content: 'Criar a tua loja na tua conta Shopyump.' },
    { property: 'og:type', content: 'website' },
    { name: 'twitter:card', content: 'summary' },
  ] }),
  component: () => <AuthShell hideBrand><OnboardingWizard /></AuthShell>,
});

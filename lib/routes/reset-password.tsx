import { createFileRoute } from '@/lib/route-compat';
import { AuthShell } from '@/components/auth/AuthShell';
import { ResetForm } from '@/components/auth/ResetForm';

export const Route = createFileRoute('/reset-password')({
  ssr: false,
  head: () => ({ meta: [
    { title: 'Nova senha | Shopyump' },
    { name: 'description', content: 'Nova senha na tua conta Shopyump.' },
    { property: 'og:title', content: 'Nova senha | Shopyump' },
    { property: 'og:description', content: 'Nova senha na tua conta Shopyump.' },
    { property: 'og:type', content: 'website' },
    { name: 'twitter:card', content: 'summary' },
  ] }),
  component: () => <AuthShell><ResetForm /></AuthShell>,
});

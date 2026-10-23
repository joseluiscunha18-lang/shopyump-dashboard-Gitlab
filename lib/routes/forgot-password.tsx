import { createFileRoute } from '@/lib/route-compat';
import { AuthShell } from '@/components/auth/AuthShell';
import { ForgotForm } from '@/components/auth/ForgotForm';

export const Route = createFileRoute('/forgot-password')({
  ssr: false,
  head: () => ({ meta: [
    { title: 'Recuperar senha | Shopyump' },
    { name: 'description', content: 'Recuperar senha na tua conta Shopyump.' },
    { property: 'og:title', content: 'Recuperar senha | Shopyump' },
    { property: 'og:description', content: 'Recuperar senha na tua conta Shopyump.' },
    { property: 'og:type', content: 'website' },
    { name: 'twitter:card', content: 'summary' },
  ] }),
  component: () => <AuthShell><ForgotForm /></AuthShell>,
});

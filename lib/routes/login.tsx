import { createFileRoute } from '@/lib/route-compat';
import { AuthShell } from '@/components/auth/AuthShell';
import { AuthFlow } from '@/components/auth/AuthFlow';

export const Route = createFileRoute('/login')({
  ssr: false,
  head: () => ({ meta: [
    { title: 'Iniciar sessão | Shopyump' },
    { name: 'description', content: 'Iniciar sessão na tua conta Shopyump.' },
    { property: 'og:title', content: 'Iniciar sessão | Shopyump' },
    { property: 'og:description', content: 'Iniciar sessão na tua conta Shopyump.' },
    { property: 'og:type', content: 'website' },
    { name: 'twitter:card', content: 'summary' },
  ] }),
  component: () => <AuthShell><AuthFlow /></AuthShell>,
});

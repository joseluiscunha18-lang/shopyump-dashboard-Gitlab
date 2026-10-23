import { createFileRoute } from '@/lib/route-compat';
import { AuthShell } from '@/components/auth/AuthShell';
import { VerifyNotice } from '@/components/auth/VerifyNotice';

export const Route = createFileRoute('/verificar')({
  ssr: false,
  head: () => ({ meta: [
    { title: 'Confirmar e-mail | Shopyump' },
    { name: 'description', content: 'Confirmar e-mail na tua conta Shopyump.' },
    { property: 'og:title', content: 'Confirmar e-mail | Shopyump' },
    { property: 'og:description', content: 'Confirmar e-mail na tua conta Shopyump.' },
    { property: 'og:type', content: 'website' },
    { name: 'twitter:card', content: 'summary' },
  ] }),
  component: () => <AuthShell><VerifyNotice /></AuthShell>,
});

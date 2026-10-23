import { createFileRoute } from '@/lib/route-compat';
import { AuthShell } from '@/components/auth/AuthShell';
import { AuthFlow } from '@/components/auth/AuthFlow';

export const Route = createFileRoute('/register')({
  ssr: false,
  head: () => ({ meta: [
    { title: 'Criar conta | Shopyump' },
    { name: 'description', content: 'Cria a tua conta Shopyump e começa a vender online.' },
    { property: 'og:title', content: 'Criar conta | Shopyump' },
    { property: 'og:description', content: 'Cria a tua conta Shopyump e começa a vender online.' },
    { property: 'og:type', content: 'website' },
    { name: 'twitter:card', content: 'summary' },
  ] }),
  component: () => <AuthShell><AuthFlow mode="register" /></AuthShell>,
});

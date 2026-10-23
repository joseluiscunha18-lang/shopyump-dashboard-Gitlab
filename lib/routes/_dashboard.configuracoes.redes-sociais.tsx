import { createFileRoute } from '@/lib/route-compat';
import { SocialLinkEditor } from '@/components/loja/SocialLinkEditor';
import { SettingsPage } from '@/components/settings/SettingsKit';

export const Route = createFileRoute('/_dashboard/configuracoes/redes-sociais')({
  head: () => ({ meta: [
    { title: 'Redes sociais | Shopyump' },
    { name: 'description', content: 'Ligações para os perfis sociais da tua loja Shopyump.' },
    { property: 'og:title', content: 'Redes sociais | Shopyump' },
    { property: 'og:description', content: 'Ligações para os perfis sociais da loja.' },
    { property: 'og:type', content: 'website' },
    { name: 'twitter:card', content: 'summary_large_image' },
  ] }),
  component: () => <SettingsPage title="Redes sociais"><SocialLinkEditor /></SettingsPage>,
});

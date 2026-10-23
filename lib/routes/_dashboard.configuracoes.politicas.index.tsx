import { createFileRoute } from '@/lib/route-compat';
import { ContentPagesList } from '@/components/loja/ContentPages';
import { SettingsPage } from '@/components/settings/SettingsKit';

export const Route = createFileRoute('/_dashboard/configuracoes/politicas/')({
  head: () => ({ meta: [
    { title: 'Páginas e políticas | Shopyump' },
    { name: 'description', content: 'Políticas, termos e páginas informativas da tua loja Shopyump.' },
    { property: 'og:title', content: 'Páginas e políticas | Shopyump' },
    { property: 'og:description', content: 'Conteúdo informativo publicado para clientes.' },
    { property: 'og:type', content: 'website' },
    { name: 'twitter:card', content: 'summary_large_image' },
  ] }),
  component: () => <SettingsPage title="Páginas e políticas"><ContentPagesList /></SettingsPage>,
});

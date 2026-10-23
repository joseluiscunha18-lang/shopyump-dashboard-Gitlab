import { createFileRoute, getRouteApi } from '@/lib/route-compat';
import { DivulgarLojaPage } from '@/components/divulgar/DivulgarLojaPage';
import { getStoreUrl } from '@/lib/storeUrl';

const dashboardRoute = getRouteApi('/_dashboard');

export const Route = createFileRoute('/_dashboard/divulgar')({
  head: () => ({
    meta: [
      { title: 'Divulgar loja | Shopyump' },
      { name: 'description', content: 'Partilhe o link da sua loja, gere um QR Code e aprenda a divulgá-la nas redes sociais.' },
      { property: 'og:title', content: 'Divulgar loja | Shopyump' },
      { property: 'og:description', content: 'Partilhe o link da sua loja, gere um QR Code e aprenda a divulgá-la nas redes sociais.' },
      { property: 'og:type', content: 'website' },
      { name: 'twitter:card', content: 'summary' },
    ],
  }),
  component: Page,
});

function Page() {
  const { loja } = dashboardRoute.useLoaderData();
  return <DivulgarLojaPage lojaId={loja.id} storeName={loja.nome} storeUrl={getStoreUrl(loja.slug)} />;
}

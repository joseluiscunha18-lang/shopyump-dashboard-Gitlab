import type { NextConfig } from 'next';
import { DASHBOARD_BASE_PATH, TENANT_HOST_REGEX } from './lib/domains';

const nextConfig: NextConfig = {
  // Todo o painel passa a viver em shopyump.com/dashboard/*. <Link>, router.push,
  // redirect() e o middleware adicionam/retiram o prefixo sozinhos.
  basePath: DASHBOARD_BASE_PATH,

  // Compatibilidade + sem landing page. Só para hosts que NÃO são lojas:
  //   /            → /dashboard          (ainda não há landing page)
  //   /login, ...  → /dashboard/login    (links antigos: emails, favoritos, Supabase)
  // As lojas (nome.shopyump.com) ficam de fora e são tratadas no vercel.json.
  async redirects() {
    const notATenant = [{ type: 'host' as const, value: TENANT_HOST_REGEX }];
    return [
      {
        source: '/',
        destination: DASHBOARD_BASE_PATH,
        basePath: false as const,
        permanent: false,
        missing: notATenant,
      },
      {
        source: '/:path((?!dashboard|_next|api|images|icons|tema-lume|tema-default|favicon\\.ico).+)',
        destination: `${DASHBOARD_BASE_PATH}/:path`,
        basePath: false as const,
        permanent: false,
        missing: notATenant,
      },
    ];
  },

  // nome.shopyump.com → /dashboard/loja/nome é feito no vercel.json (o Next não
  // permite reescrever pedidos que estão fora do basePath).

  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**.supabase.co' },
      { protocol: 'https', hostname: 'placehold.co' },
      { protocol: 'https', hostname: 'i.ibb.co' },
    ],
  },
  // Por omissão, no Next 15 `staleTimes.dynamic` é 0 — o router.prefetch()
  // feito em ProductForm ao montar (para a navegação para /produtos ser
  // instantânea) fica sem qualquer efeito em rotas dinâmicas como esta
  // (autenticação por cookies + query à base de dados), porque a cache de
  // rota do cliente descarta o resultado de imediato. Sem isto, cada
  // `router.push('/produtos')` força sempre um pedido novo ao servidor,
  // somando esse tempo (variável, fora do nosso controlo) aos 3s fixos do
  // botão "Publicar produto" — exatamente o "está a demorar mais do que
  // 3 segundos" que queremos evitar. Com a rota prefetchada a ficar válida
  // por 30s, o push usa essa cópia (com o produto novo ainda em falta) e
  // o router.refresh() a seguir é que traz os dados reais em segundo
  // plano, sem bloquear a troca de ecrã.
  experimental: {
    staleTimes: {
      dynamic: 30,
    },
  },
};

export default nextConfig;

import type { NextConfig } from 'next';
import { DASHBOARD_BASE_PATH } from './lib/domains';

const nextConfig: NextConfig = {
  // O painel vive na raiz: shopyump.com/login, /registar, /onboarding, /produtos...
  // (só usa basePath se DASHBOARD_BASE_PATH em lib/domains.ts não estiver vazio).
  ...(DASHBOARD_BASE_PATH ? { basePath: DASHBOARD_BASE_PATH } : {}),

  // Links antigos (emails, favoritos, Supabase) que ainda têm /dashboard:
  //   /dashboard          → /
  //   /dashboard/login    → /login
  async redirects() {
    return [
      { source: '/dashboard', destination: '/', permanent: false },
      { source: '/dashboard/:path*', destination: '/:path*', permanent: false },
    ];
  },

  // nome.shopyump.com → /loja/nome é feito no vercel.json.

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

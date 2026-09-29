import type { MetadataRoute } from 'next';
import { DASHBOARD_BASE_PATH, asset } from '@/lib/domains';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Shopyump Dashboard',
    short_name: 'Shopyump',
    start_url: `${DASHBOARD_BASE_PATH}/`,
    scope: `${DASHBOARD_BASE_PATH}/`,
    display: 'standalone',
    background_color: '#0a1a3b',
    theme_color: '#0a1a3b',
    description: 'Painel de gestão da tua loja',
    icons: [
      { src: asset('/icons/icon-192.png'), sizes: '192x192', type: 'image/png' },
      { src: asset('/icons/icon-512.png'), sizes: '512x512', type: 'image/png' },
    ],
  };
}

import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Shopyump Dashboard',
    short_name: 'Shopyump',
    start_url: '/',
    display: 'standalone',
    background_color: '#0a1a3b',
    theme_color: '#0a1a3b',
    description: 'Painel de gestão da tua loja',
    icons: [
      { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
  };
}

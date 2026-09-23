import type { APIRoute } from 'astro';
import { en } from '../i18n/en';

export const GET: APIRoute = () =>
  new Response(
    JSON.stringify({
      name: 'Usai — a workload-native application runtime',
      short_name: 'Usai',
      description: en.meta.defaultDescription,
      start_url: '/',
      display: 'browser',
      background_color: '#03110f',
      theme_color: '#03110f',
      icons: [
        { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
        { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
        { src: '/favicon.svg', sizes: 'any', type: 'image/svg+xml' },
      ],
    }),
    { headers: { 'Content-Type': 'application/manifest+json' } },
  );

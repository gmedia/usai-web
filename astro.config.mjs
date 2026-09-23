// @ts-check
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';
import { usaiTheme } from './src/lib/shiki-theme.ts';

// The site is served from GitHub Pages under a custom domain (public/CNAME),
// so there is no base path. Changing the domain means changing `site` and
// public/CNAME — nothing else builds URLs by hand.
export default defineConfig({
  site: 'https://usai.sakala.dev',
  trailingSlash: 'ignore',
  build: { format: 'directory' },
  i18n: {
    locales: ['en', 'id'],
    defaultLocale: 'en',
    routing: { prefixDefaultLocale: false },
  },
  integrations: [
    react(),
    sitemap({
      i18n: {
        defaultLocale: 'en',
        locales: { en: 'en', id: 'id' },
      },
      filter: (page) => !page.includes('/og/') && !page.endsWith('/404/') && !page.endsWith('rss.xml'),
    }),
  ],
  vite: {
    plugins: [tailwindcss()],
  },
  markdown: {
    shikiConfig: { theme: usaiTheme },
  },
  prefetch: { prefetchAll: false, defaultStrategy: 'hover' },
});

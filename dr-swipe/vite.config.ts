import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// https://vite.dev/config/
export default defineConfig({
  base: '/',
  define: {
    __APP_VERSION__: JSON.stringify(process.env.npm_package_version ?? 'dev'),
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id: string) {
          if (!id.includes('node_modules')) return undefined;
          // Error reporting loads after first paint, never in the startup bundle.
          if (id.includes('@sentry')) return 'vendor-sentry';
          if (id.includes('framer-motion')) return 'vendor-motion';
          if (id.includes('xstate')) return 'vendor-xstate';
          if (id.includes('zod')) return 'vendor-zod';
          if (id.includes('react-dom') || id.includes('/react/')) return 'vendor-react';
          return 'vendor';
        },
      },
    },
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'prompt',
      manifest: {
        id: '/',
        lang: 'es',
        start_url: '/',
        scope: '/',
        name: 'Dr. Swipe: Triage Fatal',
        short_name: 'Dr. Swipe',
        description: 'Simulador de razonamiento clínico y supervivencia hospitalaria.',
        theme_color: '#0D9488',
        background_color: '#FDFBF7',
        display: 'standalone',
        orientation: 'portrait',
        icons: [
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          // Separate entries: a combined "any maskable" icon gets cropped where
          // it is used as "any".
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,png,svg,webp}'],
        runtimeCaching: [
          {
            // The index must revalidate so newly published cases appear.
            urlPattern: ({ url }) => url.pathname === '/cases/case_index.json' || url.pathname === '/cases/manifest.json',
            handler: 'StaleWhileRevalidate',
            options: { cacheName: 'clinical-cases-index' }
          },
          {
            // NOTE: regex patterns match against the FULL url (https://host/...),
            // so a regex anchored at "^/cases/" never fires — use the pathname.
            urlPattern: ({ url }) => url.pathname.startsWith('/cases/'),
            // Stale-while-revalidate, not cache-first: a clinical correction to
            // a case must reach players on their next visit, not after 30 days.
            // Offline play still works from the cache.
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'clinical-cases-cache',
              // 4000 entries: headroom for the 3,000+ case target (Phase 4)
              expiration: { maxEntries: 4000, maxAgeSeconds: 60 * 60 * 24 * 30 },
              cacheableResponse: { statuses: [200] }
            }
          },
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 },
              cacheableResponse: { statuses: [0, 200] }
            }
          }
        ]
      }
    })
  ],
})

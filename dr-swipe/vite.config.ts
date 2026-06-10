import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// https://vite.dev/config/
export default defineConfig({
  base: '/',
  plugins: [
    react(),
    VitePWA({
      registerType: 'prompt',
      manifest: {
        name: 'Dr. Swipe: Triage Fatal',
        short_name: 'Dr. Swipe',
        description: 'Simulador de razonamiento clínico y supervivencia hospitalaria.',
        theme_color: '#FF007F',
        background_color: '#FDFBF7',
        display: 'standalone',
        orientation: 'portrait',
        icons: [
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,png,svg,webp}'],
        runtimeCaching: [
          {
            // The index must revalidate so newly published cases appear.
            urlPattern: ({ url }) => url.pathname === '/cases/case_index.json',
            handler: 'StaleWhileRevalidate',
            options: { cacheName: 'clinical-cases-index' }
          },
          {
            // NOTE: regex patterns match against the FULL url (https://host/...),
            // so a regex anchored at "^/cases/" never fires — use the pathname.
            urlPattern: ({ url }) => url.pathname.startsWith('/cases/'),
            handler: 'CacheFirst',
            options: {
              cacheName: 'clinical-cases-cache',
              expiration: { maxEntries: 650, maxAgeSeconds: 60 * 60 * 24 * 30 },
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

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import path from 'node:path';

export default defineConfig({
  plugins: [
    react(),
    /*
      Installable app.

      `prompt`, not `autoUpdate`. autoUpdate reloads the page the moment a new
      service worker activates, and this site is one people fill booking forms
      on — a silent reload mid-form throws the form away. So a new version
      waits and asks, which is what UpdatePrompt does.

      Precaching covers the build output and the handful of files in public/,
      but deliberately not public/media: that is 24MB across 340 photographs
      and instrument renders, and precaching installs all of it on first visit
      whether or not the visitor ever sees a single one. Media is cached as it
      is actually used instead.

      Nothing is written here for Firestore, Identity Toolkit or the
      assistant's provider. Workbox only caches what a runtimeCaching rule
      matches, so leaving them out is what keeps auth and live data going to
      the network every time — which is the only correct behaviour for them.
    */
    VitePWA({
      registerType: 'prompt',
      includeAssets: ['favicon.ico', 'favicon-16x16.png', 'favicon-32x32.png', 'apple-touch-icon.png'],
      manifest: {
        name: 'Healthcare Labs — Advanced Diagnostics',
        short_name: 'Healthcare Labs',
        description:
          'Advanced diagnostics, preventive health packages and trusted laboratory care.',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        orientation: 'portrait',
        background_color: '#ffffff',
        theme_color: '#07133D',
        lang: 'en-IN',
        categories: ['medical', 'health'],
        icons: [
          { src: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
          { src: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
          { src: '/android-chrome-192x192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: '/android-chrome-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          /*
            Android crops an adaptive icon to a circle or squircle, taking
            roughly a fifth off every edge. The `any` icons above are drawn
            edge to edge and lose their corners to that crop, so this one
            carries the mark at 68% on flat brand blue instead.
          */
          { src: '/maskable-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
          { src: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
        ],
        shortcuts: [
          { name: 'Book a health check', url: '/health-package', description: 'Browse packages and book' },
          { name: 'My reports', url: '/account/reports', description: 'Download your reports' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,svg,woff2}', 'favicon-*.png', 'android-chrome-*.png', 'apple-touch-icon.png', 'maskable-*.png'],
        // 24MB of photographs has no business in a precache manifest.
        globIgnores: ['media/**', '**/*.map'],
        cleanupOutdatedCaches: true,
        navigateFallback: '/index.html',
        /*
          Firebase serves its OAuth handler from /__/auth/. Letting the SPA
          fallback answer those would break Google sign-in, and an offline
          shell has nothing useful to say about an auth redirect anyway.
        */
        navigateFallbackDenylist: [/^\/__\//],
        runtimeCaching: [
          {
            urlPattern: ({ url }) => url.pathname.startsWith('/media/'),
            handler: 'CacheFirst',
            options: {
              cacheName: 'hcl-media',
              expiration: { maxEntries: 150, maxAgeSeconds: 60 * 60 * 24 * 30 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            urlPattern: ({ url }) => url.origin === 'https://fonts.googleapis.com',
            handler: 'StaleWhileRevalidate',
            options: { cacheName: 'hcl-google-fonts-css' },
          },
          {
            urlPattern: ({ url }) => url.origin === 'https://fonts.gstatic.com',
            handler: 'CacheFirst',
            options: {
              cacheName: 'hcl-google-fonts',
              expiration: { maxEntries: 20, maxAgeSeconds: 60 * 60 * 24 * 365 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
      devOptions: { enabled: false },
    }),
  ],
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },
  },
  build: {
    target: 'es2020',
    chunkSizeWarningLimit: 1200,
    rollupOptions: {
      output: {
        // No manual chunking: every route is behind React.lazy, so Rollup's
        // own dynamic-import splitting already produces one chunk per page.
        chunkFileNames: 'assets/[name]-[hash].js',
      },
    },
  },
});

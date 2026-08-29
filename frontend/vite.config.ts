import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// Mobile-first PWA for "U, ME, NOW".
// Dev server binds 0.0.0.0:3000 for the Emergent preview proxy.
// Production build outputs a static site (dist/) for Cloudflare Pages.
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      includeAssets: ['favicon.svg', 'icons/icon-192.png', 'icons/icon-512.png', 'icons/maskable-512.png'],
      // Dev SW disabled to avoid generated artifacts; the production build in
      // dist/ contains the real service worker + manifest for install support.
      devOptions: { enabled: false },
      manifest: {
        name: 'U, ME, NOW',
        short_name: 'U,ME,NOW',
        description: "WHO'S AROUND? Meet people nearby. Right now. Jakarta.",
        lang: 'en',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        orientation: 'portrait',
        background_color: '#0A0A0B',
        theme_color: '#0A0A0B',
        categories: ['social', 'lifestyle'],
        icons: [
          { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: '/icons/maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' }
        ]
      },
      workbox: {
        // Precache ONLY static application assets. Never cache Supabase API,
        // auth, realtime, storage, or any private profile/chat data.
        globPatterns: ['**/*.{js,css,html,svg,png,ico,woff2}'],
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [/^\/api/],
        runtimeCaching: [],
        cleanupOutdatedCaches: true
      }
    })
  ],
  server: {
    host: true,
    port: 3000,
    strictPort: true,
    allowedHosts: true,
    hmr: { clientPort: 443 }
  },
  preview: { host: true, port: 3000, strictPort: true }
})

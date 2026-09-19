import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { VitePWA } from "vite-plugin-pwa";

// Mirrors DEFAULT_*_PORT in @be-native/shared (kept inline so the Vite config
// loader never has to import TS from a linked workspace package).
const DEFAULT_CLIENT_PORT = 5173;
const DEFAULT_SERVER_PORT = 4000;

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: "autoUpdate",
      // Everything below is precached at build time; PNG icons give reliable
      // install prompts on every platform (SVG alone is still modern-Chrome ok).
      includeAssets: [
        "favicon.svg",
        "apple-touch-icon.png",
        "pwa-192x192.svg",
        "pwa-512x512.svg",
        "pwa-192x192.png",
        "pwa-512x512.png"
      ],
      manifest: {
        name: "Be Native",
        short_name: "BeNative",
        description: "تطبيق ويب مكتوب على دفتر ورقي دافئ، يعمل دون اتصال كتطبيق أصلي.",
        lang: "ar",
        dir: "rtl",
        start_url: "/",
        scope: "/",
        display: "standalone",
        orientation: "portrait",
        background_color: "#f3e0bc",
        theme_color: "#2e201b",
        categories: ["productivity", "education"],
        icons: [
          { src: "/pwa-192x192.png", sizes: "192x192", type: "image/png", purpose: "any" },
          { src: "/pwa-512x512.png", sizes: "512x512", type: "image/png", purpose: "any" },
          { src: "/pwa-512x512.png", sizes: "512x512", type: "image/png", purpose: "maskable" }
        ]
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,svg,ico,png,woff2}"],
        navigateFallback: "/index.html",
        cleanupOutdatedCaches: true,
        // Warm, repeatable assets (fonts live in /fonts/ and are part of the
        // precache list above via globPatterns).
        runtimeCaching: [
          {
            urlPattern: ({ url }) => url.origin === self.location.origin && url.pathname.startsWith("/fonts/"),
            handler: "CacheFirst",
            options: {
              cacheName: "be-native-fonts",
              expiration: { maxEntries: 16, maxAgeSeconds: 60 * 60 * 24 * 30 }
            }
          },
          {
            urlPattern: ({ url }) => url.pathname.endsWith(".png") || url.pathname.endsWith(".svg"),
            handler: "CacheFirst",
            options: {
              cacheName: "be-native-images",
              expiration: { maxEntries: 64, maxAgeSeconds: 60 * 60 * 24 * 30 }
            }
          }
        ]
      },
      devOptions: {
        enabled: true,
        type: "module"
      }
    })
  ],
  server: {
    port: DEFAULT_CLIENT_PORT,
    proxy: {
      "/api": `http://localhost:${DEFAULT_SERVER_PORT}`
    }
  }
});
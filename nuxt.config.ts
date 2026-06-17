import tailwindcss from "@tailwindcss/vite";
export default defineNuxtConfig({
  compatibilityDate: "2025-07-15",
  devtools: { enabled: false },
  css: ['./app/assets/css/main.css'],
  runtimeConfig: {
    directusUrl: process.env.DIRECTUS_URL,
    directusToken: process.env.DIRECTUS_TOKEN,
    sessionSecret: process.env.NUXT_SESSION_SECRET,
  },
  app: {
    head: {
      htmlAttrs: { lang: 'de' },
      title: 'Cascade Academy',
      link: [
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
        { rel: 'stylesheet', href: 'https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:wght@500;600;700;800&family=Plus+Jakarta+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;700&display=swap' },
      ],
    },
  },
  vite: { plugins: [tailwindcss()] },
});

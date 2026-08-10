// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  future: { compatibilityVersion: 4 },
  typescript: { strict: true },
  modules: ['@nuxt/ui', '@pinia/nuxt', '@vueuse/nuxt'],
  css: ['~/assets/css/main.css'],
  runtimeConfig: {
    public: {
      apiBase: process.env.NUXT_PUBLIC_API_BASE || 'http://localhost:8888',
      midtransEnv: process.env.NUXT_PUBLIC_MIDTRANS_ENV || 'sandbox',
      midtransClientKey: process.env.NUXT_PUBLIC_MIDTRANS_CLIENT_KEY || '',
    },
  },
  experimental: {
    typedPages: true,
  },
})

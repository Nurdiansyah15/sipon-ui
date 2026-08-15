import { useAuthStore } from '~/stores/auth'
import { resetSessionExpiredGuard } from '~/composables/useApi'

export default defineNuxtPlugin(() => {
  const authStore = useAuthStore()
  if (!authStore.isHydrated) authStore.hydrate()

  // Sesi baru (login) → izinkan penanganan 401 lagi untuk sesi berikutnya.
  watch(
    () => authStore.token,
    (token) => {
      if (token) resetSessionExpiredGuard()
    },
  )
})

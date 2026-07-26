import { useAuthStore } from '~/stores/auth'

export default defineNuxtPlugin(() => {
  const authStore = useAuthStore()
  if (!authStore.isHydrated) authStore.hydrate()

  let sessionExpiredHandled = false
  watch(
    () => authStore.token,
    (token) => {
      if (token) sessionExpiredHandled = false
    },
  )

  globalThis.$fetch = $fetch.create({
    onResponseError({ response }) {
      if (response.status === 401 && authStore.isLoggedIn && !sessionExpiredHandled) {
        sessionExpiredHandled = true
        useToast().add({
          title: 'Sesi berakhir',
          description: 'Silakan masuk kembali untuk melanjutkan.',
          color: 'error',
        })
        authStore.clearUser()
        navigateTo('/auth/login')
      }
    },
  })
})

import { useAuthStore } from '~/stores/auth'

const PUBLIC_ROUTES = ['/auth/login', '/auth/register', '/auth/forgot-password']

export default defineNuxtRouteMiddleware((to) => {
  if (import.meta.server) return

  const authStore = useAuthStore()
  if (!authStore.isHydrated) authStore.hydrate()

  if (to.path === '/') {
    return navigateTo(authStore.isLoggedIn ? '/dashboard' : '/auth/login')
  }

  const isPublic = PUBLIC_ROUTES.includes(to.path)

  if (!authStore.isLoggedIn && !isPublic) {
    return navigateTo({ path: '/auth/login', query: { redirect: to.fullPath } })
  }

  if (authStore.isLoggedIn && isPublic) {
    return navigateTo('/dashboard')
  }
})

import { useAuthStore } from '~/stores/auth'

// Halaman yang hanya untuk pengguna yang TIDAK login (redirect ke dashboard jika sudah login).
const AUTH_ROUTES = ['/auth/login', '/auth/register', '/auth/forgot-password']

// Halaman publik yang bisa diakses siapa saja (login maupun tidak).
const PUBLIC_PREFIXES = ['/presensi']

export default defineNuxtRouteMiddleware((to) => {
  if (import.meta.server) return

  const authStore = useAuthStore()
  if (!authStore.isHydrated) authStore.hydrate()

  if (to.path === '/') {
    return navigateTo(authStore.isLoggedIn ? '/dashboard' : '/auth/login')
  }

  // Publik untuk semua (mis. halaman presensi) — tidak redirect.
  if (PUBLIC_PREFIXES.some(prefix => to.path.startsWith(prefix + '/'))) {
    return
  }

  const isAuthPage = AUTH_ROUTES.includes(to.path)

  if (!authStore.isLoggedIn && !isAuthPage) {
    return navigateTo({ path: '/auth/login', query: { redirect: to.fullPath } })
  }

  if (authStore.isLoggedIn && isAuthPage) {
    return navigateTo('/dashboard')
  }
})

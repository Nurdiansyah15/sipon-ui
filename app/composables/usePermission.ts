import { useAuthStore } from '~/stores/auth'

// usePermission membungkus auth store menjadi helper setara dengan k-forum
// reference: can(key) / canAny(keys) / canAll(keys) / hasRole(role).
// Dipakai untuk gating deklaratif di komponen halaman system-management.
export const usePermission = () => {
  const authStore = useAuthStore()

  const can = (key: string) => authStore.hasPermission(key)
  const canAny = (keys: string[]) => keys.some((k) => authStore.hasPermission(k))
  const canAll = (keys: string[]) => keys.every((k) => authStore.hasPermission(k))
  const hasRole = (role: string | string[]) => authStore.hasRole(role)

  return { can, canAny, canAll, hasRole }
}
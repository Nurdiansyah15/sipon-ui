import { useAuthStore } from '~/stores/auth'

interface RequestOptions {
  headers?: Record<string, string>
  body?: unknown
  query?: Record<string, unknown>
}

export const useApi = () => {
  const config = useRuntimeConfig()
  const authStore = useAuthStore()
  const apiBase = config.public.apiBase

  const request = <T>(url: string, options: RequestOptions & { method: string } = { method: 'GET' }): Promise<T> => {
    const cleanUrl = url.startsWith('/') ? url : `/${url}`
    const opt: Record<string, unknown> = { ...options }
    opt.headers = {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      ...options.headers,
    }
    if (authStore.token) {
      ;(opt.headers as Record<string, string>).Authorization = `Bearer ${authStore.token}`
    }
    return $fetch<T>(`${apiBase}${cleanUrl}`, opt as never)
  }

  return {
    get: <T>(url: string, options?: RequestOptions) => request<T>(url, { ...options, method: 'GET' }),
    post: <T>(url: string, body?: unknown, options?: RequestOptions) => request<T>(url, { ...options, method: 'POST', body }),
    put: <T>(url: string, body?: unknown, options?: RequestOptions) => request<T>(url, { ...options, method: 'PUT', body }),
    patch: <T>(url: string, body?: unknown, options?: RequestOptions) => request<T>(url, { ...options, method: 'PATCH', body }),
    delete: <T>(url: string, options?: RequestOptions) => request<T>(url, { ...options, method: 'DELETE' }),
  }
}

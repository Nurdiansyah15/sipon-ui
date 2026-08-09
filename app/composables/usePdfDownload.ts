import { useApi } from '~/composables/useApi'

/**
 * Unduh file PDF dari backend (endpoint mengembalikan application/pdf).
 * Gunakan $fetch dengan responseType blob supaya hasilnya bisa di-save.
 */
export function usePdfDownload() {
  const config = useRuntimeConfig()
  const authStore = useAuthStore()
  const isDownloading = ref(false)
  const error = ref<string | null>(null)

  async function downloadPdf(url: string, filename: string) {
    isDownloading.value = true
    error.value = null
    try {
      const cleanUrl = url.startsWith('/') ? url : `/${url}`
      const headers: Record<string, string> = { Accept: 'application/pdf' }
      if (authStore.token) {
        headers.Authorization = `Bearer ${authStore.token}`
      }
      const blob = await $fetch<Blob>(`${config.public.apiBase}${cleanUrl}`, {
        method: 'GET',
        headers,
        responseType: 'blob',
      })
      const objectUrl = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = objectUrl
      a.download = filename
      a.click()
      window.URL.revokeObjectURL(objectUrl)
    } catch (err) {
      error.value = 'Gagal mengunduh PDF.'
      throw err
    } finally {
      isDownloading.value = false
    }
  }

  return { isDownloading, error, downloadPdf }
}

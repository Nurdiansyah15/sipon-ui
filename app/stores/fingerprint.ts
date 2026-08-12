import { defineStore } from 'pinia'
import { useApi } from '~/composables/useApi'
import { parseApiError } from '~/utils/errorParser'
import type { ApiSuccess } from '#shared/types/ApiResponse'
import type { FingerprintScanLog, SimulateScanRequest } from '#shared/types/Akademik'

const base = '/api/v1/web/fingerprint'

interface FingerprintState {
  scans: FingerprintScanLog[]
  isLoading: boolean
  isSubmitting: boolean
  error: string | null
}

export const useFingerprintStore = defineStore('fingerprint', {
  state: (): FingerprintState => ({
    scans: [],
    isLoading: false,
    isSubmitting: false,
    error: null,
  }),

  actions: {
    async fetchScans(from?: string, to?: string) {
      this.isLoading = true
      this.error = null
      try {
        const api = useApi()
        const res = await api.get<ApiSuccess<FingerprintScanLog[]>>(`${base}/scans`, {
          query: { from, to },
        })
        this.scans = res.data ?? []
      } catch (err) {
        this.error = parseApiError(err, 'Gagal memuat daftar scan fingerprint.')
        throw err
      } finally {
        this.isLoading = false
      }
    },

    async simulateScan(payload: SimulateScanRequest): Promise<FingerprintScanLog> {
      this.isSubmitting = true
      this.error = null
      try {
        const api = useApi()
        const res = await api.post<ApiSuccess<FingerprintScanLog>>(`${base}/sandbox/scan`, payload)
        return res.data
      } catch (err) {
        this.error = parseApiError(err, 'Gagal mencatat scan simulasi.')
        throw err
      } finally {
        this.isSubmitting = false
      }
    },
  },
})

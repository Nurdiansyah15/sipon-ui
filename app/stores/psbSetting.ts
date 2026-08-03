import { defineStore } from 'pinia'
import { useApi } from '~/composables/useApi'
import { parseApiError } from '~/utils/errorParser'
import type { ApiSuccess } from '#shared/types/ApiResponse'
import type {
  SettingResponse,
  CreateSettingRequest,
  UpdateSettingRequest,
  MessageResponse,
} from '#shared/types/Psb'

interface PsbSettingState {
  items: SettingResponse[]
  isLoading: boolean
  isSubmitting: boolean
  error: string | null
}

export const usePsbSettingStore = defineStore('psbSetting', {
  state: (): PsbSettingState => ({
    items: [],
    isLoading: false,
    isSubmitting: false,
    error: null,
  }),

  actions: {
    async fetchSettings() {
      this.isLoading = true
      this.error = null
      try {
        const api = useApi()
        const res = await api.get<ApiSuccess<SettingResponse[]>>('/api/v1/web/psb/admin/settings')
        this.items = res.data
      } catch (err) {
        this.error = parseApiError(err, 'Gagal memuat daftar periode.')
        throw err
      } finally {
        this.isLoading = false
      }
    },

    async createSetting(payload: CreateSettingRequest): Promise<SettingResponse> {
      this.isSubmitting = true
      this.error = null
      try {
        const api = useApi()
        const res = await api.post<ApiSuccess<SettingResponse>>('/api/v1/web/psb/admin/settings', payload)
        return res.data
      } catch (err) {
        this.error = parseApiError(err, 'Gagal membuat periode.')
        throw err
      } finally {
        this.isSubmitting = false
      }
    },

    async updateSetting(id: string, payload: UpdateSettingRequest): Promise<SettingResponse> {
      this.isSubmitting = true
      this.error = null
      try {
        const api = useApi()
        const res = await api.put<ApiSuccess<SettingResponse>>(`/api/v1/web/psb/admin/settings/${id}`, payload)
        return res.data
      } catch (err) {
        this.error = parseApiError(err, 'Gagal mengupdate periode.')
        throw err
      } finally {
        this.isSubmitting = false
      }
    },

    async purgePeriod(id: string): Promise<MessageResponse> {
      this.isSubmitting = true
      this.error = null
      try {
        const api = useApi()
        const res = await api.post<ApiSuccess<MessageResponse>>(`/api/v1/web/psb/admin/settings/${id}/purge`)
        return res.data
      } catch (err) {
        this.error = parseApiError(err, 'Gagal menghapus data periode.')
        throw err
      } finally {
        this.isSubmitting = false
      }
    },
  },
})

import { defineStore } from 'pinia'
import { useApi } from '~/composables/useApi'
import { parseApiError } from '~/utils/errorParser'
import type { ApiSuccess, ApiMeta } from '#shared/types/ApiResponse'
import type {
  DokumenAsetItem,
  DokumenAsetDetail,
  DokumenAsetPresignRequest,
  DokumenAsetPresignResponse,
  DokumenAsetConfirmRequest,
  DokumenAsetConfirmResponse,
  DokumenAsetUpdateRequest,
  DokumenAsetDownloadResponse,
  DokumenAsetListQuery,
} from '#shared/types/DokumenAset'

interface DokumenAsetState {
  items: DokumenAsetItem[]
  meta: ApiMeta | null
  isLoading: boolean
  isSubmitting: boolean
  error: string | null
}

export const useDokumenAsetStore = defineStore('dokumenAset', {
  state: (): DokumenAsetState => ({
    items: [],
    meta: null,
    isLoading: false,
    isSubmitting: false,
    error: null,
  }),

  actions: {
    async fetchList(query: DokumenAsetListQuery = {}) {
      this.isLoading = true
      this.error = null
      try {
        const api = useApi()
        const res = await api.get<ApiSuccess<DokumenAsetItem[]>>('/api/v1/web/dokumen-aset/admin', {
          query: {
            page: query.page,
            limit: query.limit,
            kategori: query.kategori,
            search: query.search,
          },
        })
        this.items = res.data
        this.meta = res.meta
      } catch (err) {
        this.error = parseApiError(err, 'Gagal memuat daftar dokumen aset.')
        throw err
      } finally {
        this.isLoading = false
      }
    },

    async fetchDetail(id: string): Promise<DokumenAsetDetail> {
      try {
        const api = useApi()
        const res = await api.get<ApiSuccess<DokumenAsetDetail>>(`/api/v1/web/dokumen-aset/${id}`)
        return res.data
      } catch (err) {
        throw err
      }
    },

    async requestPresign(payload: DokumenAsetPresignRequest): Promise<DokumenAsetPresignResponse> {
      try {
        const api = useApi()
        const res = await api.post<ApiSuccess<DokumenAsetPresignResponse>>('/api/v1/web/dokumen-aset/admin', payload)
        return res.data
      } catch (err) {
        throw err
      }
    },

    async confirmUpload(payload: DokumenAsetConfirmRequest): Promise<DokumenAsetConfirmResponse> {
      this.isSubmitting = true
      this.error = null
      try {
        const api = useApi()
        const res = await api.post<ApiSuccess<DokumenAsetConfirmResponse>>('/api/v1/web/dokumen-aset/admin/confirm', payload)
        return res.data
      } catch (err) {
        this.error = parseApiError(err, 'Gagal menyimpan dokumen aset.')
        throw err
      } finally {
        this.isSubmitting = false
      }
    },

    async update(id: string, payload: DokumenAsetUpdateRequest) {
      this.isSubmitting = true
      this.error = null
      try {
        const api = useApi()
        await api.put(`/api/v1/web/dokumen-aset/admin/${id}`, payload)
      } catch (err) {
        this.error = parseApiError(err, 'Gagal memperbarui dokumen aset.')
        throw err
      } finally {
        this.isSubmitting = false
      }
    },

    async remove(id: string) {
      this.isSubmitting = true
      this.error = null
      try {
        const api = useApi()
        await api.delete(`/api/v1/web/dokumen-aset/admin/${id}`)
      } catch (err) {
        this.error = parseApiError(err, 'Gagal menghapus dokumen aset.')
        throw err
      } finally {
        this.isSubmitting = false
      }
    },

    async getDownloadUrl(id: string): Promise<DokumenAsetDownloadResponse> {
      try {
        const api = useApi()
        const res = await api.get<ApiSuccess<DokumenAsetDownloadResponse>>(`/api/v1/web/dokumen-aset/${id}/download`)
        return res.data
      } catch (err) {
        throw err
      }
    },
  },
})

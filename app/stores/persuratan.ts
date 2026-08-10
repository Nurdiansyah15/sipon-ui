import { defineStore } from 'pinia'
import { useApi } from '~/composables/useApi'
import { parseApiError } from '~/utils/errorParser'
import type { ApiSuccess, ApiMeta } from '#shared/types/ApiResponse'
import type {
  TipeSuratItem,
  TipeSuratFormPayload,
  SuratItem,
  SuratDetail,
  SuratCreatePayload,
  AddSuratDokumenPayload,
  TautDokumenResponse,
  SuratDownloadResponse,
  ListSuratQuery,
} from '#shared/types/Persuratan'

const BASE = '/api/v1/web/santri/admin/persuratan'

interface PersuratanState {
  tipeSuratList: TipeSuratItem[]
  suratList: SuratItem[]
  suratMeta: ApiMeta | null
  suratDetail: SuratDetail | null
  isLoading: boolean
  isSubmitting: boolean
  error: string | null
}

export const usePersuratanStore = defineStore('persuratan', {
  state: (): PersuratanState => ({
    tipeSuratList: [],
    suratList: [],
    suratMeta: null,
    suratDetail: null,
    isLoading: false,
    isSubmitting: false,
    error: null,
  }),

  actions: {
    async fetchTipeSuratList() {
      this.isLoading = true
      this.error = null
      try {
        const api = useApi()
        const res = await api.get<ApiSuccess<TipeSuratItem[]>>(`${BASE}/tipe-surat`, {
          query: { page: 1, limit: 100 },
        })
        this.tipeSuratList = res.data
      } catch (err) {
        this.error = parseApiError(err, 'Gagal memuat daftar tipe surat.')
        throw err
      } finally {
        this.isLoading = false
      }
    },

    async createTipeSurat(payload: TipeSuratFormPayload) {
      this.isSubmitting = true
      this.error = null
      try {
        const api = useApi()
        await api.post(`${BASE}/tipe-surat`, payload)
      } catch (err) {
        this.error = parseApiError(err, 'Gagal membuat tipe surat.')
        throw err
      } finally {
        this.isSubmitting = false
      }
    },

    async updateTipeSurat(id: string, payload: TipeSuratFormPayload) {
      this.isSubmitting = true
      this.error = null
      try {
        const api = useApi()
        await api.put(`${BASE}/tipe-surat/${id}`, payload)
      } catch (err) {
        this.error = parseApiError(err, 'Gagal memperbarui tipe surat.')
        throw err
      } finally {
        this.isSubmitting = false
      }
    },

    async deleteTipeSurat(id: string) {
      this.isSubmitting = true
      this.error = null
      try {
        const api = useApi()
        await api.delete(`${BASE}/tipe-surat/${id}`)
      } catch (err) {
        this.error = parseApiError(err, 'Gagal menghapus tipe surat.')
        throw err
      } finally {
        this.isSubmitting = false
      }
    },

    async fetchSuratList(query: ListSuratQuery = {}) {
      this.isLoading = true
      this.error = null
      try {
        const api = useApi()
        const res = await api.get<ApiSuccess<SuratItem[]>>(`${BASE}/surat`, {
          query: {
            page: query.page,
            limit: query.limit,
            tipe_surat_id: query.tipe_surat_id || undefined,
            bulan: query.bulan ?? undefined,
            tahun: query.tahun ?? undefined,
            search: query.search || undefined,
            sort_by: query.sort_by || undefined,
            sort_type: query.sort_type || undefined,
          },
        })
        this.suratList = res.data
        this.suratMeta = res.meta
      } catch (err) {
        this.error = parseApiError(err, 'Gagal memuat daftar surat.')
        throw err
      } finally {
        this.isLoading = false
      }
    },

    async createSurat(payload: SuratCreatePayload): Promise<SuratDetail> {
      this.isSubmitting = true
      this.error = null
      try {
        const api = useApi()
        const res = await api.post<ApiSuccess<SuratDetail>>(`${BASE}/surat`, payload)
        return res.data
      } catch (err) {
        this.error = parseApiError(err, 'Gagal membuat surat.')
        throw err
      } finally {
        this.isSubmitting = false
      }
    },

    async fetchSuratDetail(id: string) {
      this.isLoading = true
      this.error = null
      try {
        const api = useApi()
        const res = await api.get<ApiSuccess<SuratDetail>>(`${BASE}/surat/${id}`)
        this.suratDetail = res.data
      } catch (err) {
        this.error = parseApiError(err, 'Gagal memuat detail surat.')
        throw err
      } finally {
        this.isLoading = false
      }
    },

    async deleteSurat(id: string) {
      this.isSubmitting = true
      this.error = null
      try {
        const api = useApi()
        await api.delete(`${BASE}/surat/${id}`)
      } catch (err) {
        this.error = parseApiError(err, 'Gagal menghapus surat.')
        throw err
      } finally {
        this.isSubmitting = false
      }
    },

    async addSuratDokumen(suratId: string, payload: AddSuratDokumenPayload): Promise<TautDokumenResponse> {
      this.isSubmitting = true
      this.error = null
      try {
        const api = useApi()
        const res = await api.post<ApiSuccess<TautDokumenResponse>>(`${BASE}/surat/${suratId}/dokumen`, payload)
        return res.data
      } catch (err) {
        this.error = parseApiError(err, 'Gagal menautkan dokumen.')
        throw err
      } finally {
        this.isSubmitting = false
      }
    },

    async removeSuratDokumen(suratId: string, dokumenAsetId: string) {
      this.isSubmitting = true
      this.error = null
      try {
        const api = useApi()
        await api.delete(`${BASE}/surat/${suratId}/dokumen/${dokumenAsetId}`)
      } catch (err) {
        this.error = parseApiError(err, 'Gagal melepas dokumen.')
        throw err
      } finally {
        this.isSubmitting = false
      }
    },

    async getSuratDownload(suratId: string, dokumenAsetId: string): Promise<SuratDownloadResponse> {
      try {
        const api = useApi()
        const res = await api.get<ApiSuccess<SuratDownloadResponse>>(
          `${BASE}/surat/${suratId}/dokumen/${dokumenAsetId}/download`,
        )
        return res.data
      } catch (err) {
        throw err
      }
    },
  },
})

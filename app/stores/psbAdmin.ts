import { defineStore } from 'pinia'
import { useApi } from '~/composables/useApi'
import { parseApiError } from '~/utils/errorParser'
import type { ApiSuccess, ApiMeta } from '#shared/types/ApiResponse'
import type {
  ListPendaftarItem,
  ListPendaftarQuery,
  PendaftarResponse,
  DokumenItemResponse,
  DokumenAccessResponse,
  ReviewResponse,
  MessageResponse,
} from '#shared/types/Psb'

interface PsbAdminState {
  items: ListPendaftarItem[]
  meta: ApiMeta | null
  selected: PendaftarResponse | null
  selectedDokumen: DokumenItemResponse[]
  selectedReviews: ReviewResponse[]
  isLoading: boolean
  isSubmitting: boolean
  error: string | null
}

export const usePsbAdminStore = defineStore('psbAdmin', {
  state: (): PsbAdminState => ({
    items: [],
    meta: null,
    selected: null,
    selectedDokumen: [],
    selectedReviews: [],
    isLoading: false,
    isSubmitting: false,
    error: null,
  }),

  actions: {
    async fetchPendaftaranList(query: ListPendaftarQuery = {}) {
      this.isLoading = true
      this.error = null
      try {
        const api = useApi()
        const res = await api.get<ApiSuccess<ListPendaftarItem[]>>('/api/v1/web/psb/admin/pendaftaran', {
          query: {
            page: query.page,
            limit: query.limit,
            status: query.status,
            psb_setting_id: query.psb_setting_id,
          },
        })
        this.items = res.data
        this.meta = res.meta
      } catch (err) {
        this.error = parseApiError(err, 'Gagal memuat daftar pendaftar.')
        throw err
      } finally {
        this.isLoading = false
      }
    },

    async fetchPendaftaranDetail(id: string) {
      this.isLoading = true
      this.error = null
      try {
        const api = useApi()
        const res = await api.get<ApiSuccess<PendaftarResponse>>(`/api/v1/web/psb/admin/pendaftaran/${id}`)
        this.selected = res.data
      } catch (err) {
        this.error = parseApiError(err, 'Gagal memuat detail pendaftar.')
        throw err
      } finally {
        this.isLoading = false
      }
    },

    async fetchDetailDokumen(id: string) {
      try {
        const api = useApi()
        const res = await api.get<ApiSuccess<DokumenItemResponse[]>>(`/api/v1/web/psb/admin/pendaftaran/${id}/dokumen`)
        this.selectedDokumen = res.data
      } catch (err) {
        this.error = parseApiError(err, 'Gagal memuat dokumen.')
      }
    },

    async fetchDetailRiwayat(id: string) {
      try {
        const api = useApi()
        const res = await api.get<ApiSuccess<ReviewResponse[]>>(`/api/v1/web/psb/admin/pendaftaran/${id}/riwayat`)
        this.selectedReviews = res.data
      } catch (err) {
        this.error = parseApiError(err, 'Gagal memuat riwayat.')
      }
    },

    async accessDokumen(pendaftarID: string, dokumenID: string): Promise<DokumenAccessResponse> {
      try {
        const api = useApi()
        const res = await api.get<ApiSuccess<DokumenAccessResponse>>(`/api/v1/web/psb/admin/pendaftaran/${pendaftarID}/dokumen/${dokumenID}/access`)
        return res.data
      } catch (err) {
        this.error = parseApiError(err, 'Gagal membuat tautan pratinjau.')
        throw err
      }
    },

    async verifyDokumen(pendaftarID: string, dokumenID: string): Promise<MessageResponse> {
      this.isSubmitting = true
      this.error = null
      try {
        const api = useApi()
        const res = await api.post<ApiSuccess<MessageResponse>>(`/api/v1/web/psb/admin/pendaftaran/${pendaftarID}/dokumen/${dokumenID}/verify`)
        return res.data
      } catch (err) {
        this.error = parseApiError(err, 'Gagal verifikasi dokumen.')
        throw err
      } finally {
        this.isSubmitting = false
      }
    },

    async rejectDokumen(pendaftarID: string, dokumenID: string, notes?: string): Promise<MessageResponse> {
      this.isSubmitting = true
      this.error = null
      try {
        const api = useApi()
        const res = await api.post<ApiSuccess<MessageResponse>>(`/api/v1/web/psb/admin/pendaftaran/${pendaftarID}/dokumen/${dokumenID}/reject`, { notes })
        return res.data
      } catch (err) {
        this.error = parseApiError(err, 'Gagal menolak dokumen.')
        throw err
      } finally {
        this.isSubmitting = false
      }
    },

    async requestRevision(id: string, notes?: string): Promise<MessageResponse> {
      this.isSubmitting = true
      this.error = null
      try {
        const api = useApi()
        const res = await api.post<ApiSuccess<MessageResponse>>(`/api/v1/web/psb/admin/pendaftaran/${id}/request-revision`, { notes })
        return res.data
      } catch (err) {
        this.error = parseApiError(err, 'Gagal meminta revisi.')
        throw err
      } finally {
        this.isSubmitting = false
      }
    },

    async reject(id: string, notes?: string): Promise<MessageResponse> {
      this.isSubmitting = true
      this.error = null
      try {
        const api = useApi()
        const res = await api.post<ApiSuccess<MessageResponse>>(`/api/v1/web/psb/admin/pendaftaran/${id}/reject`, { notes })
        return res.data
      } catch (err) {
        this.error = parseApiError(err, 'Gagal menolak pendaftaran.')
        throw err
      } finally {
        this.isSubmitting = false
      }
    },

    async accept(id: string): Promise<MessageResponse> {
      this.isSubmitting = true
      this.error = null
      try {
        const api = useApi()
        const res = await api.post<ApiSuccess<MessageResponse>>(`/api/v1/web/psb/admin/pendaftaran/${id}/accept`)
        return res.data
      } catch (err) {
        this.error = parseApiError(err, 'Gagal menerima pendaftaran.')
        throw err
      } finally {
        this.isSubmitting = false
      }
    },

    async markNotReregistered(id: string): Promise<MessageResponse> {
      this.isSubmitting = true
      this.error = null
      try {
        const api = useApi()
        const res = await api.post<ApiSuccess<MessageResponse>>(`/api/v1/web/psb/admin/pendaftaran/${id}/mark-not-reregistered`)
        return res.data
      } catch (err) {
        this.error = parseApiError(err, 'Gagal menandai mengundurkan diri.')
        throw err
      } finally {
        this.isSubmitting = false
      }
    },

    async requestRevisionDaftarUlang(id: string, notes?: string): Promise<MessageResponse> {
      this.isSubmitting = true
      this.error = null
      try {
        const api = useApi()
        const res = await api.post<ApiSuccess<MessageResponse>>(`/api/v1/web/psb/admin/pendaftaran/${id}/request-revision-daftar-ulang`, { notes })
        return res.data
      } catch (err) {
        this.error = parseApiError(err, 'Gagal meminta revisi daftar ulang.')
        throw err
      } finally {
        this.isSubmitting = false
      }
    },

    async generateNIS(id: string): Promise<MessageResponse> {
      this.isSubmitting = true
      this.error = null
      try {
        const api = useApi()
        const res = await api.post<ApiSuccess<MessageResponse>>(`/api/v1/web/psb/admin/pendaftaran/${id}/generate-nis`)
        return res.data
      } catch (err) {
        this.error = parseApiError(err, 'Gagal generate NIS.')
        throw err
      } finally {
        this.isSubmitting = false
      }
    },
  },
})

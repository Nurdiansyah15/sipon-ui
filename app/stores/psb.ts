import { defineStore } from 'pinia'
import { useApi } from '~/composables/useApi'
import { parseApiError } from '~/utils/errorParser'
import type { ApiSuccess } from '#shared/types/ApiResponse'
import type {
  SettingResponse,
  PendaftarResponse,
  UpsertFormulirRequest,
  DokumenPresignRequest,
  DokumenPresignResponse,
  DokumenConfirmRequest,
  DokumenConfirmResponse,
  DokumenItemResponse,
  ReviewResponse,
  MessageResponse,
} from '#shared/types/Psb'

interface PsbState {
  setting: SettingResponse | null
  pendaftar: PendaftarResponse | null
  dokumen: DokumenItemResponse[]
  reviews: ReviewResponse[]
  isLoading: boolean
  isSubmitting: boolean
  error: string | null
  notFound: boolean
  noActiveSetting: boolean
}

export const usePsbStore = defineStore('psb', {
  state: (): PsbState => ({
    setting: null,
    pendaftar: null,
    dokumen: [],
    reviews: [],
    isLoading: false,
    isSubmitting: false,
    error: null,
    notFound: false,
    noActiveSetting: false,
  }),

  getters: {
    isDraft: (state) => state.pendaftar?.status === 'draft',
    isDiajukan: (state) => state.pendaftar?.status === 'diajukan',
    isPerluRevisi: (state) => state.pendaftar?.status === 'perlu_revisi',
    isDitolak: (state) => state.pendaftar?.status === 'ditolak',
    isDiterima: (state) => state.pendaftar?.status === 'diterima',
    isMengundurkanDiri: (state) => state.pendaftar?.status === 'mengundurkan_diri',
    isDaftarUlang: (state) => state.pendaftar?.status === 'daftar_ulang',
    isPerluRevisiDaftarUlang: (state) => state.pendaftar?.status === 'perlu_revisi_daftar_ulang',
    isSelesai: (state) => state.pendaftar?.status === 'selesai',
    isTerminal: (state) => ['ditolak', 'mengundurkan_diri', 'selesai'].includes(state.pendaftar?.status ?? ''),
    canEditForm: (state) => ['draft', 'perlu_revisi'].includes(state.pendaftar?.status ?? ''),
    canSubmitDaftarUlang: (state) => ['diterima', 'perlu_revisi_daftar_ulang'].includes(state.pendaftar?.status ?? ''),
    hasPendaftaran: (state) => state.pendaftar !== null,
    settingActive: (state) => state.setting !== null && state.setting.status === 'active',
  },

  actions: {
    async fetchActiveSetting() {
      this.isLoading = true
      this.error = null
      this.noActiveSetting = false
      try {
        const api = useApi()
        const res = await api.get<ApiSuccess<SettingResponse>>('/api/v1/web/psb/setting/active')
        this.setting = res.data
      } catch (err: any) {
        if (err?.statusCode === 404 || err?.data?.status_code === 404) {
          this.noActiveSetting = true
          this.setting = null
        } else {
          this.error = parseApiError(err, 'Gagal memuat periode PSB.')
        }
      } finally {
        this.isLoading = false
      }
    },

    async fetchPendaftaran() {
      this.isLoading = true
      this.error = null
      this.notFound = false
      try {
        const api = useApi()
        const res = await api.get<ApiSuccess<PendaftarResponse>>('/api/v1/web/psb/pendaftaran')
        this.pendaftar = res.data
      } catch (err: any) {
        if (err?.statusCode === 404 || err?.data?.status_code === 404) {
          this.notFound = true
          this.pendaftar = null
        } else {
          this.error = parseApiError(err, 'Gagal memuat data pendaftaran.')
        }
      } finally {
        this.isLoading = false
      }
    },

    async upsertFormulir(payload: UpsertFormulirRequest) {
      this.isSubmitting = true
      this.error = null
      try {
        const api = useApi()
        const body = { ...payload }
        if (body.dob) {
          body.dob = new Date(body.dob).toISOString()
        }
        const res = await api.put<ApiSuccess<PendaftarResponse>>('/api/v1/web/psb/pendaftaran', body)
        this.pendaftar = res.data
        this.notFound = false
      } catch (err) {
        this.error = parseApiError(err, 'Gagal menyimpan formulir.')
        throw err
      } finally {
        this.isSubmitting = false
      }
    },

    async submitPendaftaran() {
      this.isSubmitting = true
      this.error = null
      try {
        const api = useApi()
        const res = await api.post<ApiSuccess<MessageResponse>>('/api/v1/web/psb/pendaftaran/submit')
        return res.data
      } catch (err) {
        this.error = parseApiError(err, 'Gagal mengajukan pendaftaran.')
        throw err
      } finally {
        this.isSubmitting = false
      }
    },

    async submitDaftarUlang() {
      this.isSubmitting = true
      this.error = null
      try {
        const api = useApi()
        const res = await api.post<ApiSuccess<MessageResponse>>('/api/v1/web/psb/daftar-ulang/submit')
        return res.data
      } catch (err) {
        this.error = parseApiError(err, 'Gagal mengajukan daftar ulang.')
        throw err
      } finally {
        this.isSubmitting = false
      }
    },

    async fetchRiwayat() {
      this.isLoading = true
      this.error = null
      try {
        const api = useApi()
        const res = await api.get<ApiSuccess<ReviewResponse[]>>('/api/v1/web/psb/pendaftaran/riwayat')
        this.reviews = res.data
      } catch (err) {
        this.error = parseApiError(err, 'Gagal memuat riwayat.')
      } finally {
        this.isLoading = false
      }
    },

    async fetchDokumen() {
      this.error = null
      try {
        const api = useApi()
        const res = await api.get<ApiSuccess<DokumenItemResponse[]>>('/api/v1/web/psb/dokumen')
        this.dokumen = res.data
      } catch (err) {
        this.error = parseApiError(err, 'Gagal memuat dokumen.')
      }
    },

    async requestDokumenPresign(payload: DokumenPresignRequest): Promise<DokumenPresignResponse> {
      try {
        const api = useApi()
        const res = await api.post<ApiSuccess<DokumenPresignResponse>>('/api/v1/web/psb/dokumen/presign', payload)
        return res.data
      } catch (err) {
        this.error = parseApiError(err, 'Gagal membuat presign URL.')
        throw err
      }
    },

    async confirmDokumen(payload: DokumenConfirmRequest): Promise<DokumenConfirmResponse> {
      try {
        const api = useApi()
        const res = await api.post<ApiSuccess<DokumenConfirmResponse>>('/api/v1/web/psb/dokumen/confirm', payload)
        return res.data
      } catch (err) {
        this.error = parseApiError(err, 'Gagal mengonfirmasi dokumen.')
        throw err
      }
    },

    async deleteDokumen(id: string) {
      this.isSubmitting = true
      this.error = null
      try {
        const api = useApi()
        const res = await api.delete<ApiSuccess<MessageResponse>>(`/api/v1/web/psb/dokumen/${id}`)
        return res.data
      } catch (err) {
        this.error = parseApiError(err, 'Gagal menghapus dokumen.')
        throw err
      } finally {
        this.isSubmitting = false
      }
    },
  },
})

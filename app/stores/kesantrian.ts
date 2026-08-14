import { defineStore } from 'pinia'
import { useApi } from '~/composables/useApi'
import { useAuthStore } from '~/stores/auth'
import { getErrorStatus, parseApiError } from '~/utils/errorParser'
import type { ApiSuccess, ApiMeta } from '#shared/types/ApiResponse'
import type {
  SantriItem,
  CreateSantriRequest,
  CreateSantriResponse,
  ListSantriQuery,
  ImportSantriResponse,
  SantriRequestItem,
  ListSantriRequestsQuery,
  ApproveSantriRequestPayload,
  RejectSantriRequestPayload,
  DokumenItem,
  RejectDokumenPayload,
  SantriProfile,
  UpdateSantriProfileRequest,
  RequestSantriResult,
  DokumenPresignPayload,
  SantriDokumenPresignResponse,
  DokumenConfirmPayload,
  SantriDokumenConfirmResponse,
  DokumenAccessResult,
} from '#shared/types/Kesantrian'

interface KesantrianState {
  santriList: SantriItem[]
  santriListMeta: ApiMeta | null
  isLoadingSantri: boolean

  santriDetail: SantriProfile | null
  isLoadingSantriDetail: boolean

  requests: SantriRequestItem[]
  requestsMeta: ApiMeta | null
  isLoadingRequests: boolean

  dokumenList: DokumenItem[]
  isLoadingDokumen: boolean

  isSubmitting: boolean
  error: string | null

  // Password satu-kali dari createSantri — sama pola dengan userManagement
  // store, TIDAK boleh persist. Modal bertanggung jawab menampilkannya sekali
  // lalu membuangnya lewat clearOneTimePassword().
  oneTimePassword: string | null

  // ── Self-service (profil & dokumen milik santri yang sedang login) ────────
  myProfile: SantriProfile | null
  isLoadingMyProfile: boolean
  myDokumen: DokumenItem[]
  isLoadingMyDokumen: boolean
}

export const useKesantrianStore = defineStore('kesantrian', {
  state: (): KesantrianState => ({
    santriList: [],
    santriListMeta: null,
    isLoadingSantri: false,

    santriDetail: null,
    isLoadingSantriDetail: false,

    requests: [],
    requestsMeta: null,
    isLoadingRequests: false,

    dokumenList: [],
    isLoadingDokumen: false,

    isSubmitting: false,
    error: null,

    oneTimePassword: null,

    myProfile: null,
    isLoadingMyProfile: false,
    myDokumen: [],
    isLoadingMyDokumen: false,
  }),

  actions: {
    async fetchSantriList(query: ListSantriQuery = {}) {
      this.isLoadingSantri = true
      this.error = null
      try {
        const api = useApi()
        const res = await api.get<ApiSuccess<SantriItem[]>>('/api/v1/web/santri/admin', {
          query: {
            page: query.page ?? 1,
            limit: query.limit ?? 10,
            sort_by: query.sort_by,
            sort_type: query.sort_type,
            nis: query.nis,
          },
        })
        this.santriList = res.data
        this.santriListMeta = res.meta
      } catch (err) {
        this.error = parseApiError(err, 'Gagal memuat daftar santri.')
        throw err
      } finally {
        this.isLoadingSantri = false
      }
    },

    async createSantri(payload: CreateSantriRequest): Promise<CreateSantriResponse> {
      this.isSubmitting = true
      this.error = null
      try {
        const api = useApi()
        const res = await api.post<ApiSuccess<CreateSantriResponse>>('/api/v1/web/santri/admin', payload)
        this.oneTimePassword = res.data.generated_password
        return res.data
      } catch (err) {
        this.error = parseApiError(err, 'Gagal membuat santri.')
        throw err
      } finally {
        this.isSubmitting = false
      }
    },

    clearOneTimePassword() {
      this.oneTimePassword = null
    },

    async fetchSantriDetail(santriId: string) {
      this.isLoadingSantriDetail = true
      this.error = null
      try {
        const api = useApi()
        const res = await api.get<ApiSuccess<SantriProfile>>(`/api/v1/web/santri/admin/${santriId}`)
        this.santriDetail = res.data
        return res.data
      } catch (err) {
        this.santriDetail = null
        this.error = parseApiError(err, 'Gagal memuat detail santri.')
        throw err
      } finally {
        this.isLoadingSantriDetail = false
      }
    },

    // importSantri bypasses useApi() deliberately — that composable always
    // forces Content-Type: application/json, which would break a multipart
    // file upload (the browser needs to set its own boundary). Auth is
    // still attached manually so this hits the same protected endpoint.
    async importSantri(file: File): Promise<ImportSantriResponse> {
      this.isSubmitting = true
      this.error = null
      try {
        const config = useRuntimeConfig()
        const authStore = useAuthStore()
        const formData = new FormData()
        formData.append('file', file)

        const res = await $fetch<ApiSuccess<ImportSantriResponse>>(
          `${config.public.apiBase}/api/v1/web/santri/admin/import`,
          {
            method: 'POST',
            body: formData,
            headers: authStore.token ? { Authorization: `Bearer ${authStore.token}` } : {},
          },
        )
        return res.data
      } catch (err) {
        this.error = parseApiError(err, 'Gagal mengimpor santri.')
        throw err
      } finally {
        this.isSubmitting = false
      }
    },

    // Sama alasannya seperti importSantri — respons di sini binary (.xlsx),
    // bukan JSON, jadi tidak bisa lewat useApi().
    async downloadImportTemplate(): Promise<Blob> {
      const config = useRuntimeConfig()
      const authStore = useAuthStore()
      return await $fetch<Blob>(`${config.public.apiBase}/api/v1/web/santri/admin/import/template`, {
        method: 'GET',
        responseType: 'blob',
        headers: authStore.token ? { Authorization: `Bearer ${authStore.token}` } : {},
      })
    },

    async fetchSantriRequests(query: ListSantriRequestsQuery = {}) {
      this.isLoadingRequests = true
      this.error = null
      try {
        const api = useApi()
        const res = await api.get<ApiSuccess<SantriRequestItem[]>>('/api/v1/web/santri/admin/requests', {
          query: {
            page: query.page,
            limit: query.limit,
            sort_by: query.sort_by,
            sort_type: query.sort_type,
            status: query.status,
          },
        })
        this.requests = res.data
        this.requestsMeta = res.meta
      } catch (err) {
        this.error = parseApiError(err, 'Gagal memuat daftar permintaan santri.')
        throw err
      } finally {
        this.isLoadingRequests = false
      }
    },

    async approveSantriRequest(id: string, payload: ApproveSantriRequestPayload) {
      this.isSubmitting = true
      this.error = null
      try {
        const api = useApi()
        await api.post(`/api/v1/web/santri/admin/requests/${id}/approve`, payload)
      } catch (err) {
        this.error = parseApiError(err, 'Gagal menyetujui permintaan santri.')
        throw err
      } finally {
        this.isSubmitting = false
      }
    },

    async rejectSantriRequest(id: string, payload: RejectSantriRequestPayload) {
      this.isSubmitting = true
      this.error = null
      try {
        const api = useApi()
        await api.post(`/api/v1/web/santri/admin/requests/${id}/reject`, payload)
      } catch (err) {
        this.error = parseApiError(err, 'Gagal menolak permintaan santri.')
        throw err
      } finally {
        this.isSubmitting = false
      }
    },

    async fetchSantriDokumen(santriId: string, kind?: string) {
      this.isLoadingDokumen = true
      this.error = null
      try {
        const api = useApi()
        const res = await api.get<ApiSuccess<DokumenItem[]>>(
          `/api/v1/web/santri/admin/${santriId}/dokumen`,
          { query: { kind } },
        )
        this.dokumenList = res.data
      } catch (err) {
        this.error = parseApiError(err, 'Gagal memuat dokumen santri.')
        throw err
      } finally {
        this.isLoadingDokumen = false
      }
    },

    async verifyDokumen(dokumenId: string) {
      this.isSubmitting = true
      this.error = null
      try {
        const api = useApi()
        await api.post(`/api/v1/web/santri/admin/verify/${dokumenId}`)
      } catch (err) {
        this.error = parseApiError(err, 'Gagal memverifikasi dokumen.')
        throw err
      } finally {
        this.isSubmitting = false
      }
    },

    async rejectDokumen(dokumenId: string, payload: RejectDokumenPayload) {
      this.isSubmitting = true
      this.error = null
      try {
        const api = useApi()
        await api.post(`/api/v1/web/santri/admin/reject/${dokumenId}`, payload)
      } catch (err) {
        this.error = parseApiError(err, 'Gagal menolak dokumen.')
        throw err
      } finally {
        this.isSubmitting = false
      }
    },

    // ── Self-service ─────────────────────────────────────────────────────────

    async fetchMyProfile() {
      this.isLoadingMyProfile = true
      this.error = null
      try {
        const api = useApi()
        const res = await api.get<ApiSuccess<SantriProfile>>('/api/v1/web/santri/profile')
        this.myProfile = res.data
      } catch (err) {
        this.myProfile = null
        if (getErrorStatus(err) === 404) return
        this.error = parseApiError(err, 'Gagal memuat profil santri.')
        throw err
      } finally {
        this.isLoadingMyProfile = false
      }
    },

    async updateMyProfile(payload: UpdateSantriProfileRequest) {
      this.isSubmitting = true
      this.error = null
      try {
        const api = useApi()
        await api.put('/api/v1/web/santri/profile', payload)
        await this.fetchMyProfile()
      } catch (err) {
        this.error = parseApiError(err, 'Gagal memperbarui profil santri.')
        throw err
      } finally {
        this.isSubmitting = false
      }
    },

    async requestToBecomeSantri(): Promise<RequestSantriResult> {
      this.isSubmitting = true
      this.error = null
      try {
        const api = useApi()
        const res = await api.post<ApiSuccess<RequestSantriResult>>('/api/v1/web/santri/request')
        return res.data
      } catch (err) {
        this.error = parseApiError(err, 'Gagal mengajukan permintaan menjadi santri.')
        throw err
      } finally {
        this.isSubmitting = false
      }
    },

    async fetchMyDokumen(kind?: string) {
      this.isLoadingMyDokumen = true
      this.error = null
      try {
        const api = useApi()
        const res = await api.get<ApiSuccess<DokumenItem[]>>('/api/v1/web/santri/dokumen', {
          query: { kind },
        })
        this.myDokumen = res.data
      } catch (err) {
        this.error = parseApiError(err, 'Gagal memuat dokumen.')
        throw err
      } finally {
        this.isLoadingMyDokumen = false
      }
    },

    async presignMyDokumen(payload: DokumenPresignPayload): Promise<SantriDokumenPresignResponse> {
      const api = useApi()
      const res = await api.post<ApiSuccess<SantriDokumenPresignResponse>>('/api/v1/web/santri/dokumen/presign', payload)
      return res.data
    },

    async confirmMyDokumen(payload: DokumenConfirmPayload): Promise<SantriDokumenConfirmResponse> {
      const api = useApi()
      const res = await api.post<ApiSuccess<SantriDokumenConfirmResponse>>('/api/v1/web/santri/dokumen/confirm', payload)
      return res.data
    },

    async accessMyDokumen(dokumenId: string): Promise<DokumenAccessResult> {
      const api = useApi()
      const res = await api.get<ApiSuccess<DokumenAccessResult>>(`/api/v1/web/santri/dokumen/${dokumenId}/access`)
      return res.data
    },

    async deleteMyDokumen(dokumenId: string) {
      this.isSubmitting = true
      this.error = null
      try {
        const api = useApi()
        await api.delete(`/api/v1/web/santri/dokumen/${dokumenId}`)
      } catch (err) {
        this.error = parseApiError(err, 'Gagal menghapus dokumen.')
        throw err
      } finally {
        this.isSubmitting = false
      }
    },
  },
})

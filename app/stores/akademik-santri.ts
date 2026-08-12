import { defineStore } from 'pinia'
import { useApi } from '~/composables/useApi'
import { parseApiError } from '~/utils/errorParser'
import type { ApiSuccess } from '#shared/types/ApiResponse'
import type { AcademicPeriod, SantriRegistration } from '#shared/types/Akademik'
import type {
  CheckinResponse,
  HerregistrasiDocument,
  HerregistrasiDocumentConfirmRequest,
  HerregistrasiDocumentDownload,
  HerregistrasiDocumentPresignResponse,
  MyActivity,
  MyAttendanceResponse,
  MyHerregistrasiDetail,
  MySchedule,
  MySummary,
  PresensiAttendanceItem,
  PresensiSessionInfo,
} from '#shared/types/AkademikSantri'

interface AkademikSantriState {
  summary: MySummary | null
  activities: MyActivity[]
  schedules: MySchedule[]
  myHerreg: MyHerregistrasiDetail | null
  myAttendance: MyAttendanceResponse | null
  isLoading: boolean
  isSubmitting: boolean
  error: string | null
}

export const useAkademikSantriStore = defineStore('akademik-santri', {
  state: (): AkademikSantriState => ({
    summary: null,
    activities: [],
    schedules: [],
    myHerreg: null,
    myAttendance: null,
    isLoading: false,
    isSubmitting: false,
    error: null,
  }),

  getters: {
    activePeriod(state) {
      return state.summary?.academic_period ?? null
    },
    hasActivePeriod(state) {
      return state.summary?.academic_period != null
    },
    herregistrasi(state) {
      return state.summary?.herregistrasi
    },
    program(state) {
      return state.summary?.program ?? null
    },
  },

  actions: {
    async fetchSummary() {
      this.isLoading = true
      this.error = null
      try {
        const api = useApi()
        const res = await api.get<ApiSuccess<MySummary>>('/api/v1/web/akademik/my/summary')
        this.summary = res.data
      } catch (err) {
        this.error = parseApiError(err, 'Gagal memuat ringkasan akademik.')
        throw err
      } finally {
        this.isLoading = false
      }
    },

    async fetchActivities() {
      this.isLoading = true
      this.error = null
      try {
        const api = useApi()
        const res = await api.get<ApiSuccess<MyActivity[]>>('/api/v1/web/akademik/my/kegiatan')
        this.activities = res.data ?? []
      } catch (err) {
        this.error = parseApiError(err, 'Gagal memuat daftar kegiatan.')
        throw err
      } finally {
        this.isLoading = false
      }
    },

    async fetchSchedules() {
      this.isLoading = true
      this.error = null
      try {
        const api = useApi()
        const res = await api.get<ApiSuccess<MySchedule[]>>('/api/v1/web/akademik/my/jadwal')
        this.schedules = res.data ?? []
      } catch (err) {
        this.error = parseApiError(err, 'Gagal memuat daftar jadwal.')
        throw err
      } finally {
        this.isLoading = false
      }
    },

    async applyHerregistrasi(): Promise<SantriRegistration> {
      this.isSubmitting = true
      this.error = null
      try {
        const api = useApi()
        const res = await api.post<ApiSuccess<SantriRegistration>>('/api/v1/web/akademik/my/herregistrasi')
        return res.data
      } catch (err) {
        this.error = parseApiError(err, 'Gagal memulai herregistrasi.')
        throw err
      } finally {
        this.isSubmitting = false
      }
    },

    async submitHerreg(): Promise<SantriRegistration> {
      this.isSubmitting = true
      this.error = null
      try {
        const api = useApi()
        const res = await api.post<ApiSuccess<SantriRegistration>>('/api/v1/web/akademik/my/herregistrasi/submit')
        return res.data
      } catch (err) {
        this.error = parseApiError(err, 'Gagal mengajukan herregistrasi.')
        throw err
      } finally {
        this.isSubmitting = false
      }
    },

    // ── Herregistrasi detail & dokumen (santri) ─────────────────────────────
    async fetchMyHerreg() {
      this.isLoading = true
      this.error = null
      try {
        const api = useApi()
        const res = await api.get<ApiSuccess<MyHerregistrasiDetail>>('/api/v1/web/akademik/my/herregistrasi')
        this.myHerreg = res.data
      } catch (err) {
        this.error = parseApiError(err, 'Gagal memuat detail herregistrasi.')
        throw err
      } finally {
        this.isLoading = false
      }
    },

    async presignDocument(payload: { kind: string; content_type: string; filename: string }): Promise<HerregistrasiDocumentPresignResponse> {
      this.isSubmitting = true
      this.error = null
      try {
        const api = useApi()
        const res = await api.post<ApiSuccess<HerregistrasiDocumentPresignResponse>>(
          '/api/v1/web/akademik/my/herregistrasi/dokumen/presign',
          payload,
        )
        return res.data
      } catch (err) {
        this.error = parseApiError(err, 'Gagal membuat presign URL.')
        throw err
      } finally {
        this.isSubmitting = false
      }
    },

    async confirmDocument(payload: HerregistrasiDocumentConfirmRequest): Promise<HerregistrasiDocument> {
      this.isSubmitting = true
      this.error = null
      try {
        const api = useApi()
        const res = await api.post<ApiSuccess<HerregistrasiDocument>>(
          '/api/v1/web/akademik/my/herregistrasi/dokumen/confirm',
          payload,
        )
        return res.data
      } catch (err) {
        this.error = parseApiError(err, 'Gagal mengkonfirmasi dokumen.')
        throw err
      } finally {
        this.isSubmitting = false
      }
    },

    async deleteDocument(id: string) {
      this.isSubmitting = true
      this.error = null
      try {
        const api = useApi()
        await api.delete(`/api/v1/web/akademik/my/herregistrasi/dokumen/${id}`)
      } catch (err) {
        this.error = parseApiError(err, 'Gagal menghapus dokumen.')
        throw err
      } finally {
        this.isSubmitting = false
      }
    },

    async downloadDocument(id: string): Promise<HerregistrasiDocumentDownload> {
      this.error = null
      try {
        const api = useApi()
        const res = await api.get<ApiSuccess<HerregistrasiDocumentDownload>>(
          `/api/v1/web/akademik/my/herregistrasi/dokumen/${id}/download`,
        )
        return res.data
      } catch (err) {
        this.error = parseApiError(err, 'Gagal membuat URL unduhan.')
        throw err
      }
    },

    // ── Riwayat absensi santri ────────────────────────────────────────────────
    async fetchMyAttendance(query: { academic_period_id?: string; activity_schedule_id?: string } = {}) {
      this.isLoading = true
      this.error = null
      try {
        const api = useApi()
        const res = await api.get<ApiSuccess<MyAttendanceResponse>>('/api/v1/web/akademik/my/absensi', {
          query: {
            academic_period_id: query.academic_period_id,
            activity_schedule_id: query.activity_schedule_id,
          },
        })
        this.myAttendance = res.data
      } catch (err) {
        this.error = parseApiError(err, 'Gagal memuat riwayat absensi.')
        throw err
      } finally {
        this.isLoading = false
      }
    },

    async fetchAttendancePeriods(): Promise<AcademicPeriod[]> {
      const api = useApi()
      const res = await api.get<ApiSuccess<AcademicPeriod[]>>('/api/v1/web/akademik/my/absensi/periods')
      return res.data ?? []
    },

    // ── Presensi (check-in via NIS, tanpa auth) ──────────────────────────────
    async fetchPresensiSessionInfo(sessionId: string): Promise<PresensiSessionInfo> {
      const config = useRuntimeConfig()
      const res = await $fetch<ApiSuccess<PresensiSessionInfo>>(`${config.public.apiBase}/api/v1/web/akademik/presensi/${sessionId}`)
      return res.data
    },

    async checkinPresensi(sessionId: string, nis: string): Promise<CheckinResponse> {
      const config = useRuntimeConfig()
      const res = await $fetch<ApiSuccess<CheckinResponse>>(`${config.public.apiBase}/api/v1/web/akademik/presensi/${sessionId}/checkin`, {
        method: 'POST',
        body: { nis },
      })
      return res.data
    },

    async fetchPresensiAttendance(sessionId: string): Promise<PresensiAttendanceItem[]> {
      const config = useRuntimeConfig()
      const res = await $fetch<ApiSuccess<PresensiAttendanceItem[]>>(`${config.public.apiBase}/api/v1/web/akademik/presensi/${sessionId}/attendance`)
      return res.data ?? []
    },

    reset() {
      this.summary = null
      this.activities = []
      this.schedules = []
      this.myHerreg = null
      this.myAttendance = null
      this.isLoading = false
      this.isSubmitting = false
      this.error = null
    },
  },
})

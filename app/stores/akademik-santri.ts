import { defineStore } from 'pinia'
import { useApi } from '~/composables/useApi'
import { parseApiError } from '~/utils/errorParser'
import type { ApiSuccess } from '#shared/types/ApiResponse'
import type { SantriRegistration } from '#shared/types/Akademik'
import type { MyActivity, MySchedule, MySummary } from '#shared/types/AkademikSantri'

interface AkademikSantriState {
  summary: MySummary | null
  activities: MyActivity[]
  schedules: MySchedule[]
  isLoading: boolean
  isSubmitting: boolean
  error: string | null
}

export const useAkademikSantriStore = defineStore('akademik-santri', {
  state: (): AkademikSantriState => ({
    summary: null,
    activities: [],
    schedules: [],
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
        this.error = parseApiError(err, 'Gagal mengajukan herregistrasi.')
        throw err
      } finally {
        this.isSubmitting = false
      }
    },

    reset() {
      this.summary = null
      this.activities = []
      this.schedules = []
      this.isLoading = false
      this.isSubmitting = false
      this.error = null
    },
  },
})

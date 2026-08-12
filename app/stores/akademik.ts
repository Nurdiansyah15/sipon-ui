import { defineStore } from 'pinia'
import { useApi } from '~/composables/useApi'
import { parseApiError } from '~/utils/errorParser'
import type { ApiSuccess, ApiMeta } from '#shared/types/ApiResponse'
import type {
  Program,
  AcademicPeriod,
  SantriRegistration,
  Activity,
  ActivityPeriod,
  ActivityPeriodProgram,
  ActivitySchedule,
  ActivitySession,
  Attendance,
  EligibleSantri,
  CreateProgramRequest,
  UpdateProgramRequest,
  CreateAcademicPeriodRequest,
  UpdateAcademicPeriodRequest,
  CreateSantriRegistrationRequest,
  CreateActivityRequest,
  UpdateActivityRequest,
  CreateActivityPeriodRequest,
  AssignProgramRequest,
  CreateScheduleRequest,
  UpdateScheduleRequest,
  CreateSessionRequest,
  GenerateSessionsRequest,
  GenerateSessionsResponse,
  RecordAttendanceRequest,
  UpdateAttendanceRequest,
  ProgramListQuery,
  AcademicPeriodListQuery,
  SantriRegistrationListQuery,
  ActivityListQuery,
  ActivityPeriodListQuery,
  ActivitySessionListQuery,
  AkademikSettingResponse,
  UpdateAkademikSettingRequest,
  SantriProgramAdminResponse,
  SantriProgramListItem,
  ProgramTransferRequest,
  RequestProgramTransferRequest,
  RejectProgramTransferRequest,
  ProgramTransferRequestListQuery,
  SyncFingerprintResponse,
} from '#shared/types/Akademik'
import type {
  HerregistrasiDocument,
  HerregistrasiDocumentRequirement,
} from '#shared/types/AkademikSantri'

interface AkademikState {
  settings: AkademikSettingResponse | null
  programs: Program[]
  programsMeta: ApiMeta | null
  periods: AcademicPeriod[]
  periodsMeta: ApiMeta | null
  // Daftar periode kerja lengkap untuk konteks operasional (dropdown pemilihan
  // periode kerja). Dipisah dari `periods` karena daftar `periods` bisa
  // tertimpa daftar terfilter/halaman dari halaman manajemen periode maupun
  // ringkasan dashboard (fetch dengan limit kecil).
  workPeriods: AcademicPeriod[]
  registrations: SantriRegistration[]
  registrationsMeta: ApiMeta | null
  activities: Activity[]
  activitiesMeta: ApiMeta | null
  activityPeriods: ActivityPeriod[]
  activityPeriodsMeta: ApiMeta | null
  periodPrograms: ActivityPeriodProgram[]
  schedules: ActivitySchedule[]
  currentSchedule: ActivitySchedule | null
  sessions: ActivitySession[]
  sessionsMeta: ApiMeta | null
  currentSession: ActivitySession | null
  attendances: Attendance[]
  eligibleSantri: EligibleSantri[]
  periodDocRequirements: HerregistrasiDocumentRequirement[]
  registrationDocuments: HerregistrasiDocument[]
  santriProgram: SantriProgramAdminResponse | null
  santriProgramList: SantriProgramListItem[]
  santriProgramListMeta: ApiMeta | null
  programTransferRequests: ProgramTransferRequest[]
  programTransferRequestsMeta: ApiMeta | null
  isLoading: boolean
  isLoadingSantri: boolean
  isSubmitting: boolean
  error: string | null
}

const base = '/api/v1/web/akademik'

export const useAkademikStore = defineStore('akademik', {
  state: (): AkademikState => ({
    settings: null,
    programs: [],
    programsMeta: null,
    periods: [],
    periodsMeta: null,
    workPeriods: [],
    registrations: [],
    registrationsMeta: null,
    activities: [],
    activitiesMeta: null,
    activityPeriods: [],
    activityPeriodsMeta: null,
    periodPrograms: [],
    schedules: [],
    currentSchedule: null,
    sessions: [],
    sessionsMeta: null,
    currentSession: null,
    attendances: [],
    eligibleSantri: [],
    periodDocRequirements: [],
    registrationDocuments: [],
    santriProgram: null,
    santriProgramList: [],
    santriProgramListMeta: null,
    programTransferRequests: [],
    programTransferRequestsMeta: null,
    isLoading: false,
    isLoadingSantri: false,
    isSubmitting: false,
    error: null,
  }),

  actions: {
    // ── Settings ─────────────────────────────────────────────────────────────
    async fetchAkademikSettings(): Promise<AkademikSettingResponse> {
      this.isLoading = true
      this.error = null
      try {
        const api = useApi()
        const res = await api.get<ApiSuccess<AkademikSettingResponse>>(`${base}/settings`)
        this.settings = res.data
        return res.data
      } catch (err) {
        this.error = parseApiError(err, 'Gagal memuat pengaturan akademik.')
        throw err
      } finally {
        this.isLoading = false
      }
    },

    async updateAkademikSettings(payload: UpdateAkademikSettingRequest): Promise<AkademikSettingResponse> {
      this.isSubmitting = true
      this.error = null
      try {
        const api = useApi()
        const res = await api.put<ApiSuccess<AkademikSettingResponse>>(`${base}/settings`, payload)
        this.settings = res.data
        return res.data
      } catch (err) {
        this.error = parseApiError(err, 'Gagal memperbarui pengaturan akademik.')
        throw err
      } finally {
        this.isSubmitting = false
      }
    },

    // ── Program ──────────────────────────────────────────────────────────────
    async fetchPrograms(query: ProgramListQuery = {}) {
      this.isLoading = true
      this.error = null
      try {
        const api = useApi()
        const res = await api.get<ApiSuccess<Program[]>>(`${base}/programs`, {
          query: {
            status: query.status,
            search: query.search,
            page: query.page ?? 1,
            limit: query.limit ?? 10,
          },
        })
        this.programs = res.data
        this.programsMeta = res.meta
      } catch (err) {
        this.error = parseApiError(err, 'Gagal memuat daftar program.')
        throw err
      } finally {
        this.isLoading = false
      }
    },

    async createProgram(payload: CreateProgramRequest): Promise<Program> {
      this.isSubmitting = true
      this.error = null
      try {
        const api = useApi()
        const res = await api.post<ApiSuccess<Program>>(`${base}/programs`, payload)
        return res.data
      } catch (err) {
        this.error = parseApiError(err, 'Gagal membuat program.')
        throw err
      } finally {
        this.isSubmitting = false
      }
    },

    async updateProgram(id: string, payload: UpdateProgramRequest): Promise<Program> {
      this.isSubmitting = true
      this.error = null
      try {
        const api = useApi()
        const res = await api.put<ApiSuccess<Program>>(`${base}/programs/${id}`, payload)
        return res.data
      } catch (err) {
        this.error = parseApiError(err, 'Gagal memperbarui program.')
        throw err
      } finally {
        this.isSubmitting = false
      }
    },

    // ── Santri Program Management (Admin) ───────────────────────────────────
    async fetchSantriProgram(santriId: string): Promise<SantriProgramAdminResponse> {
      this.isLoading = true
      this.error = null
      try {
        const api = useApi()
        const res = await api.get<ApiSuccess<SantriProgramAdminResponse>>(`${base}/admin/santri/${santriId}/program`)
        this.santriProgram = res.data
        return res.data
      } catch (err) {
        this.error = parseApiError(err, 'Gagal memuat program santri.')
        throw err
      } finally {
        this.isLoading = false
      }
    },

    async assignSantriProgram(santriId: string, programId: string): Promise<SantriProgramAdminResponse> {
      this.isSubmitting = true
      this.error = null
      try {
        const api = useApi()
        const res = await api.put<ApiSuccess<SantriProgramAdminResponse>>(
          `${base}/admin/santri/${santriId}/program`,
          { program_id: programId },
        )
        this.santriProgram = res.data
        return res.data
      } catch (err) {
        this.error = parseApiError(err, 'Gagal mengubah program santri.')
        throw err
      } finally {
        this.isSubmitting = false
      }
    },

    async fetchSantriProgramList(query: { search?: string; page?: number; limit?: number } = {}) {
      this.isLoading = true
      this.error = null
      try {
        const api = useApi()
        const res = await api.get<ApiSuccess<SantriProgramListItem[]>>(`${base}/admin/santri`, {
          query: {
            search: query.search,
            page: query.page ?? 1,
            limit: query.limit ?? 10,
          },
        })
        this.santriProgramList = res.data ?? []
        this.santriProgramListMeta = res.meta
      } catch (err) {
        this.error = parseApiError(err, 'Gagal memuat daftar santri.')
        throw err
      } finally {
        this.isLoading = false
      }
    },

    async fetchProgramTransferRequests(query: ProgramTransferRequestListQuery = {}) {
      this.isLoading = true
      this.error = null
      try {
        const api = useApi()
        const res = await api.get<ApiSuccess<ProgramTransferRequest[]>>(`${base}/admin/program-transfer-requests`, {
          query: {
            status: query.status,
            page: query.page ?? 1,
            limit: query.limit ?? 10,
          },
        })
        this.programTransferRequests = res.data ?? []
        this.programTransferRequestsMeta = res.meta
      } catch (err) {
        this.error = parseApiError(err, 'Gagal memuat daftar permintaan pindah program.')
        throw err
      } finally {
        this.isLoading = false
      }
    },

    async approveProgramTransferRequest(id: string): Promise<ProgramTransferRequest> {
      this.isSubmitting = true
      this.error = null
      try {
        const api = useApi()
        const res = await api.post<ApiSuccess<ProgramTransferRequest>>(`${base}/admin/program-transfer-requests/${id}/approve`)
        return res.data
      } catch (err) {
        this.error = parseApiError(err, 'Gagal menyetujui permintaan pindah program.')
        throw err
      } finally {
        this.isSubmitting = false
      }
    },

    async rejectProgramTransferRequest(id: string, adminNotes?: string): Promise<ProgramTransferRequest> {
      this.isSubmitting = true
      this.error = null
      try {
        const api = useApi()
        const res = await api.post<ApiSuccess<ProgramTransferRequest>>(
          `${base}/admin/program-transfer-requests/${id}/reject`,
          { admin_notes: adminNotes || undefined },
        )
        return res.data
      } catch (err) {
        this.error = parseApiError(err, 'Gagal menolak permintaan pindah program.')
        throw err
      } finally {
        this.isSubmitting = false
      }
    },

    // ── Academic Period ──────────────────────────────────────────────────────
    async fetchPeriods(query: AcademicPeriodListQuery = {}) {
      this.isLoading = true
      this.error = null
      try {
        const api = useApi()
        const res = await api.get<ApiSuccess<AcademicPeriod[]>>(`${base}/periods`, {
          query: {
            status: query.status,
            search: query.search,
            page: query.page ?? 1,
            limit: query.limit ?? 10,
          },
        })
        this.periods = res.data
        this.periodsMeta = res.meta
      } catch (err) {
        this.error = parseApiError(err, 'Gagal memuat daftar periode akademik.')
        throw err
      } finally {
        this.isLoading = false
      }
    },

    // List periode kerja lengkap (limit 100, tanpa filter) untuk konteks
    // operasional. Selalu fetch penuh supaya dropdown pemilihan periode tidak
    // kehilangan opsi akibat daftar `periods` yang tertimpa daftar terfilter.
    async fetchWorkPeriods() {
      this.isLoading = true
      this.error = null
      try {
        const api = useApi()
        const res = await api.get<ApiSuccess<AcademicPeriod[]>>(`${base}/periods`, {
          query: { page: 1, limit: 100 },
        })
        this.workPeriods = res.data
      } catch (err) {
        this.error = parseApiError(err, 'Gagal memuat daftar periode kerja.')
        throw err
      } finally {
        this.isLoading = false
      }
    },

    async createPeriod(payload: CreateAcademicPeriodRequest): Promise<AcademicPeriod> {
      this.isSubmitting = true
      this.error = null
      try {
        const api = useApi()
        const res = await api.post<ApiSuccess<AcademicPeriod>>(`${base}/periods`, payload)
        return res.data
      } catch (err) {
        this.error = parseApiError(err, 'Gagal membuat periode akademik.')
        throw err
      } finally {
        this.isSubmitting = false
      }
    },

    async updatePeriod(id: string, payload: UpdateAcademicPeriodRequest): Promise<AcademicPeriod> {
      this.isSubmitting = true
      this.error = null
      try {
        const api = useApi()
        const res = await api.put<ApiSuccess<AcademicPeriod>>(`${base}/periods/${id}`, payload)
        return res.data
      } catch (err) {
        this.error = parseApiError(err, 'Gagal memperbarui periode akademik.')
        throw err
      } finally {
        this.isSubmitting = false
      }
    },

    async openPeriod(id: string): Promise<AcademicPeriod> {
      this.isSubmitting = true
      this.error = null
      try {
        const api = useApi()
        const res = await api.post<ApiSuccess<AcademicPeriod>>(`${base}/periods/${id}/open`)
        return res.data
      } catch (err) {
        this.error = parseApiError(err, 'Gagal membuka periode akademik.')
        throw err
      } finally {
        this.isSubmitting = false
      }
    },

    async closePeriod(id: string): Promise<AcademicPeriod> {
      this.isSubmitting = true
      this.error = null
      try {
        const api = useApi()
        const res = await api.post<ApiSuccess<AcademicPeriod>>(`${base}/periods/${id}/close`)
        return res.data
      } catch (err) {
        this.error = parseApiError(err, 'Gagal menutup periode akademik.')
        throw err
      } finally {
        this.isSubmitting = false
      }
    },

    // ── Santri Registration (herregistrasi) ──────────────────────────────────
    async fetchRegistrations(query: SantriRegistrationListQuery = {}) {
      this.isLoading = true
      this.error = null
      try {
        const api = useApi()
        const res = await api.get<ApiSuccess<SantriRegistration[]>>(`${base}/registrations`, {
          query: {
            academic_period_id: query.academic_period_id,
            santri_id: query.santri_id,
            status: query.status,
            page: query.page ?? 1,
            limit: query.limit ?? 10,
          },
        })
        this.registrations = res.data
        this.registrationsMeta = res.meta
      } catch (err) {
        this.error = parseApiError(err, 'Gagal memuat daftar registrasi.')
        throw err
      } finally {
        this.isLoading = false
      }
    },

    async createRegistration(payload: CreateSantriRegistrationRequest): Promise<SantriRegistration> {
      this.isSubmitting = true
      this.error = null
      try {
        const api = useApi()
        const res = await api.post<ApiSuccess<SantriRegistration>>(`${base}/registrations`, payload)
        return res.data
      } catch (err) {
        this.error = parseApiError(err, 'Gagal membuat registrasi.')
        throw err
      } finally {
        this.isSubmitting = false
      }
    },

    async fetchRegistration(id: string): Promise<SantriRegistration> {
      this.isLoading = true
      this.error = null
      try {
        const api = useApi()
        const res = await api.get<ApiSuccess<SantriRegistration>>(`${base}/registrations/${id}`)
        return res.data
      } catch (err) {
        this.error = parseApiError(err, 'Gagal memuat detail registrasi.')
        throw err
      } finally {
        this.isLoading = false
      }
    },

    async completeRegistration(id: string): Promise<SantriRegistration> {
      this.isSubmitting = true
      this.error = null
      try {
        const api = useApi()
        const res = await api.post<ApiSuccess<SantriRegistration>>(`${base}/registrations/${id}/complete`)
        return res.data
      } catch (err) {
        this.error = parseApiError(err, 'Gagal menyelesaikan registrasi.')
        throw err
      } finally {
        this.isSubmitting = false
      }
    },

    async cancelRegistration(id: string): Promise<SantriRegistration> {
      this.isSubmitting = true
      this.error = null
      try {
        const api = useApi()
        const res = await api.post<ApiSuccess<SantriRegistration>>(`${base}/registrations/${id}/cancel`)
        return res.data
      } catch (err) {
        this.error = parseApiError(err, 'Gagal membatalkan registrasi.')
        throw err
      } finally {
        this.isSubmitting = false
      }
    },

    async requestRevision(id: string, notes: string): Promise<SantriRegistration> {
      this.isSubmitting = true
      this.error = null
      try {
        const api = useApi()
        const res = await api.post<ApiSuccess<SantriRegistration>>(`${base}/registrations/${id}/revision`, { notes })
        return res.data
      } catch (err) {
        this.error = parseApiError(err, 'Gagal meminta revisi.')
        throw err
      } finally {
        this.isSubmitting = false
      }
    },

    // ── Blueprint dokumen herregistrasi (admin) ───────────────────────────────
    async fetchPeriodDocRequirements(periodId: string) {
      this.isLoading = true
      this.error = null
      try {
        const api = useApi()
        const res = await api.get<ApiSuccess<HerregistrasiDocumentRequirement[]>>(
          `${base}/periods/${periodId}/dokumen-requirements`,
        )
        this.periodDocRequirements = res.data ?? []
      } catch (err) {
        this.error = parseApiError(err, 'Gagal memuat dokumen herregistrasi.')
        throw err
      } finally {
        this.isLoading = false
      }
    },

    async createDocRequirement(periodId: string, payload: { kind: string; label: string; is_required?: boolean; description?: string }): Promise<HerregistrasiDocumentRequirement> {
      this.isSubmitting = true
      this.error = null
      try {
        const api = useApi()
        const res = await api.post<ApiSuccess<HerregistrasiDocumentRequirement>>(
          `${base}/periods/${periodId}/dokumen-requirements`,
          payload,
        )
        return res.data
      } catch (err) {
        this.error = parseApiError(err, 'Gagal menambahkan dokumen herregistrasi.')
        throw err
      } finally {
        this.isSubmitting = false
      }
    },

    async updateDocRequirement(id: string, payload: { label?: string; is_required?: boolean; description?: string }): Promise<HerregistrasiDocumentRequirement> {
      this.isSubmitting = true
      this.error = null
      try {
        const api = useApi()
        const res = await api.put<ApiSuccess<HerregistrasiDocumentRequirement>>(
          `${base}/periods/dokumen-requirements/${id}`,
          payload,
        )
        return res.data
      } catch (err) {
        this.error = parseApiError(err, 'Gagal memperbarui dokumen herregistrasi.')
        throw err
      } finally {
        this.isSubmitting = false
      }
    },

    async deleteDocRequirement(id: string) {
      this.isSubmitting = true
      this.error = null
      try {
        const api = useApi()
        await api.delete(`${base}/periods/dokumen-requirements/${id}`)
      } catch (err) {
        this.error = parseApiError(err, 'Gagal menghapus dokumen herregistrasi.')
        throw err
      } finally {
        this.isSubmitting = false
      }
    },

    // ── Review dokumen herreg (admin) ─────────────────────────────────────────
    async fetchRegistrationDocuments(regId: string) {
      this.isLoading = true
      this.error = null
      try {
        const api = useApi()
        const res = await api.get<ApiSuccess<HerregistrasiDocument[]>>(`${base}/registrations/${regId}/dokumen`)
        this.registrationDocuments = res.data ?? []
      } catch (err) {
        this.error = parseApiError(err, 'Gagal memuat dokumen herregistrasi.')
        throw err
      } finally {
        this.isLoading = false
      }
    },

    async verifyRegistrationDocument(regId: string, docId: string): Promise<HerregistrasiDocument> {
      this.isSubmitting = true
      this.error = null
      try {
        const api = useApi()
        const res = await api.post<ApiSuccess<HerregistrasiDocument>>(
          `${base}/registrations/${regId}/dokumen/${docId}/verify`,
        )
        return res.data
      } catch (err) {
        this.error = parseApiError(err, 'Gagal memverifikasi dokumen.')
        throw err
      } finally {
        this.isSubmitting = false
      }
    },

    async rejectRegistrationDocument(regId: string, docId: string, notes: string): Promise<HerregistrasiDocument> {
      this.isSubmitting = true
      this.error = null
      try {
        const api = useApi()
        const res = await api.post<ApiSuccess<HerregistrasiDocument>>(
          `${base}/registrations/${regId}/dokumen/${docId}/reject`,
          { notes },
        )
        return res.data
      } catch (err) {
        this.error = parseApiError(err, 'Gagal menolak dokumen.')
        throw err
      } finally {
        this.isSubmitting = false
      }
    },

    // ── Activity ─────────────────────────────────────────────────────────────
    async fetchActivities(query: ActivityListQuery = {}) {
      this.isLoading = true
      this.error = null
      try {
        const api = useApi()
        const res = await api.get<ApiSuccess<Activity[]>>(`${base}/activities`, {
          query: {
            status: query.status,
            search: query.search,
            page: query.page ?? 1,
            limit: query.limit ?? 10,
          },
        })
        this.activities = res.data
        this.activitiesMeta = res.meta
      } catch (err) {
        this.error = parseApiError(err, 'Gagal memuat daftar kegiatan.')
        throw err
      } finally {
        this.isLoading = false
      }
    },

    async createActivity(payload: CreateActivityRequest): Promise<Activity> {
      this.isSubmitting = true
      this.error = null
      try {
        const api = useApi()
        const res = await api.post<ApiSuccess<Activity>>(`${base}/activities`, payload)
        return res.data
      } catch (err) {
        this.error = parseApiError(err, 'Gagal membuat kegiatan.')
        throw err
      } finally {
        this.isSubmitting = false
      }
    },

    async updateActivity(id: string, payload: UpdateActivityRequest): Promise<Activity> {
      this.isSubmitting = true
      this.error = null
      try {
        const api = useApi()
        const res = await api.put<ApiSuccess<Activity>>(`${base}/activities/${id}`, payload)
        return res.data
      } catch (err) {
        this.error = parseApiError(err, 'Gagal memperbarui kegiatan.')
        throw err
      } finally {
        this.isSubmitting = false
      }
    },

    // ── Activity Period ──────────────────────────────────────────────────────
    async fetchActivityPeriods(query: ActivityPeriodListQuery = {}) {
      this.isLoading = true
      this.error = null
      try {
        const api = useApi()
        const res = await api.get<ApiSuccess<ActivityPeriod[]>>(`${base}/activity-periods`, {
          query: {
            activity_id: query.activity_id,
            academic_period_id: query.academic_period_id,
            status: query.status,
            page: query.page ?? 1,
            limit: query.limit ?? 10,
          },
        })
        this.activityPeriods = res.data
        this.activityPeriodsMeta = res.meta
      } catch (err) {
        this.error = parseApiError(err, 'Gagal memuat daftar aktivasi kegiatan.')
        throw err
      } finally {
        this.isLoading = false
      }
    },

    async createActivityPeriod(payload: CreateActivityPeriodRequest): Promise<ActivityPeriod> {
      this.isSubmitting = true
      this.error = null
      try {
        const api = useApi()
        const res = await api.post<ApiSuccess<ActivityPeriod>>(`${base}/activity-periods`, payload)
        return res.data
      } catch (err) {
        this.error = parseApiError(err, 'Gagal membuat aktivasi kegiatan.')
        throw err
      } finally {
        this.isSubmitting = false
      }
    },

    async activateActivityPeriod(id: string): Promise<ActivityPeriod> {
      this.isSubmitting = true
      this.error = null
      try {
        const api = useApi()
        const res = await api.post<ApiSuccess<ActivityPeriod>>(`${base}/activity-periods/${id}/activate`)
        return res.data
      } catch (err) {
        this.error = parseApiError(err, 'Gagal mengaktifkan aktivasi kegiatan.')
        throw err
      } finally {
        this.isSubmitting = false
      }
    },

    async deactivateActivityPeriod(id: string): Promise<ActivityPeriod> {
      this.isSubmitting = true
      this.error = null
      try {
        const api = useApi()
        const res = await api.post<ApiSuccess<ActivityPeriod>>(`${base}/activity-periods/${id}/deactivate`)
        return res.data
      } catch (err) {
        this.error = parseApiError(err, 'Gagal menonaktifkan aktivasi kegiatan.')
        throw err
      } finally {
        this.isSubmitting = false
      }
    },

    // ── Activity Period Program ──────────────────────────────────────────────
    async fetchPeriodPrograms(activityPeriodId: string) {
      this.isLoading = true
      this.error = null
      try {
        const api = useApi()
        const res = await api.get<ApiSuccess<ActivityPeriodProgram[]>>(
          `${base}/activity-periods/${activityPeriodId}/programs`,
        )
        this.periodPrograms = res.data
      } catch (err) {
        this.error = parseApiError(err, 'Gagal memuat program kegiatan.')
        throw err
      } finally {
        this.isLoading = false
      }
    },

    async assignProgram(activityPeriodId: string, payload: AssignProgramRequest): Promise<ActivityPeriodProgram> {
      this.isSubmitting = true
      this.error = null
      try {
        const api = useApi()
        const res = await api.post<ApiSuccess<ActivityPeriodProgram>>(
          `${base}/activity-periods/${activityPeriodId}/programs`,
          payload,
        )
        return res.data
      } catch (err) {
        this.error = parseApiError(err, 'Gagal menambahkan program.')
        throw err
      } finally {
        this.isSubmitting = false
      }
    },

    async removeProgram(activityPeriodId: string, programId: string) {
      this.isSubmitting = true
      this.error = null
      try {
        const api = useApi()
        await api.delete(`${base}/activity-periods/${activityPeriodId}/programs/${programId}`)
      } catch (err) {
        this.error = parseApiError(err, 'Gagal menghapus program.')
        throw err
      } finally {
        this.isSubmitting = false
      }
    },

    // ── Activity Schedule ────────────────────────────────────────────────────
    async fetchSchedules(activityPeriodId: string) {
      this.isLoading = true
      this.error = null
      try {
        const api = useApi()
        const res = await api.get<ApiSuccess<ActivitySchedule[]>>(
          `${base}/activity-periods/${activityPeriodId}/schedules`,
        )
        this.schedules = res.data
      } catch (err) {
        this.error = parseApiError(err, 'Gagal memuat daftar jadwal.')
        throw err
      } finally {
        this.isLoading = false
      }
    },

    async fetchSchedule(id: string): Promise<ActivitySchedule> {
      this.isLoading = true
      this.error = null
      try {
        const api = useApi()
        const res = await api.get<ApiSuccess<ActivitySchedule>>(`${base}/schedules/${id}`)
        this.currentSchedule = res.data
        return res.data
      } catch (err) {
        this.error = parseApiError(err, 'Gagal memuat detail jadwal.')
        throw err
      } finally {
        this.isLoading = false
      }
    },

    async createSchedule(payload: CreateScheduleRequest): Promise<ActivitySchedule> {
      this.isSubmitting = true
      this.error = null
      try {
        const api = useApi()
        const res = await api.post<ApiSuccess<ActivitySchedule>>(`${base}/schedules`, payload)
        return res.data
      } catch (err) {
        this.error = parseApiError(err, 'Gagal membuat jadwal.')
        throw err
      } finally {
        this.isSubmitting = false
      }
    },

    async updateSchedule(id: string, payload: UpdateScheduleRequest): Promise<ActivitySchedule> {
      this.isSubmitting = true
      this.error = null
      try {
        const api = useApi()
        const res = await api.put<ApiSuccess<ActivitySchedule>>(`${base}/schedules/${id}`, payload)
        return res.data
      } catch (err) {
        this.error = parseApiError(err, 'Gagal memperbarui jadwal.')
        throw err
      } finally {
        this.isSubmitting = false
      }
    },

    async deleteSchedule(id: string) {
      this.isSubmitting = true
      this.error = null
      try {
        const api = useApi()
        await api.delete(`${base}/schedules/${id}`)
      } catch (err) {
        this.error = parseApiError(err, 'Gagal menghapus jadwal.')
        throw err
      } finally {
        this.isSubmitting = false
      }
    },

    // ── Activity Session ─────────────────────────────────────────────────────
    async fetchSessions(query: ActivitySessionListQuery = {}) {
      this.isLoading = true
      this.error = null
      try {
        const api = useApi()
        const res = await api.get<ApiSuccess<ActivitySession[]>>(`${base}/sessions`, {
          query: {
            activity_schedule_id: query.activity_schedule_id,
            academic_period_id: query.academic_period_id,
            status: query.status,
            start_date: query.start_date,
            end_date: query.end_date,
            page: query.page ?? 1,
            limit: query.limit ?? 10,
          },
        })
        this.sessions = res.data
        this.sessionsMeta = res.meta
      } catch (err) {
        this.error = parseApiError(err, 'Gagal memuat daftar sesi.')
        throw err
      } finally {
        this.isLoading = false
      }
    },

    async fetchSession(id: string): Promise<ActivitySession> {
      this.isLoading = true
      this.error = null
      try {
        const api = useApi()
        const res = await api.get<ApiSuccess<ActivitySession>>(`${base}/sessions/${id}`)
        this.currentSession = res.data
        return res.data
      } catch (err) {
        this.error = parseApiError(err, 'Gagal memuat detail sesi.')
        throw err
      } finally {
        this.isLoading = false
      }
    },

    async createSession(payload: CreateSessionRequest): Promise<ActivitySession> {
      this.isSubmitting = true
      this.error = null
      try {
        const api = useApi()
        const res = await api.post<ApiSuccess<ActivitySession>>(`${base}/sessions`, payload)
        return res.data
      } catch (err) {
        this.error = parseApiError(err, 'Gagal membuat sesi.')
        throw err
      } finally {
        this.isSubmitting = false
      }
    },

    async generateSessions(scheduleId: string, payload: GenerateSessionsRequest): Promise<GenerateSessionsResponse> {
      this.isSubmitting = true
      this.error = null
      try {
        const api = useApi()
        const res = await api.post<ApiSuccess<GenerateSessionsResponse>>(
          `${base}/schedules/${scheduleId}/generate-sessions`,
          payload,
        )
        return res.data
      } catch (err) {
        this.error = parseApiError(err, 'Gagal mengenerate sesi dari jadwal.')
        throw err
      } finally {
        this.isSubmitting = false
      }
    },

    async cancelSession(id: string): Promise<ActivitySession> {
      this.isSubmitting = true
      this.error = null
      try {
        const api = useApi()
        const res = await api.post<ApiSuccess<ActivitySession>>(`${base}/sessions/${id}/cancel`)
        return res.data
      } catch (err) {
        this.error = parseApiError(err, 'Gagal membatalkan sesi.')
        throw err
      } finally {
        this.isSubmitting = false
      }
    },

    async openSession(id: string): Promise<ActivitySession> {
      this.isSubmitting = true
      this.error = null
      try {
        const api = useApi()
        const res = await api.post<ApiSuccess<ActivitySession>>(`${base}/sessions/${id}/open`)
        return res.data
      } catch (err) {
        this.error = parseApiError(err, 'Gagal membuka sesi.')
        throw err
      } finally {
        this.isSubmitting = false
      }
    },

    async completeSession(id: string): Promise<ActivitySession> {
      this.isSubmitting = true
      this.error = null
      try {
        const api = useApi()
        const res = await api.post<ApiSuccess<ActivitySession>>(`${base}/sessions/${id}/complete`)
        return res.data
      } catch (err) {
        this.error = parseApiError(err, 'Gagal menyelesaikan sesi.')
        throw err
      } finally {
        this.isSubmitting = false
      }
    },

    // ── Attendance ───────────────────────────────────────────────────────────
    async fetchEligibleSantri(sessionId: string): Promise<EligibleSantri[]> {
      this.isLoadingSantri = true
      this.error = null
      try {
        const api = useApi()
        const res = await api.get<ApiSuccess<EligibleSantri[]>>(`${base}/sessions/${sessionId}/eligible-santri`)
        this.eligibleSantri = res.data
        return res.data
      } catch (err) {
        this.error = parseApiError(err, 'Gagal memuat daftar santri yang berhak absen.')
        throw err
      } finally {
        this.isLoadingSantri = false
      }
    },

    async fetchAttendance(sessionId: string) {
      this.isLoading = true
      this.error = null
      try {
        const api = useApi()
        const res = await api.get<ApiSuccess<Attendance[]>>(`${base}/sessions/${sessionId}/attendance`)
        this.attendances = res.data
      } catch (err) {
        this.error = parseApiError(err, 'Gagal memuat absensi.')
        throw err
      } finally {
        this.isLoading = false
      }
    },

    async recordAttendance(sessionId: string, payload: RecordAttendanceRequest): Promise<Attendance[]> {
      this.isSubmitting = true
      this.error = null
      try {
        const api = useApi()
        const res = await api.post<ApiSuccess<Attendance[]>>(`${base}/sessions/${sessionId}/attendance`, payload)
        return res.data
      } catch (err) {
        this.error = parseApiError(err, 'Gagal mencatat absensi.')
        throw err
      } finally {
        this.isSubmitting = false
      }
    },

    async updateAttendance(sessionId: string, santriId: string, payload: UpdateAttendanceRequest): Promise<Attendance> {
      this.isSubmitting = true
      this.error = null
      try {
        const api = useApi()
        const res = await api.put<ApiSuccess<Attendance>>(
          `${base}/sessions/${sessionId}/attendance/${santriId}`,
          payload,
        )
        return res.data
      } catch (err) {
        this.error = parseApiError(err, 'Gagal memperbarui absensi.')
        throw err
      } finally {
        this.isSubmitting = false
      }
    },

    // ── Sinkronisasi absensi dari fingerprint ────────────────────────────────
    async syncFingerprintAttendance(sessionId: string): Promise<SyncFingerprintResponse> {
      this.isSubmitting = true
      this.error = null
      try {
        const api = useApi()
        const res = await api.post<ApiSuccess<SyncFingerprintResponse>>(
          `${base}/sessions/${sessionId}/sync-fingerprint`,
        )
        // Backend mengirim `errors: null` saat tidak ada error (nil slice di
        // Go di-marshal jadi null) — normalisasi ke array agar UI tidak crash.
        return { ...res.data, errors: res.data.errors ?? [] }
      } catch (err) {
        this.error = parseApiError(err, 'Gagal sinkronisasi absensi dari fingerprint.')
        throw err
      } finally {
        this.isSubmitting = false
      }
    },
  },
})

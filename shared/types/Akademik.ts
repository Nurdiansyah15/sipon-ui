// ── Enums ────────────────────────────────────────────────────────────────────
export type ProgramStatus = 'active' | 'inactive'
export type AcademicPeriodStatus = 'draft' | 'open' | 'closed' | 'archived'
export type SantriRegistrationStatus = 'draft' | 'pending' | 'revision' | 'completed' | 'cancelled'
export type ActivityStatus = 'active' | 'inactive'
export type ActivityPeriodStatus = 'active' | 'inactive'
export type ActivityScheduleType = 'once' | 'daily' | 'weekly' | 'monthly' | 'yearly'
export type DayOfWeek = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday'
export type ActivitySessionStatus = 'scheduled' | 'open' | 'completed' | 'cancelled'
export type AttendanceStatus = 'present' | 'absent' | 'excused'
export type ProgramTransferRequestStatus = 'pending' | 'approved' | 'rejected'

// Meta response sesuai backend akademik: {page, limit, total, total_pages}
export interface AkademikMeta {
  page: number
  limit: number
  total: number
  total_pages: number
}

// ── Entities ─────────────────────────────────────────────────────────────────
export interface Program {
  id: string
  code: string
  name: string
  status: ProgramStatus
  created_at: string
  updated_at: string
}

export interface AcademicPeriod {
  id: string
  code: string
  name: string
  start_date: string
  end_date: string
  status: AcademicPeriodStatus
  created_at: string
  updated_at: string
}

export interface SantriRegistration {
  id: string
  santri_id: string
  santri_nis?: string
  santri_name?: string
  academic_period_id: string
  period_name?: string
  status: SantriRegistrationStatus
  revision_notes?: string
  registered_at: string | null
  created_at: string
  updated_at: string
}

export interface Activity {
  id: string
  code: string
  name: string
  status: ActivityStatus
  created_at: string
  updated_at: string
}

export interface ActivityPeriod {
  id: string
  activity_id: string
  activity_code?: string
  activity_name?: string
  academic_period_id: string
  period_name?: string
  status: ActivityPeriodStatus
  created_at: string
  updated_at: string
}

export interface ActivityPeriodProgram {
  id: string
  activity_period_id: string
  program_id: string
  program_code?: string
  program_name?: string
}

export interface YearlyDate {
  month: number
  day: number
}

export interface ActivitySchedule {
  id: string
  activity_period_id: string
  activity_name?: string
  activity_code?: string
  type: ActivityScheduleType
  start_date?: string
  end_date?: string
  start_time: string
  end_time: string
  early_minutes: number
  late_minutes: number
  weekly_days?: DayOfWeek[]
  monthly_days?: number[]
  yearly_dates?: YearlyDate[]
  created_at: string
  updated_at: string
}

export interface ScheduleCalendarItem {
  id: string
  activity_period_id: string
  activity_name?: string
  activity_code?: string
  type: ActivityScheduleType
  start_time: string
  end_time: string
}

export interface ScheduleCalendarDay {
  date: string
  items: ScheduleCalendarItem[]
}

export interface ScheduleCalendarResponse {
  from: string
  to: string
  days: ScheduleCalendarDay[]
}

export interface AttendanceSummary {
  total: number
  present: number
  absent: number
  excused: number
}

export interface ActivitySession {
  id: string
  activity_schedule_id: string
  activity_name?: string
  activity_code?: string
  schedule_type?: ActivityScheduleType
  starts_at: string
  ends_at: string
  status: ActivitySessionStatus
  attendance_summary?: AttendanceSummary
  created_at: string
  updated_at: string
}

export interface Attendance {
  id: string
  activity_session_id: string
  santri_id: string
  santri_nis?: string
  santri_name?: string
  status: AttendanceStatus
  recorded_at: string
  created_at: string
  updated_at: string
}

// Santri eligible for attendance recording: has completed herregistrasi for the
// session's academic period (regardless of program/major assignment).
export interface EligibleSantri {
  santri_id: string
  nis?: string
  fullname?: string
}

// ── Integrasi absensi mesin fingerprint ───────────────────────────────────────

// SyncFingerprintError adalah satu scan yang gagal dicatat, dengan alasan error.
export interface SyncFingerprintError {
  pin: string
  reason: string
}

// SyncFingerprintResponse ringkasan sinkronisasi absensi dari scan fingerprint.
// Scan yang NIS-nya sudah tercatat hadir dihitung sebagai skipped (idempotent).
export interface SyncFingerprintResponse {
  total_scans: number
  recorded: number
  skipped: number
  errors: SyncFingerprintError[]
}

// FingerprintScanLog satu baris scan mentah (skema identik dengan mesin).
export interface FingerprintScanLog {
  id: string
  sn: string
  scan_date: string
  pin: string
  verifymode: number
  inoutmode: number
  deviceip: string
  created_at: string
}

// SimulateScanRequest payload sandbox — hanya pin wajib diisi.
export interface SimulateScanRequest {
  sn?: string
  pin: string
  scan_date?: string
  verifymode?: number
  inoutmode?: number
  deviceip?: string
}

// Program ringkas untuk nested response (program santri, request transfer).
export interface ProgramBrief {
  id: string
  code: string
  name: string
}

export interface SantriProgramAdminResponse {
  santri_id: string
  program_id: string
  program: ProgramBrief
  is_active: boolean
}

export interface SantriProgramListItem {
  santri_id: string
  nis?: string | null
  fullname?: string | null
  program_id: string
  program?: ProgramBrief | null
}

export interface ProgramTransferRequest {
  id: string
  santri_id: string
  santri_name?: string | null
  from_program_id: string
  from_program?: ProgramBrief | null
  to_program_id: string
  to_program?: ProgramBrief | null
  status: ProgramTransferRequestStatus
  notes?: string | null
  admin_notes?: string | null
  reviewed_by?: string | null
  reviewed_at?: string | null
  created_at: string
}

// ── Request DTOs ─────────────────────────────────────────────────────────────
export interface AkademikSettingResponse {
  default_program_id?: string | null
  default_program?: Program | null
}

export interface UpdateAkademikSettingRequest {
  default_program_id?: string | null
}

export interface CreateProgramRequest {
  code: string
  name: string
}

export interface UpdateProgramRequest {
  code?: string
  name?: string
  status?: ProgramStatus
}

export interface CreateAcademicPeriodRequest {
  code: string
  name: string
  start_date: string
  end_date: string
}

export interface UpdateAcademicPeriodRequest {
  code?: string
  name?: string
  start_date?: string
  end_date?: string
}

export interface CreateSantriRegistrationRequest {
  santri_id: string
  academic_period_id: string
}

export interface CreateActivityRequest {
  code: string
  name: string
}

export interface UpdateActivityRequest {
  code?: string
  name?: string
  status?: ActivityStatus
}

export interface CreateActivityPeriodRequest {
  activity_id: string
  academic_period_id: string
}

export interface AssignProgramRequest {
  program_id: string
}

export interface CreateScheduleRequest {
  activity_period_id: string
  type: ActivityScheduleType
  start_date?: string
  end_date?: string
  start_time: string
  end_time: string
  early_minutes?: number
  late_minutes?: number
  weekly_days?: DayOfWeek[]
  monthly_days?: number[]
  yearly_dates?: YearlyDate[]
}

export interface UpdateScheduleRequest {
  start_date?: string
  end_date?: string
  start_time?: string
  end_time?: string
  early_minutes?: number
  late_minutes?: number
  weekly_days?: DayOfWeek[]
  monthly_days?: number[]
  yearly_dates?: YearlyDate[]
}

export interface CreateSessionRequest {
  activity_schedule_id: string
  starts_at: string
  ends_at: string
}

export interface GenerateSessionsRequest {
  from_date: string
  to_date?: string
}

export interface GenerateSessionsResponse {
  total_dates_expanded: number
  total_created: number
  total_skipped: number
  sessions: ActivitySession[]
}

export interface AttendanceRecordInput {
  santri_id: string
  status: AttendanceStatus
}

export interface RecordAttendanceRequest {
  records: AttendanceRecordInput[]
}

export interface UpdateAttendanceRequest {
  status: AttendanceStatus
}

export interface RequestProgramTransferRequest {
  to_program_id: string
  notes?: string
}

export interface RejectProgramTransferRequest {
  admin_notes?: string
}

// ── Query params ─────────────────────────────────────────────────────────────
export interface ProgramListQuery {
  status?: ProgramStatus
  search?: string
  page?: number
  limit?: number
}

export interface AcademicPeriodListQuery {
  status?: AcademicPeriodStatus
  search?: string
  page?: number
  limit?: number
}

export interface SantriRegistrationListQuery {
  academic_period_id?: string
  santri_id?: string
  status?: SantriRegistrationStatus
  page?: number
  limit?: number
}

export interface ActivityListQuery {
  status?: ActivityStatus
  search?: string
  page?: number
  limit?: number
}

export interface ActivityPeriodListQuery {
  activity_id?: string
  academic_period_id?: string
  status?: ActivityPeriodStatus
  page?: number
  limit?: number
}

export interface ActivitySessionListQuery {
  activity_schedule_id?: string
  academic_period_id?: string
  status?: ActivitySessionStatus
  start_date?: string
  end_date?: string
  page?: number
  limit?: number
}

export interface ProgramTransferRequestListQuery {
  status?: ProgramTransferRequestStatus
  page?: number
  limit?: number
}

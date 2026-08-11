// ── Enums ────────────────────────────────────────────────────────────────────
export type ProgramStatus = 'active' | 'inactive'
export type AcademicPeriodStatus = 'draft' | 'open' | 'closed' | 'archived'
export type SantriRegistrationStatus = 'pending' | 'completed' | 'cancelled'
export type ActivityStatus = 'active' | 'inactive'
export type ActivityPeriodStatus = 'active' | 'inactive'
export type ActivityScheduleType = 'once' | 'daily' | 'weekly' | 'monthly' | 'yearly'
export type DayOfWeek = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday'
export type ActivitySessionStatus = 'scheduled' | 'open' | 'completed' | 'cancelled'
export type AttendanceStatus = 'present' | 'absent' | 'excused'

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
  academic_period_id: string
  period_name?: string
  status: SantriRegistrationStatus
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
  weekly_days?: DayOfWeek[]
  monthly_days?: number[]
  yearly_dates?: YearlyDate[]
  created_at: string
  updated_at: string
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
  status: AttendanceStatus
  recorded_at: string
  created_at: string
  updated_at: string
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
  weekly_days?: DayOfWeek[]
  monthly_days?: number[]
  yearly_dates?: YearlyDate[]
}

export interface UpdateScheduleRequest {
  start_date?: string
  end_date?: string
  start_time?: string
  end_time?: string
  weekly_days?: DayOfWeek[]
  monthly_days?: number[]
  yearly_dates?: YearlyDate[]
}

export interface CreateSessionRequest {
  activity_schedule_id: string
  starts_at: string
  ends_at: string
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

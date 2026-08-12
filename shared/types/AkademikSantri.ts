import type {
  AcademicPeriod,
  ActivityScheduleType,
  DayOfWeek,
  ProgramStatus,
  SantriRegistration,
  YearlyDate,
} from './Akademik'

// ── Santri Portal Akademik (non-admin) ───────────────────────────────────────

export type HerregistrasiStatus = 'none' | 'draft' | 'pending' | 'completed' | 'cancelled' | 'revision'

export interface MyHerregistrasi {
  status: HerregistrasiStatus
  registration_id?: string
  registered_at?: string
  revision_notes?: string
}

export interface MyProgram {
  id: string
  code: string
  name: string
  status: ProgramStatus
  started_at?: string
}

export interface MySummary {
  academic_period: AcademicPeriod | null
  herregistrasi: MyHerregistrasi
  program: MyProgram | null
}

export interface MyActivity {
  id: string
  activity_id: string
  activity_code: string
  activity_name: string
  activity_period_id: string
  status: string
  schedule_count: number
}

export interface MySchedule {
  id: string
  activity_period_id: string
  activity_name: string
  activity_code: string
  type: ActivityScheduleType
  start_date?: string
  end_date?: string
  start_time: string
  end_time: string
  weekly_days?: DayOfWeek[]
  monthly_days?: number[]
  yearly_dates?: YearlyDate[]
}

// ── Herregistrasi dokumen & blueprint ────────────────────────────────────────

export type HerregistrasiDocumentStatus = 'pending' | 'verified' | 'rejected'

export interface HerregistrasiDocumentRequirement {
  id: string
  academic_period_id: string
  kind: string
  label: string
  is_required: boolean
  description?: string
  created_at: string
  updated_at: string
}

export interface HerregistrasiDocument {
  id: string
  santri_registration_id: string
  kind: string
  kind_label?: string
  key: string
  original_filename?: string
  mime_type?: string
  size?: number
  status: HerregistrasiDocumentStatus
  notes?: string
  verified_by?: string
  verified_at?: string
  created_at: string
  updated_at: string
}

export interface MyHerregistrasiDetail {
  academic_period: AcademicPeriod | null
  registration: SantriRegistration | null
  requirements: HerregistrasiDocumentRequirement[]
  documents: HerregistrasiDocument[]
}

export interface HerregistrasiDocumentPresignResponse {
  presign_url: string
  key: string
  public_url?: string
  expires_in: number
}

export interface HerregistrasiDocumentConfirmRequest {
  key: string
  kind: string
  original_filename?: string
  mime_type?: string
  size?: number
}

export interface HerregistrasiDocumentDownload {
  download_url: string
  expires_in: number
}

// ── Riwayat absensi santri & presensi ────────────────────────────────────────

export type MyAttendanceStatus = 'present' | 'absent' | 'excused' | 'unrecorded'

export interface MyAttendanceSessionItem {
  session_id: string
  activity_name: string
  activity_code: string
  schedule_type: string
  starts_at: string
  ends_at: string
  status: MyAttendanceStatus
  recorded_at?: string
}

export interface MyAttendanceSummary {
  total_sessions: number
  present: number
  absent: number
  excused: number
  unrecorded: number
}

export interface MyAttendanceResponse {
  academic_period: AcademicPeriod | null
  summary: MyAttendanceSummary
  sessions: MyAttendanceSessionItem[]
}

export interface PresensiSessionInfo {
  id: string
  activity_name: string
  activity_code: string
  schedule_type: string
  starts_at: string
  ends_at: string
  status: string
  period_name: string
  total_eligible: number
  total_present: number
}

export interface PresensiAttendanceItem {
  santri_id: string
  nis?: string
  fullname?: string
  status: string
  recorded_at: string
}

export interface CheckinResponse {
  attendance: {
    id: string
    santri_id: string
    status: string
    recorded_at: string
  }
  message: string
}

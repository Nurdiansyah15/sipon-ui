import type {
  AcademicPeriod,
  ActivityScheduleType,
  DayOfWeek,
  ProgramStatus,
  YearlyDate,
} from './Akademik'

// ── Santri Portal Akademik (non-admin) ───────────────────────────────────────

export type HerregistrasiStatus = 'none' | 'pending' | 'completed' | 'cancelled'

export interface MyHerregistrasi {
  status: HerregistrasiStatus
  registration_id?: string
  registered_at?: string
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

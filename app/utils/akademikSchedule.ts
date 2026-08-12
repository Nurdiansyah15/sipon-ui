import type { DayOfWeek } from '#shared/types/Akademik'

/**
 * Bentuk minimal jadwal yang dipakai helper di file ini. Diterima dari
 * ActivitySchedule (admin) maupun MySchedule (portal santri).
 */
export interface ScheduleLike {
  type: string
  start_date?: string
  end_date?: string
  start_time: string
  end_time: string
  weekly_days?: DayOfWeek[]
  monthly_days?: number[]
  yearly_dates?: { month: number; day: number }[]
}

const DAY_ORDER: Record<DayOfWeek, number> = {
  monday: 1,
  tuesday: 2,
  wednesday: 3,
  thursday: 4,
  friday: 5,
  saturday: 6,
  sunday: 0,
}

const DAY_LABEL: Record<DayOfWeek, string> = {
  monday: 'Senin',
  tuesday: 'Selasa',
  wednesday: 'Rabu',
  thursday: 'Kamis',
  friday: 'Jumat',
  saturday: 'Sabtu',
  sunday: 'Minggu',
}

export const SCHEDULE_TYPE_LABEL: Record<string, string> = {
  once: 'Sekali',
  daily: 'Harian',
  weekly: 'Mingguan',
  monthly: 'Bulanan',
  yearly: 'Tahunan',
}

export function scheduleTypeLabel(type: string): string {
  return SCHEDULE_TYPE_LABEL[type] ?? type
}

/** Sort schedules by type (daily → weekly → monthly → yearly → once) then start time. */
export function sortSchedules<T extends ScheduleLike>(schedules: T[]): T[] {
  const order: Record<string, number> = { daily: 1, weekly: 2, monthly: 3, yearly: 4, once: 5 }
  return [...schedules].sort((a, b) => {
    const oa = order[a.type] ?? 9
    const ob = order[b.type] ?? 9
    if (oa !== ob) return oa - ob
    return a.start_time.localeCompare(b.start_time)
  })
}

function formatHHMM(t: string): string {
  if (!t) return ''
  return t.slice(0, 5)
}

/** Human-friendly recurrence description, e.g. "Senin, Kamis" or "Tanggal 5, 20". */
export function scheduleRecurrenceLabel(schedule: ScheduleLike): string {
  switch (schedule.type) {
    case 'weekly':
      return (schedule.weekly_days ?? []).map(d => DAY_LABEL[d]).join(', ')
    case 'monthly':
      return `Tanggal ${(schedule.monthly_days ?? []).map(String).join(', ')}`
    case 'yearly':
      return (schedule.yearly_dates ?? [])
        .map(d => `${d.day} ${MONTH_LABEL[d.month - 1]}`)
        .join(', ')
    case 'once':
      return schedule.start_date ? formatDate(schedule.start_date) : ''
    default:
      return ''
  }
}

export const MONTH_LABEL = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
]

export function formatDate(date: string): string {
  if (!date) return ''
  const [y, m, d] = date.split('-').map(Number)
  if (!y || !m || !d) return date
  return `${d} ${MONTH_LABEL[m - 1]} ${y}`
}

export function formatTimeRange(start: string, end: string): string {
  return `${formatHHMM(start)} – ${formatHHMM(end)}`
}

/**
 * Whether a schedule occurs on the given date. `date` must be a local
 * Date; its weekday and day/month are matched against recurrence rules.
 */
export function occursOn(schedule: ScheduleLike, date: Date): boolean {
  const y = date.getFullYear()
  const m = date.getMonth() + 1
  const d = date.getDate()
  const dow = date.getDay() // 0 = Sunday

  switch (schedule.type) {
    case 'daily':
      return true
    case 'weekly': {
      const days = schedule.weekly_days ?? []
      return days.some(day => DAY_ORDER[day] === dow)
    }
    case 'monthly':
      return (schedule.monthly_days ?? []).includes(d)
    case 'yearly':
      return (schedule.yearly_dates ?? []).some(yd => yd.month === m && yd.day === d)
    case 'once': {
      if (!schedule.start_date) return false
      const [sy, sm, sd] = schedule.start_date.split('-').map(Number)
      return sy === y && sm === m && sd === d
    }
    default:
      return false
  }
}

/** Schedules that occur today (local time). */
export function schedulesForToday<T extends ScheduleLike>(schedules: T[]): T[] {
  const today = new Date()
  return sortSchedules(schedules.filter(s => occursOn(s, today)))
}

/**
 * Offset timezone platform (sama untuk semua user, mengikuti backend).
 * Backend menyimpan TIMESTAMPTZ dalam UTC dan menampilkan dalam platform
 * timezone (Asia/Jakarta). Input RFC3339 harus menyertakan offset ini agar
 * instant yang tersimpan sesuai maksud wall-clock user.
 */
export const PLATFORM_TZ_OFFSET = '+07:00'

/** "2026-08-10" + "19:30" → RFC3339 "2026-08-10T19:30:00+07:00". */
export function toRFC3339WithOffset(date: string, time: string): string {
  if (!date || !time) return ''
  return `${date}T${time}:00${PLATFORM_TZ_OFFSET}`
}

function formatYMD(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

/**
 * Daftar tanggal (YYYY-MM-DD) di mana jadwal terjadi dalam rentang
 * [from, to], dibatasi start_date/end_date jadwal bila ada. Pola sama dengan
 * ExpandScheduleDates di backend.
 */
export function scheduleDatesInRange(schedule: ScheduleLike, from: string, to: string): string[] {
  if (!from) return []
  const effFrom = schedule.start_date && schedule.start_date > from ? schedule.start_date : from
  const effTo = schedule.end_date && schedule.end_date < to ? schedule.end_date : to
  if (effFrom > effTo) return []

  const result: string[] = []
  const cur = new Date(`${effFrom}T00:00:00`)
  const end = new Date(`${effTo}T00:00:00`)
  while (cur <= end) {
    if (occursOn(schedule, cur)) {
      result.push(formatYMD(cur))
    }
    cur.setDate(cur.getDate() + 1)
  }
  return result
}

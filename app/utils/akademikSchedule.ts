import type { DayOfWeek } from '#shared/types/Akademik'
import type { MySchedule } from '#shared/types/AkademikSantri'

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
export function sortSchedules(schedules: MySchedule[]): MySchedule[] {
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
export function scheduleRecurrenceLabel(schedule: MySchedule): string {
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
export function occursOn(schedule: MySchedule, date: Date): boolean {
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
export function schedulesForToday(schedules: MySchedule[]): MySchedule[] {
  const today = new Date()
  return sortSchedules(schedules.filter(s => occursOn(s, today)))
}

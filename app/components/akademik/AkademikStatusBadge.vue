<script setup lang="ts">
import type {
  ProgramStatus,
  AcademicPeriodStatus,
  SantriRegistrationStatus,
  ActivityStatus,
  ActivityPeriodStatus,
  ActivitySessionStatus,
  AttendanceStatus,
} from '#shared/types/Akademik'

type StatusType = 'program' | 'period' | 'registration' | 'activity' | 'activity_period' | 'session' | 'attendance'
type StatusValue =
  | ProgramStatus
  | AcademicPeriodStatus
  | SantriRegistrationStatus
  | ActivityStatus
  | ActivityPeriodStatus
  | ActivitySessionStatus
  | AttendanceStatus

type BadgeColor = 'error' | 'success' | 'primary' | 'secondary' | 'info' | 'warning' | 'neutral'

const props = defineProps<{
  status: StatusValue
  type: StatusType
  size?: 'xs' | 'sm' | 'md'
}>()

const colorMap: Record<StatusType, Record<string, BadgeColor>> = {
  program: { active: 'success', inactive: 'neutral' },
  period: { draft: 'neutral', open: 'success', closed: 'warning', archived: 'neutral' },
  registration: { pending: 'warning', completed: 'success', cancelled: 'error' },
  activity: { active: 'success', inactive: 'neutral' },
  activity_period: { active: 'success', inactive: 'neutral' },
  session: { scheduled: 'info', open: 'success', completed: 'neutral', cancelled: 'error' },
  attendance: { present: 'success', absent: 'error', excused: 'warning' },
}

const labelMap: Record<StatusType, Record<string, string>> = {
  program: { active: 'Aktif', inactive: 'Nonaktif' },
  period: { draft: 'Draft', open: 'Buka', closed: 'Tutup', archived: 'Arsip' },
  registration: { pending: 'Menunggu', completed: 'Selesai', cancelled: 'Dibatalkan' },
  activity: { active: 'Aktif', inactive: 'Nonaktif' },
  activity_period: { active: 'Aktif', inactive: 'Nonaktif' },
  session: { scheduled: 'Terjadwal', open: 'Berlangsung', completed: 'Selesai', cancelled: 'Dibatalkan' },
  attendance: { present: 'Hadir', absent: 'Alpa', excused: 'Izin' },
}

const color = computed(() => colorMap[props.type]?.[String(props.status)] ?? 'neutral')
const label = computed(() => labelMap[props.type]?.[String(props.status)] ?? String(props.status))
</script>

<template>
  <UBadge :color="color" variant="subtle" :size="props.size ?? 'md'">
    {{ label }}
  </UBadge>
</template>

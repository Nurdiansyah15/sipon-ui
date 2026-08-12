<script setup lang="ts">
import { useAkademikSantriStore } from '~/stores/akademik-santri'
import { parseApiError } from '~/utils/errorParser'
import { MONTH_LABEL, scheduleTypeLabel } from '~/utils/akademikSchedule'
import type { AcademicPeriod } from '#shared/types/Akademik'
import type { MyAttendanceSessionItem } from '#shared/types/AkademikSantri'

definePageMeta({ layout: 'default' })

const store = useAkademikSantriStore()
const toast = useToast()

const periods = ref<AcademicPeriod[]>([])
const ACTIVE_SENTINEL = '__active__'
const selectedPeriodId = ref(ACTIVE_SENTINEL)
const loading = ref(true)

const DAY_LABEL = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu']

const attendance = computed(() => store.myAttendance)

const periodOptions = computed(() => [
  { label: 'Periode Aktif', value: ACTIVE_SENTINEL },
  ...periods.value.map(p => ({ label: p.name, value: p.id })),
])

async function loadPeriods() {
  try {
    periods.value = await store.fetchAttendancePeriods()
  } catch (err) {
    toast.add({ title: 'Gagal memuat periode', description: parseApiError(err), color: 'error' })
  }
}

async function load() {
  loading.value = true
  try {
    await store.fetchMyAttendance({
      academic_period_id: selectedPeriodId.value === ACTIVE_SENTINEL ? undefined : selectedPeriodId.value,
    })
  } catch (err) {
    toast.add({ title: 'Gagal memuat riwayat', description: parseApiError(err), color: 'error' })
  } finally {
    loading.value = false
  }
}

async function onPeriodChange() {
  await load()
}

function fmtDate(iso: string) {
  const d = new Date(iso)
  return `${DAY_LABEL[d.getDay()]}, ${d.getDate()} ${MONTH_LABEL[d.getMonth()]} ${d.getFullYear()}`
}

function fmtTime(iso: string) {
  const d = new Date(iso)
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

function statusBadge(item: MyAttendanceSessionItem) {
  switch (item.status) {
    case 'present':
      return { label: 'Hadir', color: 'success' as const }
    case 'absent':
      return { label: 'Alpa', color: 'error' as const }
    case 'excused':
      return { label: 'Izin', color: 'warning' as const }
    default:
      return { label: 'Belum dicatat', color: 'neutral' as const }
  }
}

onMounted(async () => {
  await loadPeriods()
  await load()
})
</script>

<template>
  <div class="mx-auto max-w-5xl px-4 py-8">
    <UButton variant="ghost" icon="i-lucide-arrow-left" to="/akademik" class="mb-4">Kembali ke Akademik</UButton>

    <div class="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 class="text-2xl font-bold text-gray-900 dark:text-gray-100">Riwayat Absensi</h1>
        <p class="mt-1 text-sm text-gray-500">Riwayat kehadiran Anda pada kegiatan akademik.</p>
      </div>
      <USelect v-model="selectedPeriodId" :items="periodOptions" class="w-64" @update:model-value="onPeriodChange" />
    </div>

    <div v-if="loading" class="space-y-4">
      <div class="grid gap-4 sm:grid-cols-4">
        <USkeleton v-for="i in 4" :key="i" class="h-24 w-full" />
      </div>
      <USkeleton class="h-64 w-full" />
    </div>

    <template v-else-if="attendance">
      <!-- Summary cards -->
      <div class="mb-6 grid gap-4 sm:grid-cols-4">
        <div class="rounded-lg border border-gray-200 bg-white p-5 dark:border-gray-700/50 dark:bg-gray-900">
          <p class="text-sm text-gray-500">Total Sesi</p>
          <p class="mt-1 text-2xl font-bold text-gray-900 dark:text-gray-100">{{ attendance.summary.total_sessions }}</p>
        </div>
        <div class="rounded-lg border border-gray-200 bg-white p-5 dark:border-gray-700/50 dark:bg-gray-900">
          <p class="text-sm text-gray-500">Hadir</p>
          <p class="mt-1 text-2xl font-bold text-green-600 dark:text-green-400">{{ attendance.summary.present }}</p>
        </div>
        <div class="rounded-lg border border-gray-200 bg-white p-5 dark:border-gray-700/50 dark:bg-gray-900">
          <p class="text-sm text-gray-500">Alpa</p>
          <p class="mt-1 text-2xl font-bold text-red-600 dark:text-red-400">{{ attendance.summary.absent }}</p>
        </div>
        <div class="rounded-lg border border-gray-200 bg-white p-5 dark:border-gray-700/50 dark:bg-gray-900">
          <p class="text-sm text-gray-500">Izin / Belum</p>
          <p class="mt-1 text-2xl font-bold text-amber-600 dark:text-amber-400">{{ attendance.summary.excused + attendance.summary.unrecorded }}</p>
        </div>
      </div>

      <!-- List sesi -->
      <div class="overflow-hidden rounded-lg border border-gray-200 bg-white dark:border-gray-700/50 dark:bg-gray-900">
        <div v-if="attendance.sessions.length === 0" class="p-10 text-center">
          <UIcon name="i-lucide-calendar-off" class="mx-auto mb-3 h-12 w-12 text-gray-300 dark:text-gray-600" />
          <h2 class="text-lg font-semibold text-gray-900 dark:text-gray-100">Belum Ada Sesi</h2>
          <p class="mt-2 text-sm text-gray-500 dark:text-gray-400">Tidak ada sesi kegiatan pada periode ini.</p>
        </div>
        <ul v-else class="divide-y divide-gray-100 dark:divide-gray-700/50">
          <li v-for="item in attendance.sessions" :key="item.session_id" class="flex flex-wrap items-center gap-3 px-5 py-4">
            <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-teal-50 dark:bg-teal-950">
              <UIcon name="i-lucide-calendar" class="h-5 w-5 text-teal-600 dark:text-teal-400" />
            </div>
            <div class="min-w-0 flex-1">
              <p class="truncate font-medium text-gray-900 dark:text-gray-100">{{ item.activity_name }}</p>
              <p class="mt-0.5 flex flex-wrap items-center gap-x-2 text-xs text-gray-500 dark:text-gray-400">
                <span>{{ fmtDate(item.starts_at) }}</span>
                <span>·</span>
                <span>{{ fmtTime(item.starts_at) }} – {{ fmtTime(item.ends_at) }}</span>
                <span>·</span>
                <span>{{ scheduleTypeLabel(item.schedule_type) }}</span>
              </p>
            </div>
            <UBadge :color="statusBadge(item).color" variant="subtle" size="sm">
              {{ statusBadge(item).label }}
            </UBadge>
          </li>
        </ul>
      </div>
    </template>
  </div>
</template>

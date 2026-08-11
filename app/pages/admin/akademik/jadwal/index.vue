<script setup lang="ts">
import type { ApiSuccess } from '#shared/types/ApiResponse'
import { useAkademikStore } from '~/stores/akademik'
import type { ActivitySchedule, ActivityPeriod } from '#shared/types/Akademik'

definePageMeta({ layout: 'akademik' })

const store = useAkademikStore()

const loading = ref(true)
const schedules = ref<ActivitySchedule[]>([])
const periodFilter = ref<string>('all')

async function load() {
  loading.value = true
  try {
    const api = useApi()
    let result: ActivitySchedule[] = []
    if (periodFilter.value !== 'all') {
      // Filter memakai academic_period_id → cari dulu activity-period milik
      // periode tersebut, baru ambil jadwal tiap activity-period.
      const apRes = await api.get<ApiSuccess<ActivityPeriod[]>>('/api/v1/web/akademik/activity-periods', {
        query: { page: 1, limit: 100, academic_period_id: periodFilter.value },
      })
      const periods = apRes.data
      const all: ActivitySchedule[] = []
      for (const p of periods) {
        const r = await api.get<ApiSuccess<ActivitySchedule[]>>(`/api/v1/web/akademik/activity-periods/${p.id}/schedules`)
        all.push(...r.data)
      }
      result = all
    } else {
      // Tidak ada endpoint list global — tarik per activity-period aktif.
      const apRes = await api.get<ApiSuccess<ActivityPeriod[]>>('/api/v1/web/akademik/activity-periods', {
        query: { page: 1, limit: 100, status: 'active' },
      })
      const periods = apRes.data
      const all: ActivitySchedule[] = []
      for (const p of periods) {
        const r = await api.get<ApiSuccess<ActivitySchedule[]>>(`/api/v1/web/akademik/activity-periods/${p.id}/schedules`)
        all.push(...r.data)
      }
      result = all
    }
    schedules.value = result
  } catch {
    schedules.value = []
  } finally {
    loading.value = false
  }
}

async function loadPeriods() {
  if (store.periods.length === 0) {
    try { await store.fetchPeriods({ limit: 100 }) } catch { /* ignore */ }
  }
}

onMounted(() => {
  load()
  loadPeriods()
})

watch(periodFilter, () => load())

const periodOptions = computed(() => [
  { label: 'Semua Periode', value: 'all' },
  ...store.periods.map(p => ({ label: `${p.code} — ${p.name}`, value: p.id })),
])

function fmtDate(v: string | undefined) {
  if (!v) return '-'
  return new Date(v).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })
}

function recurrenceLabel(s: ActivitySchedule): string {
  switch (s.type) {
    case 'once': return 'Sekali'
    case 'daily': return 'Setiap hari'
    case 'weekly': return (s.weekly_days ?? []).map(d => dayLabel(d)).join(', ')
    case 'monthly': return (s.monthly_days ?? []).map(d => `Tgl ${d}`).join(', ')
    case 'yearly': return (s.yearly_dates ?? []).map(d => `${d.day}/${d.month}`).join(', ')
    default: return '-'
  }
}

function dayLabel(d: string): string {
  const map: Record<string, string> = {
    monday: 'Senin', tuesday: 'Selasa', wednesday: 'Rabu', thursday: 'Kamis',
    friday: 'Jumat', saturday: 'Sabtu', sunday: 'Minggu',
  }
  return map[d] ?? d
}
</script>

<template>
  <div class="mx-auto max-w-7xl px-4 py-8">
    <div class="mb-6">
      <h1 class="text-2xl font-bold text-gray-900 dark:text-gray-100">Jadwal Kegiatan</h1>
      <p class="mt-1 text-sm text-gray-700 dark:text-gray-300">Pola pelaksanaan kegiatan (sekali, harian, mingguan, bulanan, tahunan).</p>
    </div>

    <div class="mb-4 max-w-xs">
      <USelect v-model="periodFilter" :items="periodOptions" size="sm" class="w-full" />
    </div>

    <div v-if="loading" class="flex justify-center py-16">
      <UIcon name="i-lucide-loader-circle" class="h-8 w-8 animate-spin text-teal-600" />
    </div>

    <div v-else-if="schedules.length === 0" class="rounded-lg border border-dashed border-gray-300 p-8 text-center text-gray-500 dark:border-gray-600 dark:text-gray-400">
      Belum ada jadwal untuk filter ini.
    </div>

    <div v-else class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <NuxtLink
        v-for="s in schedules"
        :key="s.id"
        :to="`/admin/akademik/jadwal/${s.id}`"
        class="rounded-lg border border-gray-200 bg-white p-5 transition hover:shadow-md dark:border-gray-700/50 dark:bg-gray-900"
      >
        <div class="mb-2 flex items-center justify-between">
          <AkademikScheduleTypeBadge :type="s.type" />
          <span class="text-sm font-medium text-teal-600 dark:text-teal-400">{{ s.activity_code }}</span>
        </div>
        <h3 class="font-semibold text-gray-900 dark:text-gray-100">{{ s.activity_name }}</h3>
        <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">{{ recurrenceLabel(s) }}</p>
        <div class="mt-3 flex items-center justify-between border-t border-gray-100 pt-3 text-sm dark:border-gray-700/50">
          <AkademikTimeDisplay :start-time="s.start_time" :end-time="s.end_time" />
          <span class="text-xs text-gray-400">{{ fmtDate(s.start_date) }} → {{ fmtDate(s.end_date) }}</span>
        </div>
      </NuxtLink>
    </div>
  </div>
</template>

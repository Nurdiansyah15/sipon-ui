<script setup lang="ts">
import { useAkademikSantriStore } from '~/stores/akademik-santri'
import { parseApiError } from '~/utils/errorParser'
import {
  formatDate,
  formatTimeRange,
  scheduleRecurrenceLabel,
  scheduleTypeLabel,
  sortSchedules,
} from '~/utils/akademikSchedule'

definePageMeta({ layout: 'default' })

const store = useAkademikSantriStore()
const toast = useToast()
const route = useRoute()

const activityPeriodFilter = ref<string | undefined>(typeof route.query.activity_period_id === 'string'
  ? route.query.activity_period_id
  : undefined)

const typeFilter = ref<string | undefined>(undefined)

const typeOptions = [
  { label: 'Semua Tipe', value: undefined },
  { label: 'Harian', value: 'daily' },
  { label: 'Mingguan', value: 'weekly' },
  { label: 'Bulanan', value: 'monthly' },
  { label: 'Tahunan', value: 'yearly' },
  { label: 'Sekali', value: 'once' },
]

const filteredSchedules = computed(() => {
  let items = store.schedules
  if (activityPeriodFilter.value) {
    items = items.filter(s => s.activity_period_id === activityPeriodFilter.value)
  }
  if (typeFilter.value) {
    items = items.filter(s => s.type === typeFilter.value)
  }
  return sortSchedules(items)
})

onMounted(async () => {
  if (!store.summary) {
    try {
      await store.fetchSummary()
    } catch (err) {
      toast.add({ title: 'Gagal memuat data', description: parseApiError(err), color: 'error' })
    }
  }
  try {
    await store.fetchSchedules()
  } catch (err) {
    toast.add({ title: 'Gagal memuat data', description: parseApiError(err), color: 'error' })
  }
})
</script>

<template>
  <div class="mx-auto max-w-7xl px-4 py-8">
    <UButton variant="ghost" icon="i-lucide-arrow-left" to="/akademik" class="mb-4">Kembali ke Akademik</UButton>

    <div class="mb-6">
      <h1 class="text-2xl font-bold text-gray-900 dark:text-gray-100">Jadwal Kegiatan</h1>
      <p class="mt-1 text-sm text-gray-500">
        Jadwal kegiatan untuk periode
        <span v-if="store.activePeriod" class="font-medium text-gray-700 dark:text-gray-300">{{ store.activePeriod.name }}</span>
        <span v-else>akademik</span>.
      </p>
    </div>

    <div class="mb-4 flex items-center gap-2">
      <USelect v-model="typeFilter" :items="typeOptions" placeholder="Filter tipe" class="w-44" />
    </div>

    <div v-if="store.isLoading" class="space-y-4">
      <USkeleton v-for="i in 4" :key="i" class="h-28 w-full" />
    </div>

    <div v-else-if="store.error" class="rounded-lg border border-red-200 bg-red-50 p-8 text-center dark:border-red-800 dark:bg-red-950">
      <UIcon name="i-lucide-alert-circle" class="mx-auto mb-2 h-8 w-8 text-red-500" />
      <p class="text-red-700 dark:text-red-300">{{ store.error }}</p>
      <UButton class="mt-4" variant="soft" @click="store.fetchSchedules()">Coba Lagi</UButton>
    </div>

    <div v-else-if="filteredSchedules.length === 0" class="rounded-lg border border-gray-200 bg-white p-10 text-center dark:border-gray-700/50 dark:bg-gray-900">
      <UIcon name="i-lucide-calendar-off" class="mx-auto mb-3 h-12 w-12 text-gray-300 dark:text-gray-600" />
      <h2 class="text-lg font-semibold text-gray-900 dark:text-gray-100">Belum Ada Jadwal</h2>
      <p class="mt-2 text-sm text-gray-500 dark:text-gray-400">Tidak ada jadwal yang ditemukan.</p>
    </div>

    <div v-else class="space-y-4">
      <div
        v-for="sched in filteredSchedules"
        :key="sched.id"
        class="rounded-lg border border-gray-200 bg-white p-5 dark:border-gray-700/50 dark:bg-gray-900"
      >
        <div class="flex items-start justify-between gap-3">
          <div class="min-w-0">
            <h3 class="font-semibold text-gray-900 dark:text-gray-100">{{ sched.activity_name }}</h3>
            <p class="mt-0.5 text-xs font-medium uppercase tracking-wide text-gray-400">{{ sched.activity_code }}</p>
          </div>
          <UBadge color="primary" variant="soft" size="xs">{{ scheduleTypeLabel(sched.type) }}</UBadge>
        </div>

        <div class="mt-4 grid gap-3 text-sm text-gray-600 sm:grid-cols-2 dark:text-gray-300">
          <div class="flex items-center gap-2">
            <UIcon name="i-lucide-clock" class="h-4 w-4 shrink-0 text-gray-400" />
            <span>{{ formatTimeRange(sched.start_time, sched.end_time) }}</span>
          </div>
          <div v-if="scheduleRecurrenceLabel(sched)" class="flex items-center gap-2">
            <UIcon name="i-lucide-repeat" class="h-4 w-4 shrink-0 text-gray-400" />
            <span>{{ scheduleRecurrenceLabel(sched) }}</span>
          </div>
          <div v-if="sched.start_date || sched.end_date" class="flex items-center gap-2">
            <UIcon name="i-lucide-calendar" class="h-4 w-4 shrink-0 text-gray-400" />
            <span>
              {{ sched.start_date ? formatDate(sched.start_date) : '…' }}
              {{ sched.end_date ? `s.d. ${formatDate(sched.end_date)}` : '' }}
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

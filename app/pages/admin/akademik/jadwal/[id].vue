<script setup lang="ts">
import { useAkademikStore } from '~/stores/akademik'
import { usePermission } from '~/composables/usePermission'
import type { ActivitySchedule } from '#shared/types/Akademik'

definePageMeta({ layout: 'akademik' })

const route = useRoute()
const id = computed(() => (route.params as Record<string, string>).id ?? '')

const store = useAkademikStore()
const toast = useToast()
const { can } = usePermission()

const schedule = ref<ActivitySchedule | null>(null)
const loading = ref(true)
const notFound = ref(false)

async function load() {
  loading.value = true
  notFound.value = false
  try {
    schedule.value = await store.fetchSchedule(id.value)
  } catch {
    notFound.value = true
  } finally {
    loading.value = false
  }
}

onMounted(load)

function fmtDate(v: string | undefined) {
  if (!v) return '-'
  return new Date(v).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })
}

function dayLabel(d: string): string {
  const map: Record<string, string> = {
    monday: 'Senin', tuesday: 'Selasa', wednesday: 'Rabu', thursday: 'Kamis',
    friday: 'Jumat', saturday: 'Sabtu', sunday: 'Minggu',
  }
  return map[d] ?? d
}

function recurrenceLines(s: ActivitySchedule): string[] {
  switch (s.type) {
    case 'once': return ['Berlangsung satu kali']
    case 'daily': return ['Setiap hari']
    case 'weekly': return (s.weekly_days ?? []).map(d => dayLabel(d))
    case 'monthly': return (s.monthly_days ?? []).map(d => `Tanggal ${d}`)
    case 'yearly': return (s.yearly_dates ?? []).map(d => `${d.day}/${d.month}`)
    default: return []
  }
}

const editOpen = ref(false)

async function saveEdit() {
  await load()
}
</script>

<template>
  <div class="mx-auto max-w-4xl px-4 py-8">
    <div class="mb-6 flex flex-wrap items-center justify-between gap-3">
      <div>
        <NuxtLink to="/admin/akademik/jadwal" class="text-sm text-teal-600 hover:underline dark:text-teal-400">
          ← Kembali ke Jadwal
        </NuxtLink>
        <h1 class="mt-1 text-2xl font-bold text-gray-900 dark:text-gray-100">
          {{ schedule?.activity_name ?? 'Detail Jadwal' }}
        </h1>
        <p v-if="schedule" class="mt-1 text-sm text-gray-700 dark:text-gray-300">{{ schedule.activity_code }}</p>
      </div>
      <UButton
        v-if="can('manage_akademik') && schedule"
        icon="i-lucide-pencil"
        color="neutral"
        variant="outline"
        @click="editOpen = true"
      >
        Edit Jadwal
      </UButton>
    </div>

    <div v-if="loading" class="flex justify-center py-16">
      <UIcon name="i-lucide-loader-circle" class="h-8 w-8 animate-spin text-teal-600" />
    </div>

    <div v-else-if="notFound || !schedule" class="rounded-lg border border-dashed border-gray-300 p-8 text-center text-gray-500 dark:border-gray-600 dark:text-gray-400">
      Jadwal tidak ditemukan.
    </div>

    <template v-else>
      <div class="overflow-hidden rounded-lg border border-gray-200 bg-white dark:border-gray-700/50 dark:bg-gray-900">
        <dl class="divide-y divide-gray-100 dark:divide-gray-700/50">
          <div class="flex items-center justify-between px-6 py-4">
            <dt class="text-sm font-medium text-gray-500 dark:text-gray-400">Tipe</dt>
            <dd><AkademikScheduleTypeBadge :type="schedule.type" /></dd>
          </div>
          <div class="flex items-center justify-between px-6 py-4">
            <dt class="text-sm font-medium text-gray-500 dark:text-gray-400">Waktu</dt>
            <dd><AkademikTimeDisplay :start-time="schedule.start_time" :end-time="schedule.end_time" /></dd>
          </div>
          <div class="flex items-center justify-between px-6 py-4">
            <dt class="text-sm font-medium text-gray-500 dark:text-gray-400">Berlaku</dt>
            <dd class="text-sm text-gray-900 dark:text-gray-100">
              {{ fmtDate(schedule.start_date) }} → {{ fmtDate(schedule.end_date) }}
            </dd>
          </div>
          <div class="flex items-start justify-between gap-4 px-6 py-4">
            <dt class="shrink-0 text-sm font-medium text-gray-500 dark:text-gray-400">Pola</dt>
            <dd>
              <div class="flex flex-wrap justify-end gap-1.5">
                <UBadge v-for="(line, i) in recurrenceLines(schedule)" :key="i" color="neutral" variant="subtle" size="sm">
                  {{ line }}
                </UBadge>
              </div>
            </dd>
          </div>
        </dl>
      </div>

      <div class="mt-4">
        <UButton
          icon="i-lucide-plus"
          color="neutral"
          variant="outline"
          size="sm"
          @click="navigateTo(`/admin/akademik/sesi?activity_schedule_id=${schedule.id}`)"
        >
          Lihat Sesi dari Jadwal Ini
        </UButton>
      </div>
    </template>

    <AdminAkademikScheduleFormModal
      v-model:open="editOpen"
      :activity-period-id="schedule?.activity_period_id ?? ''"
      :schedule="schedule"
      @success="saveEdit"
    />
  </div>
</template>

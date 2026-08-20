<script setup lang="ts">
import { useAkademikStore } from '~/stores/akademik'
import { usePermission } from '~/composables/usePermission'
import type { ApiSuccess } from '#shared/types/ApiResponse'
import type { ActivitySchedule, ActivitySession } from '#shared/types/Akademik'

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
    loadSessions()
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

// ── Sesi Kegiatan dari jadwal ini ─────────────────────────────────────────────
const sessions = ref<ActivitySession[]>([])
const sessionsLoading = ref(false)
const sessionsTotal = ref(0)
const sessionsPage = ref(1)
const sessionsLimit = 10

async function loadSessions() {
  if (!schedule.value) return
  sessionsLoading.value = true
  try {
    const api = useApi()
    const res = await api.get<ApiSuccess<ActivitySession[]>>('/api/v1/web/akademik/sessions', {
      query: {
        activity_schedule_id: schedule.value.id,
        page: sessionsPage.value,
        limit: sessionsLimit,
      },
    })
    sessions.value = res.data
    sessionsTotal.value = res.meta?.total ?? res.data.length
  } catch {
    sessions.value = []
    sessionsTotal.value = 0
  } finally {
    sessionsLoading.value = false
  }
}

watch(sessionsPage, () => loadSessions())

const generateOpen = ref(false)
const createSessionOpen = ref(false)

function onGenerateSuccess(created: number, skipped: number) {
  sessionsPage.value = 1
  loadSessions()
}

function onSessionCreated() {
  createSessionOpen.value = false
  sessionsPage.value = 1
  loadSessions()
}

function fmtDateTime(v: string) {
  return new Date(v).toLocaleString('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

const totalPages = computed(() => Math.max(1, Math.ceil(sessionsTotal.value / sessionsLimit)))

const sessionColumns = [
  { accessorKey: 'starts_at', header: 'Mulai' },
  { accessorKey: 'ends_at', header: 'Selesai' },
  { accessorKey: 'status', header: 'Status' },
  { accessorKey: 'actions', header: 'Aksi' },
]
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
            <dt class="text-sm font-medium text-gray-500 dark:text-gray-400">Kompromi Waktu</dt>
            <dd class="text-sm text-gray-900 dark:text-gray-100">
              <template v-if="(schedule.early_minutes ?? 0) === 0 && (schedule.late_minutes ?? 0) === 0">Tidak ada</template>
              <template v-else>
                <span v-if="(schedule.early_minutes ?? 0) > 0">Buka {{ schedule.early_minutes }} menit lebih awal</span>
                <span v-if="(schedule.early_minutes ?? 0) > 0 && (schedule.late_minutes ?? 0) > 0"> · </span>
                <span v-if="(schedule.late_minutes ?? 0) > 0">Tutup {{ schedule.late_minutes }} menit lebih akhir</span>
              </template>
            </dd>
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

      <div class="mt-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 class="text-lg font-semibold text-gray-900 dark:text-gray-100">Sesi Kegiatan</h2>
          <p class="mt-0.5 text-sm text-gray-500 dark:text-gray-400">
            {{ sessionsTotal }} sesi dari jadwal ini.
          </p>
        </div>
        <div v-if="can('manage_akademik')" class="flex flex-wrap items-center gap-2">
          <UButton
            icon="i-lucide-plus"
            color="neutral"
            variant="outline"
            size="sm"
            @click="createSessionOpen = true"
          >
            Buat Sesi
          </UButton>
          <UButton
            icon="i-lucide-zap"
            size="sm"
            class="bg-teal-600 text-white hover:bg-teal-700 dark:bg-teal-500 dark:hover:bg-teal-400"
            @click="generateOpen = true"
          >
            Generate Sesi
          </UButton>
        </div>
      </div>

      <div v-if="sessionsLoading" class="mt-3 flex justify-center py-8">
        <UIcon name="i-lucide-loader-circle" class="h-6 w-6 animate-spin text-teal-600" />
      </div>

      <div v-else-if="sessions.length === 0" class="mt-3 rounded-lg border border-dashed border-gray-300 p-6 text-center text-sm text-gray-500 dark:border-gray-600 dark:text-gray-400">
        Belum ada sesi untuk jadwal ini. Gunakan tombol "Generate Sesi" untuk membuatnya sekaligus.
      </div>

      <div v-else class="mt-3 overflow-hidden rounded-lg border border-gray-200 bg-white dark:border-gray-700/50 dark:bg-gray-900">
        <UTable :data="sessions" :columns="sessionColumns" :loading="sessionsLoading" class="w-full" :ui="{ th: 'text-gray-900 font-bold dark:text-gray-100' }">
          <template #starts_at-cell="{ row }">
            <span class="text-sm text-gray-700 dark:text-gray-300">{{ fmtDateTime(row.original.starts_at) }}</span>
          </template>
          <template #ends_at-cell="{ row }">
            <span class="text-sm text-gray-700 dark:text-gray-300">{{ fmtDateTime(row.original.ends_at) }}</span>
          </template>
          <template #status-cell="{ row }">
            <AkademikStatusBadge :status="row.original.status" type="session" size="sm" />
          </template>
          <template #actions-cell="{ row }">
            <UButton
              icon="i-lucide-eye"
              color="neutral"
              variant="outline"
              size="xs"
              @click="navigateTo(`/admin/akademik/sesi/${row.original.id}`)"
            >
              Buka
            </UButton>
          </template>
        </UTable>

        <div v-if="sessionsTotal > sessionsLimit" class="flex items-center justify-between border-t border-gray-200 px-4 py-3 dark:border-gray-700/50">
          <p class="text-sm text-gray-700 dark:text-gray-300">
            Hal. {{ sessionsPage }} / {{ totalPages }}
          </p>
          <UPagination
            v-model:page="sessionsPage"
            :total="sessionsTotal"
            :items-per-page="sessionsLimit"
            :sibling-count="1"
            show-edges
            size="sm"
          />
        </div>
      </div>
    </template>

    <AdminAkademikGenerateSessionsModal
      v-if="schedule"
      v-model:open="generateOpen"
      :schedule="schedule"
      @success="onGenerateSuccess"
    />

    <AdminAkademikSessionFormModal
      v-if="schedule"
      v-model:open="createSessionOpen"
      :schedule="schedule"
      @success="onSessionCreated"
    />

    <AdminAkademikScheduleFormModal
      v-model:open="editOpen"
      :activity-period-id="schedule?.activity_period_id ?? ''"
      :schedule="schedule"
      @success="saveEdit"
    />
  </div>
</template>
